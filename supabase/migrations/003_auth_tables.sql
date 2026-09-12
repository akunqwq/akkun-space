-- 003_auth_tables.sql
-- 自研轻量认证：账号表 + 会话表（opaque token 方案）
-- 执行方式：Supabase Dashboard SQL Editor 手动执行（与 001/002 相同流程）
--
-- 设计要点：
--   1. 命名 app_users / app_sessions，避开 Supabase 内置 auth.users 概念混淆
--   2. RLS 启用且无任何策略 = anon / authenticated 角色全部拒绝；
--      该表只允许 service_role（服务端 lib/auth）访问，密码哈希绝不暴露给客户端
--   3. 会话凭证：服务端生成 32 字节随机 token 返回给 cookie，
--      库里只存其 SHA-256（token_hash）——库泄露也无法伪造会话
--   4. 过期会话懒清理：getCurrentUser 命中过期即删，无需 cron

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  token_hash text primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_sessions_user_id on public.app_sessions (user_id);
create index if not exists idx_app_sessions_expires_at on public.app_sessions (expires_at);

-- 防御性 RLS：无策略 = anon / authenticated 全拒；服务端走 service_role 不受影响
alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
