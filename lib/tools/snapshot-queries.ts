// lib/tools/snapshot-queries.ts
// -----------------------------------------------------------------------------
// UP 主快照 Supabase 查询/写入层。
// 强约束：本模块顶部 import 'server-only'，用 supabaseAdmin（绕 RLS）。
// 用途：
//   1. API Route 查询 UP 主时 upsert bili_up_tracked（标记追踪）
//   2. Cron 任务读 tracked 列表 + 写 bili_up_snapshots
//   3. P1 增长曲线读快照列表（第一版只采样不展示，但读接口预留）
// -----------------------------------------------------------------------------
import 'server-only';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';
import type { BiliUpSnapshot, BiliUpTracked } from '@/lib/bili/types';

/**
 * 快照查询器：封装 bili_up_tracked / bili_up_snapshots 读写。
 */
export class SnapshotQueries {
  /** 用户查询 UP 主时 upsert 追踪记录（更新 last_queried_at） */
  async upsertTracked(mid: number, name: string): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('SnapshotQueries: supabaseAdmin 未配置');
    }
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('bili_up_tracked')
      .upsert(
        {
          mid,
          name,
          last_queried_at: now,
        },
        { onConflict: 'mid' },
      );
    if (error) {
      throw new Error(`SnapshotQueries.upsertTracked: ${error.message}`);
    }
  }

  /** 获取所有被追踪的 UP 主（Cron 采样用，按最近查询时间降序） */
  async getTrackedUps(): Promise<BiliUpTracked[]> {
    if (!supabaseAdmin) {
      throw new Error('SnapshotQueries: supabaseAdmin 未配置');
    }
    const { data, error } = await supabaseAdmin
      .from('bili_up_tracked')
      .select('*')
      .order('last_queried_at', { ascending: false });
    if (error) {
      throw new Error(`SnapshotQueries.getTrackedUps: ${error.message}`);
    }
    return (data ?? []) as BiliUpTracked[];
  }

  /** 写入一条粉丝数快照（Cron 每日调用） */
  async insertSnapshot(
    mid: number,
    follower: number,
    following: number,
  ): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('SnapshotQueries: supabaseAdmin 未配置');
    }
    const { error } = await supabaseAdmin.from('bili_up_snapshots').insert({
      mid,
      follower_count: follower,
      following_count: following,
      sampled_at: new Date().toISOString(),
    });
    if (error) {
      throw new Error(`SnapshotQueries.insertSnapshot: ${error.message}`);
    }
  }

  /** 获取某 UP 主近 N 条快照（P1 增长曲线用，第一版只采样不展示） */
  async getSnapshots(mid: number, limit: number): Promise<BiliUpSnapshot[]> {
    if (!supabaseAdmin) {
      throw new Error('SnapshotQueries: supabaseAdmin 未配置');
    }
    const { data, error } = await supabaseAdmin
      .from('bili_up_snapshots')
      .select('*')
      .eq('mid', mid)
      .order('sampled_at', { ascending: false })
      .limit(limit);
    if (error) {
      throw new Error(`SnapshotQueries.getSnapshots: ${error.message}`);
    }
    return (data ?? []) as BiliUpSnapshot[];
  }
}

/** 单例 */
let snapshotQueries: SnapshotQueries | null = null;

export function getSnapshotQueries(): SnapshotQueries {
  if (!snapshotQueries) {
    snapshotQueries = new SnapshotQueries();
  }
  return snapshotQueries;
}
