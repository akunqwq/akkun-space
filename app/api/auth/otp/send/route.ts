// app/api/auth/otp/send/route.ts
// -----------------------------------------------------------------------------
// 发送邮箱验证码（POST { email }）。
//
// 防护三件套：
//   1. 频率限制：同一 IP 10 次/小时（入口即扣，无条件）
//              + 同一邮箱 5 次/小时（**成功投递后才扣**，失败不白扣用户额度）
//      二者分层的理由：IP 配额用于制止滥用，失败尝试也必须计入；邮箱配额用于
//      制止对单个收件人的骚扰，只有真发到用户手上才算数。详见 lib/auth/ratelimit.ts
//   2. 枚举防护：未注册邮箱返回与已注册完全一致的成功响应 + 统一响应耗时，
//      攻击者既拿不到"是否注册"的信息，也拿不到"响应快慢"这条时序侧信道
//   3. 投递隔离：验证码只发往已绑定账号的邮箱，对外表现却完全一致
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';
import { generateOtp, resendCooldown, storeOtp } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/auth/email';
import {
  QUOTA,
  clientIp,
  consumeRateLimit,
  enforceMinElapsed,
  hitRateLimit,
  inspectRateLimit,
} from '@/lib/auth/ratelimit';
import { isValidEmail } from '@/lib/auth/validate';
import type { AuthApiResponse } from '@/lib/auth/types';

export const runtime = 'nodejs'; // SMTP 依赖 Node net/tls
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  if (!supabaseAdmin) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '认证服务未配置' },
      { status: 502 },
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '请求格式无效' },
      { status: 400 },
    );
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '邮箱格式无效' },
      { status: 400 },
    );
  }

  const ip = clientIp(req);

  // —— 频率限制（IP 维度：入口即扣，必须无条件） ——
  // 若改成"成功才扣"，攻击者拿不存在的邮箱刷请求就永不扣配额，限流会被绕过。
  const ipQuota = await hitRateLimit(`otp:send:ip:${ip}`, QUOTA.otpSendIp);
  if (!ipQuota.allowed) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: `请求过于频繁，请 ${ipQuota.retryAfterSec}s 后再试` },
      { status: 429 },
    );
  }

  // —— 频率限制（邮箱维度：此处只"探查"不扣） ——
  // 配额的真正扣除发生在验证码确实投递出去之后（见文末 consumeRateLimit）。
  // 这样 SMTP 抖动、冷却拒绝、存储失败等都不会白扣用户配额。
  const emailBucket = `otp:send:email:${email}`;
  const emailQuota = await inspectRateLimit(emailBucket, QUOTA.otpSendEmail);
  if (!emailQuota.allowed) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: `该邮箱请求过于频繁，请 ${emailQuota.retryAfterSec}s 后再试` },
      { status: 429 },
    );
  }

  // —— 重发冷却（UX 层：同一邮箱 60s 内不重复发）——
  // 顺序要点：必须排在"扣配额"之前。否则用户连点两次第二次就被拒，
  // 却仍被扣掉一次配额，等于白白损失额度。
  const cooldown = await resendCooldown(email);
  if (cooldown > 0) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: `发送过于频繁，请 ${cooldown}s 后再试` },
      { status: 429 },
    );
  }

  // —— 账号是否存在：只有存在才真正生成并发送 ——
  const { data: account } = await supabaseAdmin
    .from('app_users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!account) {
    // 统一成功响应 + 恒定耗时，避免泄漏"该邮箱是否已注册"
    await enforceMinElapsed(startedAt);
    return NextResponse.json<AuthApiResponse>({ ok: true });
  }

  const code = generateOtp();
  try {
    await storeOtp(email, code);
  } catch (e) {
    console.error('[otp/send] 存储失败:', e);
    await enforceMinElapsed(startedAt);
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '验证码生成失败，请稍后重试' },
      { status: 502 },
    );
  }

  const result = await sendOtpEmail(email, code);

  // —— 配额落地：只有验证码确实到了用户手上（或本地回显）才扣 ——
  // delivered：SMTP/Resend 真发出；devCode：非 production 回显，等价一次真实发送，
  //   也要扣，否则本地永远测不到限流、且可作为绕过口子。
  // 彻底的投递失败不扣：用户一封都没收到，重试是合理诉求（IP 层仍兜底防滥用）。
  if (result.delivered || result.devCode) {
    await consumeRateLimit(emailBucket, QUOTA.otpSendEmail);
  }

  await enforceMinElapsed(startedAt);
  return NextResponse.json({
    ok: true,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  });
}
