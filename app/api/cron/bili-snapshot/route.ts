// app/api/cron/bili-snapshot/route.ts
// -----------------------------------------------------------------------------
// Vercel Cron 每日快照采样（GET，CRON_SECRET 鉴权）
// 流程（架构 4.3）：
//   1. 验证 CRON_SECRET（Header Authorization: Bearer xxx）
//   2. 查 bili_up_tracked 获取被追踪的 UP 主列表
//   3. 遍历：调 BiliClient.getRelationStat（不走缓存拿最新粉丝数）
//      间隔 2-5s 随机延时防 IP 限制
//   4. 写 bili_up_snapshots
//   5. 返回 { sampled: N, failed: M }
// 强约束：CRON_SECRET 不匹配返回 401。
// Vercel Cron 60s 超时：第一版追踪数有限（只有被查询过的），够用（架构 U2）。
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { getBiliClient } from '@/lib/bili/client';
import { getSnapshotQueries } from '@/lib/tools/snapshot-queries';

export const dynamic = 'force-dynamic';

/** 校验 CRON_SECRET：Vercel Cron 会在 Authorization Header 传 Bearer token */
function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // 未配置 CRON_SECRET 时拒绝执行（避免任意访问触发采样）
    return false;
  }
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  // 常量时间比较，防时序攻击
  if (token.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

/** 2-5s 随机延时（调研 1.1.3：防 B 站 IP 限制） */
function randomDelay(minSec = 2, maxSec = 5): Promise<void> {
  const sec = Math.random() * (maxSec - minSec) + minSec;
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json(
      { code: -1, message: 'Unauthorized: CRON_SECRET 校验失败' },
      { status: 401 },
    );
  }

  const sq = getSnapshotQueries();
  const client = getBiliClient();

  let tracked: Awaited<ReturnType<typeof sq.getTrackedUps>>;
  try {
    tracked = await sq.getTrackedUps();
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    console.error('[cron/bili-snapshot] 获取追踪列表失败:', message);
    return NextResponse.json(
      { code: -1, message: '获取追踪 UP 主列表失败' },
      { status: 500 },
    );
  }

  let sampled = 0;
  let failed = 0;

  for (const up of tracked) {
    try {
      const stat = await client.getRelationStat(up.mid);
      await sq.insertSnapshot(up.mid, stat.follower, stat.following);
      sampled += 1;
      // 随机延时 2-5s 防限流（最后一个不延时）
      await randomDelay();
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : '未知错误';
      console.error(`[cron/bili-snapshot] 采样 mid=${up.mid} 失败:`, message);
      // 继续下一个，不中断整批
    }
  }

  return NextResponse.json({
    code: 0,
    data: { sampled, failed, total: tracked.length },
  });
}
