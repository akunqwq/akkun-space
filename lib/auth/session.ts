// lib/auth/session.ts
// -----------------------------------------------------------------------------
// 会话管理（server-only）—— opaque token 方案。
// token：32 字节随机 → base64url 明文给 cookie；库只存 SHA-256（token_hash），
// 数据库泄露也无法伪造会话。cookie：HttpOnly + Secure(prod) + SameSite=Lax，30 天。
// 过期会话懒清理（getCurrentUser 命中即删），不做 cron。
// 数据访问复用 supabaseAdmin（service_role 绕 RLS，与 003 migration 的 RLS 设计配套）。
// -----------------------------------------------------------------------------
import 'server-only';

import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';

import { supabaseAdmin } from '@/lib/interaction/supabase-storage';
import type { AuthUser } from './types';

export const SESSION_COOKIE = 'ak_session';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_TTL_SEC = SESSION_TTL_MS / 1000;

/** token 明文 → 入库哈希（SHA-256 hex） */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 为用户创建新会话，返回应写入 cookie 的明文 token */
export async function createSession(userId: string): Promise<string> {
  if (!supabaseAdmin) throw new Error('Supabase admin client 未配置（缺 SERVICE_ROLE_KEY）');
  const token = randomBytes(32).toString('base64url');
  const { error } = await supabaseAdmin.from('app_sessions').insert({
    token_hash: hashToken(token),
    user_id: userId,
    expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  });
  if (error) throw new Error(`创建会话失败: ${error.message}`);
  return token;
}

/** 写会话 cookie（仅 Route Handler 内可调用） */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SEC,
  });
}

/** 当前登录用户；未登录 / cookie 残留但会话失效 → null（调用方据此走游客分支） */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || !supabaseAdmin) return null;

  const tokenHash = hashToken(token);

  // 1) 查会话。不用 PostgREST FK 嵌入（app_users(...)）：无生成类型时它被
  //    推导为数组、运行时却是对象，类型欺骗风险——拆两次查询，类型诚实零断言
  const { data: session, error: sessErr } = await supabaseAdmin
    .from('app_sessions')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (sessErr || !session) return null;

  // 过期：懒清理 + 视为未登录
  if (new Date(String(session.expires_at)).getTime() <= Date.now()) {
    void supabaseAdmin.from('app_sessions').delete().eq('token_hash', tokenHash);
    return null;
  }

  // 2) 查用户
  const { data: users, error: userErr } = await supabaseAdmin
    .from('app_users')
    .select('id, username, email, created_at')
    .eq('id', session.user_id)
    .limit(1);
  if (userErr || !users || users.length === 0) return null;
  const u = users[0];

  return {
    id: u.id,
    username: u.username,
    email: u.email ?? null,
    createdAt: u.created_at,
  };
}

/** 注销：删库中会话 + 清 cookie */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && supabaseAdmin) {
    await supabaseAdmin.from('app_sessions').delete().eq('token_hash', hashToken(token));
  }
  store.delete(SESSION_COOKIE);
}
