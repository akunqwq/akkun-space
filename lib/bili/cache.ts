// lib/bili/cache.ts
// -----------------------------------------------------------------------------
// B 站缓存封装层（阿鲲 U1 决策覆盖架构师原设计）。
// 强约束：本模块顶部 import 'server-only'，不进客户端 bundle。
//
// 设计要点：
//   1. 对外暴露 3 个语义化函数 getCachedBiliUp / getCachedBiliVideos /
//      getCachedVideoStat，BiliClient 和 API Route 都调这些函数，不直接接触
//      unstable_cache。未来 Next.js API 演进只改这一层。
//   2. 内部用 unstable_cache（Vercel Data Cache 跨实例持久）+ 模块级 Map
//      （L1 同实例快速命中）双层。
//   3. unstable_cache 调用只出现在本文件，其他模块零接触。
//   4. 缓存 key 命名规范见架构设计 7.2 节：bili:up:info:{mid} / bili:videos:{mid}:{page} /
//      bili:videostat:{bvid}。
// -----------------------------------------------------------------------------
import 'server-only';

import { unstable_cache } from 'next/cache';

import type {
  BiliVideoListResponse,
  BiliVideoStat,
  CacheResult,
  UpInfoResult,
} from './types';

// -----------------------------------------------------------------------------
// L1：模块级 Map TTL 缓存（同实例快速命中，避免重复 unstable_cache 跨进程开销）
// -----------------------------------------------------------------------------

interface CacheEntry {
  data: unknown;
  expiresAt: number;
  // 是否是降级保留下来的旧数据
  degraded: boolean;
}

const l1Store = new Map<string, CacheEntry>();

/** L1 读：未命中或已过期返回 null */
function l1Get<T>(key: string): CacheResult<T> | null {
  const entry = l1Store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    // 过期但保留旧数据用于降级，返回 degraded=true
    return {
      data: entry.data as T,
      degraded: true,
      cachedAt: entry.expiresAt - (entry.expiresAt - 0),
    };
  }
  return {
    data: entry.data as T,
    degraded: false,
    cachedAt: Date.now(),
  };
}

/** L1 写：同时缓存新鲜数据和降级用旧数据（降级时不覆盖 expiresAt） */
function l1Set<T>(
  key: string,
  data: T,
  ttlMs: number,
  opts: { degraded?: boolean } = {},
): void {
  l1Store.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    degraded: opts.degraded ?? false,
  });
}

/**
 * L1 降级读：当 B 站接口失败时，即便数据过期也返回旧数据。
 * 返回数据时标记 degraded=true，调用方据此提示用户。
 */
function l1GetStale<T>(key: string): CacheResult<T> | null {
  const entry = l1Store.get(key);
  if (!entry) return null;
  return {
    data: entry.data as T,
    degraded: true,
    cachedAt: entry.expiresAt,
  };
}

// -----------------------------------------------------------------------------
// L2：unstable_cache（Vercel Data Cache 跨实例持久）
// 阿鲲 U1：unstable_cache 调用只出现在本文件。
// L2 只作为新鲜数据的持久层，降级逻辑由 L1 + fetcher 兜底。
// -----------------------------------------------------------------------------

// L2 fetcher 签名：返回新鲜数据，失败时抛错（由调用方降级）
type L2Fetcher<T> = () => Promise<T>;

/** 包装 unstable_cache，统一错误处理和 key 前缀 */
function wrapL2<T>(
  cacheKey: string[],
  revalidateSec: number,
  fetcher: L2Fetcher<T>,
): Promise<T> {
  const fn = unstable_cache(fetcher, cacheKey, {
    revalidate: revalidateSec,
    // 不用 tags，避免 Vercel 免费计划限制；靠 revalidate TTL 自然过期
  });
  return fn();
}

// -----------------------------------------------------------------------------
// 语义化对外函数：getCachedBiliUp / getCachedBiliVideos / getCachedVideoStat
// 调用方传 fetcher（实际请求 B 站的逻辑），本层负责缓存命中/降级。
// fetcher 失败时：① 尝试 L1 旧数据 ② L1 也无则抛错给调用方
// -----------------------------------------------------------------------------

/** UP 主详情合并缓存 TTL：30min（架构 7.2） */
const UP_INFO_TTL_MS = 30 * 60 * 1000;
const UP_INFO_TTL_SEC = 30 * 60;

/** 投稿视频列表缓存 TTL：1h（架构 7.2） */
const VIDEOS_TTL_MS = 60 * 60 * 1000;
const VIDEOS_TTL_SEC = 60 * 60;

/** 单视频统计缓存 TTL：5min（架构 7.2，互动数据变化快） */
const VIDEO_STAT_TTL_MS = 5 * 60 * 1000;
const VIDEO_STAT_TTL_SEC = 5 * 60;

/**
 * 获取 UP 主详情（acc/info + relation/stat + card 合并体）。
 * fetcher 负责实际请求 B 站并返回合并后的 UpInfoResult（degraded 字段由本层填）。
 * fetcher 失败时尝试 L1 旧数据返回 degraded=true，L1 无数据则抛错。
 */
export async function getCachedBiliUp(
  mid: number,
  fetcher: () => Promise<UpInfoResult>,
): Promise<CacheResult<UpInfoResult>> {
  const key = `bili:up:info:${mid}`;

  // L1 命中（未过期）
  const l1Hit = l1Get<UpInfoResult>(key);
  if (l1Hit && !l1Hit.degraded) {
    return l1Hit;
  }

  try {
    // L2 unstable_cache：跨实例持久
    const data = await wrapL2<UpInfoResult>(
      [key],
      UP_INFO_TTL_SEC,
      fetcher,
    );
    const result: CacheResult<UpInfoResult> = {
      data,
      degraded: false,
      cachedAt: Date.now(),
    };
    l1Set(key, data, UP_INFO_TTL_MS);
    return result;
  } catch (err) {
    // L2/接口失败：降级返回 L1 旧数据
    const stale = l1GetStale<UpInfoResult>(key);
    if (stale) {
      return stale;
    }
    throw err;
  }
}

/**
 * 获取 UP 主投稿视频列表（分页）。
 * fetcher 负责实际请求 B 站 arc/search 接口。
 */
export async function getCachedBiliVideos(
  mid: number,
  page: number,
  fetcher: () => Promise<BiliVideoListResponse>,
): Promise<CacheResult<BiliVideoListResponse>> {
  const key = `bili:videos:${mid}:${page}`;

  const l1Hit = l1Get<BiliVideoListResponse>(key);
  if (l1Hit && !l1Hit.degraded) {
    return l1Hit;
  }

  try {
    const data = await wrapL2<BiliVideoListResponse>(
      [key],
      VIDEOS_TTL_SEC,
      fetcher,
    );
    const result: CacheResult<BiliVideoListResponse> = {
      data,
      degraded: false,
      cachedAt: Date.now(),
    };
    l1Set(key, data, VIDEOS_TTL_MS);
    return result;
  } catch (err) {
    const stale = l1GetStale<BiliVideoListResponse>(key);
    if (stale) {
      return stale;
    }
    throw err;
  }
}

/**
 * 获取单视频互动统计。
 * fetcher 负责实际请求 B 站 view 接口。
 * TTL 5min（互动数据变化快，但调用频次高，短缓存降负载）。
 */
export async function getCachedVideoStat(
  bvid: string,
  fetcher: () => Promise<BiliVideoStat>,
): Promise<CacheResult<BiliVideoStat>> {
  const key = `bili:videostat:${bvid}`;

  const l1Hit = l1Get<BiliVideoStat>(key);
  if (l1Hit && !l1Hit.degraded) {
    return l1Hit;
  }

  try {
    const data = await wrapL2<BiliVideoStat>(
      [key],
      VIDEO_STAT_TTL_SEC,
      fetcher,
    );
    const result: CacheResult<BiliVideoStat> = {
      data,
      degraded: false,
      cachedAt: Date.now(),
    };
    l1Set(key, data, VIDEO_STAT_TTL_MS);
    return result;
  } catch (err) {
    const stale = l1GetStale<BiliVideoStat>(key);
    if (stale) {
      return stale;
    }
    throw err;
  }
}

/**
 * 主动失效某个 UP 主的缓存（Cron 写快照后可选调用）。
 * L1 立即清除；L2 靠 revalidateTag 自然过期（本层未用 tag，此处只清 L1）。
 */
export function invalidateUpCache(mid: number): void {
  l1Store.delete(`bili:up:info:${mid}`);
  // 清所有分页
  for (const k of l1Store.keys()) {
    if (k.startsWith(`bili:videos:${mid}:`)) {
      l1Store.delete(k);
    }
  }
}
