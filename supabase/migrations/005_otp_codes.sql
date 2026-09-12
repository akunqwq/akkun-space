-- 005_otp_codes.sql
-- 邮箱验证码（OTP）登录所需的临时验证码表。
-- 手动在 Supabase SQL Editor 执行（与 001~004 流程一致）。
--
-- 设计要点：
--   1. 每邮箱仅保留一条有效验证码（email 作主键，重发即覆盖）。
--   2. code_hash 只存 SHA-256，明文验证码绝不入库。
--   3. expires_at 控制有效期（写入侧设 10 分钟）；attempts 防暴力枚举。
--   4. RLS 启用且无策略 = anon/authenticated 全拒；仅 service_role（服务端路由）可访问。

create table if not exists public.app_otp_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_otp_codes_expires_at
  on public.app_otp_codes (expires_at);

alter table public.app_otp_codes enable row level security;
