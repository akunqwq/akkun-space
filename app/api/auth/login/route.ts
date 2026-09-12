// app/api/auth/login/route.ts
// -----------------------------------------------------------------------------
// 登录（POST { identifier, password }）→ 校验 scrypt 哈希 → 建会话 + HttpOnly cookie。
// identifier 可为「账号名」或「邮箱」：账号名不含 @，故以是否含 @ 判定走哪一列匹配。
// 账号不存在与密码错误统一回复"账号或密码不正确"，不暴露账号是否存在。
// -----------------------------------------------------------------------------
import { type NextRequest, NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';
import { verifyPassword } from '@/lib/auth/hash';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { QUOTA, clientIp, hitRateLimit } from '@/lib/auth/ratelimit';
import type { AuthApiResponse } from '@/lib/auth/types';
import { isEmail } from '@/lib/auth/validate';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '认证服务未配置' },
      { status: 502 },
    );
  }

  let body: { identifier?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '请求格式无效' },
      { status: 400 },
    );
  }

  const identifier = (body.identifier ?? '').trim();
  const password = body.password ?? '';
  if (!identifier || !password) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: '请输入账号和密码' },
      { status: 400 },
    );
  }

  // —— 频率限制（IP 维度）：密码登录天然可被爆破/枚举 ——
  // 注：账号名/邮箱标识不支持"未知则不透露"，故用配额把批量尝试的成本抬到不可行
  const ipQuota = await hitRateLimit(`login:ip:${clientIp(req)}`, QUOTA.loginIp);
  if (!ipQuota.allowed) {
    return NextResponse.json<AuthApiResponse>(
      { ok: false, error: `尝试过于频繁，请 ${ipQuota.retryAfterSec}s 后再试` },
      { status: 429 },
    );
  }

  // 账号名不含 @，故以此区分匹配列（两者唯一且互不重叠，单列匹配无歧义）
  const byEmail = isEmail(identifier);
  const matchCol: 'email' | 'username' = byEmail ? 'email' : 'username';
  const matchVal = byEmail ? identifier.toLowerCase() : identifier;

  const { data: user } = await supabaseAdmin
    .from('app_users')
    .select('id, password_hash')
    .eq(matchCol, matchVal)
    .maybeSingle();

  // 统一错误提示（防账号枚举）；即使用户不存在也跑一次哈希校验，抹平时序差异
  const INVALID = { ok: false as const, error: '账号或密码不正确' };
  if (!user) {
    await verifyPassword(password, 'scrypt$16384$8$1$00$00');
    return NextResponse.json<AuthApiResponse>(INVALID, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json<AuthApiResponse>(INVALID, { status: 401 });
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);
  return NextResponse.json<AuthApiResponse>({ ok: true });
}
