// app/api/auth/otp/verify/route.ts
// -----------------------------------------------------------------------------
// 校验邮箱验证码并登录（POST { email, code }）。
// 校验通过 → 按绑定邮箱找到账号 → 建会话 + HttpOnly cookie（与密码登录等价）。
//
// 枚举防护：
//   · 同一 IP 20 次/小时，堵住对 6 位数字的暴力枚举（叠加验证码自带 5 次尝试上限）
//   · not_found（压根没有待校验记录）与 invalid（码不对）合并为同一文案，
//     否则攻击者能据此区分"这个邮箱有没有在验证码流程里"
//   · 所有失败分支统一恒定耗时，堵住时序侧信道
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';
import { verifyOtp } from '@/lib/auth/otp';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import {
  QUOTA,
  clientIp,
  enforceMinElapsed,
  hitRateLimit,
} from '@/lib/auth/ratelimit';
import { isValidEmail } from '@/lib/auth/validate';
import type { AuthApiResponse } from '@/lib/auth/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  if (!supabaseAdmin) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '认证服务未配置' },
      { status: 502 },
    );
  }

  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '请求格式无效' },
      { status: 400 },
    );
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const code = (body.code ?? '').trim();
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '邮箱或验证码格式无效' },
      { status: 400 },
    );
  }

  // —— 频率限制（IP 维度：防验证码暴力枚举） ——
  const ip = clientIp(req);
  const ipQuota = await hitRateLimit(`otp:verify:ip:${ip}`, QUOTA.otpVerifyIp);
  if (!ipQuota.allowed) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: `尝试过于频繁，请 ${ipQuota.retryAfterSec}s 后再试` },
      { status: 429 },
    );
  }

  const result = await verifyOtp(email, code);
  if (result !== 'ok') {
    // not_found 与 invalid 同文案：不泄漏"该邮箱是否处于验证码流程中"
    const errorMsg =
      result === 'expired'
        ? '验证码已过期，请重新获取'
        : result === 'too_many'
          ? '尝试次数过多，请重新获取'
          : '验证码不正确或已失效';
    await enforceMinElapsed(startedAt);
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: errorMsg },
      { status: 401 },
    );
  }

  // 校验通过：按邮箱找到账号并建会话
  const { data: account, error } = await supabaseAdmin
    .from('app_users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (error || !account) {
    // 正常流程不可达（能校验通过即说明邮箱已绑定账号），统一按失败处理
    await enforceMinElapsed(startedAt);
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '验证码不正确或已失效' },
      { status: 401 },
    );
  }

  const token = await createSession(account.id);
  await setSessionCookie(token);
  await enforceMinElapsed(startedAt);
  return NextResponse.json<AuthApiResponse>({ ok: true });
}
