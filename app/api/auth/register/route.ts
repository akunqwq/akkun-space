// app/api/auth/register/route.ts
// -----------------------------------------------------------------------------
// 注册（POST { username, password, email? }）：成功即建立会话（免二次登录）。
// 账号名统一去空格；邮箱可选、统一小写去重；明文响应体只回 { ok }，会话走 HttpOnly cookie。
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';
import { hashPassword } from '@/lib/auth/hash';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { QUOTA, clientIp, hitRateLimit } from '@/lib/auth/ratelimit';
import type { AuthApiResponse } from '@/lib/auth/types';
import { isValidEmail, validatePassword, validateUsername } from '@/lib/auth/validate';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '认证服务未配置' },
      { status: 502 },
    );
  }

  let body: { username?: string; password?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '请求格式无效' },
      { status: 400 },
    );
  }

  const username = (body.username ?? '').trim();
  const emailRaw = (body.email ?? '').trim();
  const email = emailRaw ? emailRaw.toLowerCase() : null;
  const password = body.password ?? '';

  const unameErr = validateUsername(username);
  if (unameErr) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: unameErr },
      { status: 400 },
    );
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '邮箱格式无效' },
      { status: 400 },
    );
  }
  const pwError = validatePassword(password);
  if (pwError) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: pwError },
      { status: 400 },
    );
  }

  // —— 频率限制（IP 维度） ——
  // 注册必然要告诉用户"账号名/邮箱已占用"（否则无法完成注册），这是一条
  // 客观存在的枚举面；靠配额把批量探测的成本抬到不可行，是此处的正解。
  const ipQuota = await hitRateLimit(
    `register:ip:${clientIp(req)}`,
    QUOTA.registerIp,
  );
  if (!ipQuota.allowed) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: `操作过于频繁，请 ${ipQuota.retryAfterSec}s 后再试` },
      { status: 429 },
    );
  }

  // 账号名查重（个人站点，明确提示优于模糊提示——防枚举收益为零）
  const { data: byName } = await supabaseAdmin
    .from('app_users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (byName) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '该账号名已被占用，请换一个' },
      { status: 409 },
    );
  }

  // 邮箱查重（仅在提供了邮箱时）
  if (email) {
    const { data: byEmail } = await supabaseAdmin
      .from('app_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (byEmail) {
      return NextResponse.json<AuthApiResponse>(
        { ok: false, error: '该邮箱已注册，请直接登录' },
        { status: 409 },
      );
    }
  }

  const { data: created, error } = await supabaseAdmin
    .from('app_users')
    .insert({ username, email, password_hash: await hashPassword(password) })
    .select('id')
    .single();
  if (error || !created) {
    console.error('[auth/register] 建号失败:', error?.message);
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '注册失败，请稍后重试' },
      { status: 502 },
    );
  }

  const token = await createSession(created.id);
  await setSessionCookie(token);
  return NextResponse.json<AuthApiResponse>({ ok: true });
}
