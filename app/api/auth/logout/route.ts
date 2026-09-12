// app/api/auth/logout/route.ts
// -----------------------------------------------------------------------------
// 注销（POST）：删库中会话 + 清 cookie。幂等——未登录调用也返回 ok。
// -----------------------------------------------------------------------------
import { NextResponse } from 'next/server';

import { destroySession } from '@/lib/auth/session';
import type { AuthApiResponse } from '@/lib/auth/types';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await destroySession();
  } catch (err) {
    // destroySession 幂等，到这里只可能是 cookie 处理异常；仍然告知前端已退出
    console.error('[auth/logout] 异常:', err instanceof Error ? err.message : err);
  }
  return NextResponse.json<AuthApiResponse>({ ok: true });
}
