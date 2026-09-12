// lib/auth/ratelimit.ts
// -----------------------------------------------------------------------------
// 请求层防护（server-only）：IP / 邮箱维度的发送频率限制 + 时序侧信道抹平。
//
// 为什么计数落库而不是放内存 Map：Vercel 是 Serverless，多实例间内存不共享、
// 冷启动即清零，内存计数在攻击者眼里等于不存在。故用 app_rate_limits 表做权威计数
// （固定窗口，惰性清理，与既有 app_sessions 懒清理同风格）。
//
// 依赖分层：这是一种"安全增强"，Supabase 缺失时选择优雅放行（graceful degradation）；
//          实际上调用方路由会先用 502 拦住 supabaseAdmin 缺失的情况。
// -----------------------------------------------------------------------------
import 'server-only';

import { type NextRequest } from 'next/server';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';

/** 固定窗口配额表 */
export const QUOTA = {
  /** 同一邮箱：1 小时内最多成功发出 5 次验证码（仅真正投递后才扣消耗） */
  otpSendEmail: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** 同一 IP：1 小时内最多请求 10 次验证码（换邮箱也躲不掉） */
  otpSendIp: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** 同一 IP：1 小时内最多提交 20 次校验（叠加上验证码自带 5 次尝试上限） */
  otpVerifyIp: { limit: 20, windowMs: 60 * 60 * 1000 },
  /** 同一 IP：15 分钟内最多 20 次密码登录尝试 */
  loginIp: { limit: 20, windowMs: 15 * 60 * 1000 },
  /** 同一 IP：1 小时内最多 10 次注册尝试（注册必然暴露占用状态，靠配额抬高枚举成本） */
  registerIp: { limit: 10, windowMs: 60 * 60 * 1000 },
} as const;

export interface RateResult {
  allowed: boolean;
  retryAfterSec: number;
}

/**
 * 取客户端来源 IP。
 * 注意：x-forwarded-for 是代理写入的普通请求头，只有在「请求必经可信代理」的前提下
 * 才是最左侧真实 IP。本项目部署在 Vercel，其边缘节点会覆写该头，可信；
 * 若日后自建 Nginx 反代，务必保证不透传客户端伪造的 XFF。
 */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip')?.trim();
  return real || 'unknown';
}

type Quota = { limit: number; windowMs: number };

/**
 * 读取当前窗口内的计数；窗口已过期则返回 0 并以 now 作为新窗口起点。
 * 依赖缺失时返回 0（fail-open）——调用方路由会先用 502 拦住这种情况。
 */
async function readBucket(
  bucketKey: string,
  quota: Quota,
): Promise<{ count: number; windowStartMs: number }> {
  const now = Date.now();
  if (!supabaseAdmin) return { count: 0, windowStartMs: now };

  const { data } = await supabaseAdmin
    .from('app_rate_limits')
    .select('window_start, count')
    .eq('bucket_key', bucketKey)
    .maybeSingle();

  if (data) {
    const startMs = new Date(String(data.window_start)).getTime();
    // 窗口未过期 → 沿用原窗口与计数；已过期 → 归零并重置窗口起点
    if (now - startMs < quota.windowMs) {
      return { count: data.count ?? 0, windowStartMs: startMs };
    }
  }
  return { count: 0, windowStartMs: now };
}

/**
 * 只读探查：配额是否已用尽？不修改任何计数。
 * 用于"成功才扣消耗"语义——先问够不够，真做成事了再 consumeRateLimit。
 */
export async function inspectRateLimit(
  bucketKey: string,
  quota: Quota,
): Promise<RateResult> {
  const { count, windowStartMs } = await readBucket(bucketKey, quota);
  if (count >= quota.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(
        1,
        Math.ceil((quota.windowMs - (Date.now() - windowStartMs)) / 1000),
      ),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/** 计数 +1：只在操作真正落地成功后调用 */
export async function consumeRateLimit(
  bucketKey: string,
  quota: Quota,
): Promise<void> {
  if (!supabaseAdmin) return;
  const { count, windowStartMs } = await readBucket(bucketKey, quota);
  await supabaseAdmin.from('app_rate_limits').upsert(
    {
      bucket_key: bucketKey,
      window_start: new Date(windowStartMs).toISOString(),
      count: count + 1,
    },
    { onConflict: 'bucket_key' },
  );
}

/**
 * 入口型配额：检查通过的同一刻立刻扣除，无论后续业务是否成功。
 *
 * 必须用于 IP 维度。反例：若把 IP 配额也改成"成功才扣"，攻击者拿不存在的邮箱
 * 刷接口就永远不扣配额（因为那些请求注定失败），限流直接被绕过。
 * 同理适用于"验证码校验""注册查重"这类探测型接口——失败恰恰是要惩罚的行为。
 */
export async function hitRateLimit(
  bucketKey: string,
  quota: Quota,
): Promise<RateResult> {
  const verdict = await inspectRateLimit(bucketKey, quota);
  if (!verdict.allowed) return verdict;
  await consumeRateLimit(bucketKey, quota);
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * 恒定最小响应耗时——枚举防护的关键一环。
 * 若"邮箱未注册"分支比"已注册"分支快得多，攻击者即可用响应时间差判断账号是否存在。
 * 把所有分支都拉平到至少 minMs，即可堵住这条时序侧信道。
 */
export async function enforceMinElapsed(startedAt: number, minMs = 400): Promise<void> {
  const elapsed = Date.now() - startedAt;
  if (elapsed >= minMs) return;
  await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
}
