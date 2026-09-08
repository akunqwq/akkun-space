// app/api/bili/video-stat/route.ts
// -----------------------------------------------------------------------------
// 单视频统计代理 API Route（GET ?bvid=xxx）
// BV 号查询播放/弹幕/收藏/投币/分享/点赞，缓存 5min。
// 内嵌于 UP 主详情页底部的 VideoStatQuery 组件调用。
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { getBiliClient } from '@/lib/bili/client';
import type { BiliVideoStat } from '@/lib/bili/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bvid = searchParams.get('bvid');
  if (!bvid) {
    return NextResponse.json(
      { code: -1, message: '缺少 bvid 参数' },
      { status: 400 },
    );
  }
  // 简单校验 BV 号格式（BV1 开头，长度 12 左右）
  if (!/^BV[a-zA-Z0-9]{8,}$/.test(bvid)) {
    return NextResponse.json(
      { code: -1, message: 'bvid 参数格式无效' },
      { status: 400 },
    );
  }

  const client = getBiliClient();
  try {
    const result = await client.getVideoStat(bvid);
    const data: BiliVideoStat = result.data;
    return NextResponse.json({
      code: 0,
      data,
      degraded: result.degraded,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    console.error('[bili/video-stat] 获取失败:', message);
    return NextResponse.json(
      { code: -1, message: 'B 站接口暂时不可用，请稍后重试' },
      { status: 502 },
    );
  }
}
