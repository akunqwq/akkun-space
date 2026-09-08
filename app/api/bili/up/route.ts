// app/api/bili/up/route.ts
// -----------------------------------------------------------------------------
// UP 主信息 + 粉丝数代理 API Route（GET ?mid=xxx）
// 隐藏 WBI 签名，客户端不接触签名逻辑。
// 响应格式统一（架构 7.6）：{ code, data, degraded } / { code: -1, message }
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { getBiliClient } from '@/lib/bili/client';
import { getSnapshotQueries } from '@/lib/tools/snapshot-queries';
import type { BiliUpCard, BiliUpInfo, BiliRelationStat } from '@/lib/bili/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const midStr = searchParams.get('mid');
  if (!midStr) {
    return NextResponse.json(
      { code: -1, message: '缺少 mid 参数' },
      { status: 400 },
    );
  }
  const mid = Number(midStr);
  if (!Number.isFinite(mid) || mid <= 0) {
    return NextResponse.json(
      { code: -1, message: 'mid 参数无效，须为正整数' },
      { status: 400 },
    );
  }

  const client = getBiliClient();
  try {
    const result = await client.getUpInfo(mid);

    // 用户查询时 upsert 追踪记录（不阻塞响应，失败仅记日志）
    const sq = getSnapshotQueries();
    sq.upsertTracked(mid, result.data.info.name).catch((err) => {
      console.error('[bili/up] upsertTracked 失败:', err);
    });

    // 响应数据：info + stat + card（降级标记透传）
    const data: {
      info: BiliUpInfo;
      stat: BiliRelationStat;
      card: BiliUpCard;
    } = {
      info: result.data.info,
      stat: result.data.stat,
      card: result.data.card,
    };
    return NextResponse.json({
      code: 0,
      data,
      degraded: result.degraded,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    console.error('[bili/up] 获取失败:', message);
    return NextResponse.json(
      { code: -1, message: 'B 站接口暂时不可用，请稍后重试' },
      { status: 502 },
    );
  }
}
