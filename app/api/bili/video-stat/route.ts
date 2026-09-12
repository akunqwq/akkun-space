// app/api/bili/video-stat/route.ts
// -----------------------------------------------------------------------------
// 单视频详情代理 API Route（GET ?bvid=xxx）
// BV 号查询播放/弹幕/收藏/投币/分享/点赞 + 标题/UP主/封面等元信息，缓存 5min。
// 独立 tool 页 /tools/bili-video 的 VideoStatQuery 组件调用。
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { BiliApiError, getBiliClient } from '@/lib/bili/client';
import type { BiliVideoDetail } from '@/lib/bili/types';

export const dynamic = 'force-dynamic';

/** B 站业务错误码 → 用户可读的中文提示（透传给前端，避免笼统"查询失败"） */
function friendlyBiliMessage(code: number, raw: string): string {
  switch (code) {
    case 62002:
      return '稿件不可见（可能被删除、审核中或受地域限制）';
    case -404:
    case 62004:
      return '视频不存在，请检查 BV 号';
    case -400:
      return 'BV 号无效';
    case -352:
    case -403:
      return '接口受 B 站风控限制，请稍后重试';
    default:
      return raw || '查询失败';
  }
}

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
    const data: BiliVideoDetail = result.data;
    return NextResponse.json({
      code: 0,
      data,
      degraded: result.degraded,
    });
  } catch (err) {
    // B 站业务错误（稿件不可见/不存在/风控）：透传可读提示，返回 200 让前端展示具体原因
    if (err instanceof BiliApiError) {
      return NextResponse.json({
        code: err.biliCode,
        message: friendlyBiliMessage(err.biliCode, err.biliMessage),
      });
    }
    const message = err instanceof Error ? err.message : '未知错误';
    console.error('[bili/video-stat] 获取失败:', message);
    return NextResponse.json(
      { code: -1, message: 'B 站接口暂时不可用，请稍后重试' },
      { status: 502 },
    );
  }
}
