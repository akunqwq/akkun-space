// lib/auth/otp.ts
// -----------------------------------------------------------------------------
// 邮箱验证码（OTP）的生成 / 存储 / 校验（server-only）。
// 验证码明文只经网络发往用户邮箱，库内仅存 SHA-256；10 分钟有效，最多尝试 5 次。
// 依赖 supabaseAdmin（service_role 绕 RLS），与 005 migration 配套。
// -----------------------------------------------------------------------------
import 'server-only';

import { createHash, randomInt } from 'node:crypto';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 分钟
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // 同邮箱 60s 内不可重发

/** 生成 6 位数字的密码学安全验证码 */
export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** 写入/覆盖某邮箱的验证码（upsert，10 分钟有效）。失败抛错。 */
export async function storeOtp(email: string, code: string): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase admin client 未配置（缺 SERVICE_ROLE_KEY）');
  const { error } = await supabaseAdmin.from('app_otp_codes').upsert(
    {
      email,
      code_hash: hashOtp(code),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      attempts: 0,
    },
    { onConflict: 'email' },
  );
  if (error) throw new Error(`存储验证码失败: ${error.message}`);
}

/**
 * 重发冷却检查：若 60s 内已发过，返回剩余冷却秒数（>0），否则返回 0。
 */
export async function resendCooldown(email: string): Promise<number> {
  if (!supabaseAdmin) return 0;
  const { data } = await supabaseAdmin
    .from('app_otp_codes')
    .select('created_at')
    .eq('email', email)
    .maybeSingle();
  if (!data) return 0;
  const elapsed = Date.now() - new Date(String(data.created_at)).getTime();
  if (elapsed < RESEND_COOLDOWN_MS) {
    return Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
  }
  return 0;
}

export type OtpVerifyResult = 'ok' | 'not_found' | 'expired' | 'invalid' | 'too_many';

/** 校验验证码：成功即删行；过期/超限也删行，避免重放。 */
export async function verifyOtp(email: string, code: string): Promise<OtpVerifyResult> {
  if (!supabaseAdmin) return 'not_found';
  const { data, error } = await supabaseAdmin
    .from('app_otp_codes')
    .select('code_hash, expires_at, attempts')
    .eq('email', email)
    .maybeSingle();
  if (error || !data) return 'not_found';

  // 过期：删行，视为已失效
  if (new Date(String(data.expires_at)).getTime() <= Date.now()) {
    await supabaseAdmin.from('app_otp_codes').delete().eq('email', email);
    return 'expired';
  }
  // 尝试过多：删行，需重新获取
  if ((data.attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    await supabaseAdmin.from('app_otp_codes').delete().eq('email', email);
    return 'too_many';
  }
  // 校验失败：累加尝试次数（不删行，允许重试直至超限）
  if (data.code_hash !== hashOtp(code)) {
    await supabaseAdmin
      .from('app_otp_codes')
      .update({ attempts: (data.attempts ?? 0) + 1 })
      .eq('email', email);
    return 'invalid';
  }
  // 成功：删行
  await supabaseAdmin.from('app_otp_codes').delete().eq('email', email);
  return 'ok';
}
