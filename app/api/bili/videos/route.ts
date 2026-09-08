// app/api/bili/videos/route.ts
// -----------------------------------------------------------------------------
// UP 主投稿视频列表代理 API Route（GET ?mid=xxx&page=1）
// 分页 ≤20 条/页，缓存 1h（cache.ts 双层缓存兜底）。
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { getBiliClient } from '@/lib/bili/client';
import type { VideoStatus } from '@/lib/bili/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const midStr = searchParams.get('mid');
  const pageStr = searchParams.get('page') ?? '1';

  if (!midStr) {
    return NextResponse.json(
      { code: -1, message: '缺少 mid 参数' },
      { status: 400 },
    );
  }
  const mid = Number(midStr);
  const page = Number(pageStr);
  if (!Number.isFinite(mid) || mid <= 0) {
    return NextResponse.json(
      { code: -1, message: 'mid 参数无效' },
      { status: 400 },
    );
  }
  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json(
      { code: -1, message: 'page 参数无效' },
      { status: 400 },
    );
  }

  const client = getBiliClient();
  try {
    // getUpVideos 已内置缓存 + 熔断 + 降级：即使 B 站不可达也返回结果（status=unavailable），
    // 不会抛错到这里。videoStatus 由前端据此展示对应提示。
    const result = await client.getUpVideos(mid, page);
    const videoStatus: VideoStatus = result.status;
    return NextResponse.json({
      code: 0,
      data: { videos: result.videos, videoTotal: result.videoTotal },
      videoStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    console.error('[bili/videos] 获取失败:', message);
    return NextResponse.json(
      { code: -1, message: 'B 站接口暂时不可用，请稍后重试' },
      { status: 502 },
    );
  }
}
