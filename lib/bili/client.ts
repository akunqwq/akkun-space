// lib/bili/client.ts
// -----------------------------------------------------------------------------
// B 站 API 客户端：签名 + 请求 + 缓存（调 cache.ts 语义化函数）+ 降级。
// 强约束：本模块顶部 import 'server-only'，不进客户端 bundle。
//
// 关键纪律（阿鲲 U1）：
//   BiliClient 调用 getCachedBiliUp / getCachedBiliVideos / getCachedVideoStat
//   等 cache.ts 暴露的语义化函数，不直接接触 unstable_cache。
//   unstable_cache 调用只出现在 cache.ts 一层。
//
// 降级链路（命门）：
//   B 站接口失败 → cache.ts 的 fetcher 抛错 → cache.ts 返回 L1 旧数据 degraded=true
//   → 调用方（API Route / Server Component）据此提示前端"数据可能延迟"。
//   无旧数据时 cache.ts 抛错上来，调用方返回错误响应。
// -----------------------------------------------------------------------------
import 'server-only';

import type {
  BiliApiResponse,
  BiliRelationStat,
  BiliUpCard,
  BiliUpInfo,
  BiliVideoItem,
  BiliVideoListResponse,
  BiliVideoStat,
  CacheResult,
  UpCardInfo,
  UpInfoResult,
  VideoListData,
  VideoListResult,
} from './types';
import {
  getCachedBiliUp,
  getCachedBiliVideos,
  getCachedVideoStat,
} from './cache';
import { WbiSigner } from './wbi';

const BASE_URL = 'https://api.bilibili.com';

/** 默认请求头：模拟浏览器，避免被 B 站拒（未登录态 30-50 次/分钟） */
const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com/',
  'Accept': 'application/json, text/plain, */*',
};

/** 请求间随机延时（200-500ms 抖动）。
 *  仅作辅助手段，非核心解法：真正的稳定性来自 1h 缓存 + stale-while-revalidate
 *  + 熔断（Circuit Breaker）。randomDelay 只是抹平请求节奏，避免被 B 站瞬时识别为脚本。 */
function randomDelay(minMs = 200, maxMs = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --------------------------------------------------------------------------
// 熔断器（Circuit Breaker）：仅守护 WBI 的 arc/search 投稿列表接口。
// 该接口是社区公认风控最重的 B 站接口（服务器 IP 尤甚）。连续失败达阈值即"熔断"，
// 在冷却窗口内直接跳过实时请求（改走缓存/降级），避免对 B 站发起无效轰炸。
// 冷却结束后进入 half-open，放行一次探针；成功则复位，失败则重新熔断。
// --------------------------------------------------------------------------
type BreakerState = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: BreakerState = 'closed';
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly threshold = 3,
    private readonly cooldownMs = 60_000,
  ) {}

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() >= this.openedAt + this.cooldownMs) {
        this.state = 'half-open';
      } else {
        throw new Error('CircuitBreaker: open — arc/search 暂被熔断，跳过实时请求');
      }
    }
    try {
      const result = await fn();
      this.failures = 0;
      this.state = 'closed';
      return result;
    } catch (err) {
      this.failures += 1;
      if (this.failures >= this.threshold || this.state === 'half-open') {
        this.state = 'open';
        this.openedAt = Date.now();
      }
      throw err;
    }
  }
}

/** 全局共享的 arc/search 熔断器（同一服务器 IP，所有 mid 共用一份健康状态） */
const videoSearchBreaker = new CircuitBreaker(3, 60_000);

// --------------------------------------------------------------------------
// 退避重试（backoff retry）：仅在真正需要时重试，且用指数退避 + 抖动，
// 绝不做"马上再来一次"式紧循环。配合熔断器，瞬时抖动会被重试兜住，
// 持续故障会被熔断挡在门外。
// --------------------------------------------------------------------------
async function withBackoff<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseMs?: number; maxMs?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 1;
  const baseMs = opts.baseMs ?? 600;
  const maxMs = opts.maxMs ?? 2000;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      const backoff = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * backoff);
      await new Promise((r) => setTimeout(r, backoff + jitter));
    }
  }
}

// --------------------------------------------------------------------------
// buvid3（风控凭证）：B 站部分接口（尤其 WBI 签名接口）要求携带 buvid3 cookie，
// 否则返回 -352 风控校验失败。从 /x/frontend/finger/spi 的 data.b_3 获取，
// 模块级缓存复用（无需每次请求都拉取）。获取失败则降级为无 cookie 请求。
// --------------------------------------------------------------------------
let cachedBuvid3: string | null = null;
let buvid3Fetched = false;

async function getBuvid3Cookie(): Promise<string> {
  if (buvid3Fetched) return cachedBuvid3 ? `buvid3=${cachedBuvid3}` : '';
  buvid3Fetched = true;
  try {
    const resp = await fetch(`${BASE_URL}/x/frontend/finger/spi`, {
      headers: {
        'User-Agent': DEFAULT_HEADERS['User-Agent'],
        Referer: DEFAULT_HEADERS['Referer'],
      },
    });
    const json = (await resp.json()) as { data?: { b_3?: string } };
    if (json.data?.b_3) cachedBuvid3 = json.data.b_3;
  } catch {
    // 忽略：降级为无 cookie 请求
  }
  return cachedBuvid3 ? `buvid3=${cachedBuvid3}` : '';
}

/** 统一请求头：DEFAULT_HEADERS + buvid3 cookie（异步，供各 fetch 复用） */
async function authHeaders(): Promise<Record<string, string>> {
  const cookie = await getBuvid3Cookie();
  return cookie ? { ...DEFAULT_HEADERS, Cookie: cookie } : { ...DEFAULT_HEADERS };
}

/**
 * B 站 API 客户端。
 * 封装 4 个核心方法（getUpInfo / getRelationStat / getUpVideos / getVideoStat），
 * 内部走 cache.ts 双层缓存，失败时降级。
 */
export class BiliClient {
  private readonly signer: WbiSigner;

  constructor() {
    this.signer = new WbiSigner();
  }

  /** 获取 UP 主详情 + 粉丝/关注数 + 卡片（合并 acc/info + relation/stat + card）
   *  风控降级：acc/info（WBI 接口，服务器 IP 易被 B 站 -352 风控拦截）失败时，
   *  用非签名的 card 接口兜底出 name/face/level 等基础资料，标记 degraded=true，
   *  不让单接口失败导致整页崩溃。 */
  async getUpInfo(mid: number): Promise<CacheResult<UpInfoResult>> {
    return getCachedBiliUp(mid, async (): Promise<UpInfoResult> => {
      // relation/stat 与 card 均为非 WBI 接口，优先并发拉取（更稳）
      const [stat, card] = await Promise.all([
        this.fetchRelationStat(mid),
        this.fetchUpCard(mid),
      ]);

      let info: BiliUpInfo;
      let infoDegraded = false;
      try {
        info = await this.fetchUpInfo(mid);
      } catch {
        // acc/info 被风控：用 card 兜底，保证页面至少能渲染基础资料
        infoDegraded = true;
        info = this.buildInfoFromCard(card.card);
      }

      return {
        info,
        stat,
        card,
        degraded: infoDegraded,
        cachedAt: Date.now(),
      };
    });
  }

  /** 当 acc/info（WBI）被风控时，从非签名的 card 响应重建基础资料 */
  private buildInfoFromCard(c: UpCardInfo): BiliUpInfo {
    return {
      mid: Number(c.mid) || 0,
      name: c.name,
      face: c.face,
      sign: c.sign,
      level: c.level,
      official_verify: c.official_verify,
      vip_type: c.vip_type,
      vip_status: 0,
      live_room: {
        roomStatus: 0,
        liveStatus: 0,
        url: '',
        title: '',
        cover: '',
        roomid: 0,
      },
    };
  }

  /** 获取 UP 主投稿视频列表（分页）。
   *  架构：1h 缓存优先 → 命中立即返回；未命中才打 arc/search（WBI，风控重）。
   *  arc/search 经熔断 + 指数退避重试守护；失败则降级为 stale/无数据，
   *  不再让单接口异常拖垮整页。返回携带 videoStatus（fresh/stale/unavailable）。 */
  async getUpVideos(
    mid: number,
    page: number,
  ): Promise<VideoListResult> {
    return getCachedBiliVideos(mid, page, async () => {
      return videoSearchBreaker.exec(() => this.fetchUpVideosWithRetry(mid, page));
    });
  }

  /** arc/search 实时拉取（带退避重试，绝不做"立即重试"） */
  private async fetchUpVideosWithRetry(
    mid: number,
    page: number,
  ): Promise<BiliVideoListResponse> {
    return withBackoff(() => this.fetchUpVideos(mid, page), {
      retries: 1,
      baseMs: 600,
      maxMs: 2000,
    });
  }

  /** 获取单视频互动统计 */
  async getVideoStat(bvid: string): Promise<CacheResult<BiliVideoStat>> {
    return getCachedVideoStat(bvid, async () => {
      return this.fetchVideoStat(bvid);
    });
  }

  /** 获取 UP 主关注/粉丝数（Cron 快照采样用，不走缓存以拿最新值） */
  async getRelationStat(mid: number): Promise<BiliRelationStat> {
    return this.fetchRelationStat(mid);
  }

  // --------------------------------------------------------------------------
  // 内部 fetch 实现
  // --------------------------------------------------------------------------

  /** /x/space/wbi/acc/info — UP 主详情（需 WBI 签名） */
  private async fetchUpInfo(mid: number): Promise<BiliUpInfo> {
    const params: Record<string, string> = { mid: String(mid) };
    const { w_rid, wts } = await this.signer.sign(params);
    const url = `${BASE_URL}/x/space/wbi/acc/info?mid=${mid}&w_rid=${w_rid}&wts=${wts}`;
    await randomDelay();
    const resp = await fetch(url, { headers: await authHeaders() });
    if (!resp.ok) {
      throw new Error(`BiliClient.fetchUpInfo: status=${resp.status}`);
    }
    const json = (await resp.json()) as BiliApiResponse<{
      mid: number;
      name: string;
      face: string;
      sign: string;
      level: number;
      official?: { role?: number; type?: number };
      vip?: { type?: number; status?: number };
      live_room?: {
        roomStatus: number;
        liveStatus: number;
        url: string;
        title: string;
        cover: string;
        roomid: number;
      };
    }>;
    if (json.code !== 0 || !json.data) {
      throw new Error(`BiliClient.fetchUpInfo: bili code=${json.code} msg=${json.message}`);
    }
    const d = json.data;
    return {
      mid: d.mid,
      name: d.name,
      face: d.face,
      sign: d.sign,
      level: d.level,
      // acc/info 的 official 字段用 role（0=未认证 / 1=个人 / 2=机构），取反逻辑
      official_verify: (d.official?.role ?? 0) !== 0,
      vip_type: d.vip?.type ?? 0,
      vip_status: d.vip?.status ?? 0,
      live_room: {
        roomStatus: d.live_room?.roomStatus ?? 0,
        liveStatus: d.live_room?.liveStatus ?? 0,
        url: d.live_room?.url ?? '',
        title: d.live_room?.title ?? '',
        cover: d.live_room?.cover ?? '',
        roomid: d.live_room?.roomid ?? 0,
      },
    };
  }

  /** /x/relation/stat — UP 主关注/粉丝数（无 WBI） */
  private async fetchRelationStat(mid: number): Promise<BiliRelationStat> {
    const url = `${BASE_URL}/x/relation/stat?vmid=${mid}`;
    await randomDelay();
    const resp = await fetch(url, { headers: await authHeaders() });
    if (!resp.ok) {
      throw new Error(`BiliClient.fetchRelationStat: status=${resp.status}`);
    }
    const json = (await resp.json()) as BiliApiResponse<{
      mid: number;
      following: number;
      follower: number;
      whisper: number;
    }>;
    if (json.code !== 0 || !json.data) {
      throw new Error(`BiliClient.fetchRelationStat: bili code=${json.code}`);
    }
    return {
      mid: json.data.mid,
      following: json.data.following,
      follower: json.data.follower,
      whisper: json.data.whisper,
    };
  }

  /** /x/web-interface/card — UP 主卡片（无 WBI，含粉丝/关注/视频数/文章数/基础资料）
   *  字段注意：
   *   - archive_count / article_count 在响应 data 层级（非 data.card）
   *   - level 嵌套在 data.card.level_info.current_level
   *   - name/face/sign/official_verify/vip 也在此（acc/info 风控失败时的兜底来源）
   */
  private async fetchUpCard(mid: number): Promise<BiliUpCard> {
    const url = `${BASE_URL}/x/web-interface/card?mid=${mid}`;
    await randomDelay();
    const resp = await fetch(url, { headers: await authHeaders() });
    if (!resp.ok) {
      throw new Error(`BiliClient.fetchUpCard: status=${resp.status}`);
    }
    const json = (await resp.json()) as BiliApiResponse<{
      card?: {
        mid: string;
        name: string;
        face: string;
        sign: string;
        attention: number;
        fans: number;
        level_info?: { current_level?: number };
        official_verify?: { type?: number };
        vip?: { type?: number };
      };
      archive_count?: number;
      article_count?: number;
      following?: boolean;
    }>;
    if (json.code !== 0 || !json.data?.card) {
      throw new Error(`BiliClient.fetchUpCard: bili code=${json.code}`);
    }
    const c = json.data.card;
    return {
      card: {
        mid: c.mid,
        name: c.name,
        face: c.face,
        sign: c.sign,
        level: c.level_info?.current_level ?? 0,
        official_verify: (c.official_verify?.type ?? 0) !== 0,
        vip_type: c.vip?.type ?? 0,
        fans: c.fans,
        attention: c.attention,
        archive_count: json.data.archive_count ?? 0,
        article_count: json.data.article_count ?? 0,
      },
      following: json.data.following ?? false,
    };
  }

  /** /x/space/wbi/arc/search — UP 主投稿视频列表（需 WBI 签名，分页） */
  private async fetchUpVideos(
    mid: number,
    page: number,
  ): Promise<BiliVideoListResponse> {
    const params: Record<string, string> = {
      mid: String(mid),
      pn: String(page),
      ps: '20',
      tid: '0',
      order: 'pubdate',
    };
    const { w_rid, wts } = await this.signer.sign(params);
    const query = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const url = `${BASE_URL}/x/space/wbi/arc/search?${query}&w_rid=${w_rid}&wts=${wts}`;
    await randomDelay();
    const resp = await fetch(url, { headers: await authHeaders() });
    if (!resp.ok) {
      throw new Error(`BiliClient.fetchUpVideos: status=${resp.status}`);
    }
    const json = (await resp.json()) as BiliApiResponse<{
      list?: {
        vlist?: Array<Record<string, unknown>>;
        tlist?: Record<string, { tid: number; count: number; name: string }>;
      };
      page?: { pn: number; ps: number; count: number };
    }>;
    if (json.code !== 0 || !json.data) {
      throw new Error(`BiliClient.fetchUpVideos: bili code=${json.code} msg=${json.message}`);
    }
    const d = json.data;
    const vlist: BiliVideoItem[] = (d.list?.vlist ?? []).map((v) => ({
      bvid: String(v.bvid ?? ''),
      aid: Number(v.aid ?? 0),
      title: String(v.title ?? ''),
      play: Number(v.play ?? 0),
      video_review: Number(v.video_review ?? 0),
      danmaku: Number(v.danmaku ?? 0),
      reply: Number(v.reply ?? 0),
      favorite: Number(v.favorite ?? 0),
      coin: Number(v.coin ?? 0),
      share: Number(v.share ?? 0),
      like: Number(v.like ?? 0),
      created: Number(v.created ?? 0),
      length: String(v.length ?? ''),
      pic: String(v.pic ?? ''),
    }));
    const tlist = d.list?.tlist ?? {};
    const pageinfo = d.page ?? { pn: page, ps: 20, count: vlist.length };
    const listData: VideoListData = {
      vlist,
      tlist,
      page: pageinfo,
    };
    return { list: listData };
  }

  /** /x/web-interface/view — 单视频统计（无 WBI，按 bvid） */
  private async fetchVideoStat(bvid: string): Promise<BiliVideoStat> {
    const url = `${BASE_URL}/x/web-interface/view?bvid=${bvid}`;
    await randomDelay();
    const resp = await fetch(url, { headers: await authHeaders() });
    if (!resp.ok) {
      throw new Error(`BiliClient.fetchVideoStat: status=${resp.status}`);
    }
    const json = (await resp.json()) as BiliApiResponse<{
      bvid: string;
      aid: number;
      stat?: {
        view: number;
        danmaku: number;
        reply: number;
        favorite: number;
        coin: number;
        share: number;
        like: number;
        now_rank: number;
        his_rank: number;
      };
    }>;
    if (json.code !== 0 || !json.data?.stat) {
      throw new Error(`BiliClient.fetchVideoStat: bili code=${json.code} msg=${json.message}`);
    }
    return {
      bvid: json.data.bvid,
      aid: json.data.aid,
      view: json.data.stat.view,
      danmaku: json.data.stat.danmaku,
      reply: json.data.stat.reply,
      favorite: json.data.stat.favorite,
      coin: json.data.stat.coin,
      share: json.data.stat.share,
      like: json.data.stat.like,
      now_rank: json.data.stat.now_rank,
      his_rank: json.data.stat.his_rank,
    };
  }
}

/** 单例：整个应用共用一个 BiliClient 实例（WbiSigner 内部缓存密钥） */
let biliClient: BiliClient | null = null;

/** 获取 BiliClient 单例 */
export function getBiliClient(): BiliClient {
  if (!biliClient) {
    biliClient = new BiliClient();
  }
  return biliClient;
}
