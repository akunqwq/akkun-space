// app/api/auth/me/route.ts
// -----------------------------------------------------------------------------
// 轻量登录态探测（GET）→ { authed, user? }。供全局音乐守卫等客户端组件判断登录态，
// 避免把 cookies() 拉进 root layout 导致整站变动态渲染。
// 仅回传非敏感字段（username/email），绝不回传 password_hash 或 token。
// -----------------------------------------------------------------------------
import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authed: false, user: null });
  }
  return NextResponse.json({
    authed: true,
    user: { username: user.username, email: user.email },
  });
}
