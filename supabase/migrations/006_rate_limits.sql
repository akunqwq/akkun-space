-- 006_rate_limits.sql
-- 通用固定窗口计数器：给「发送频率限制」与「枚举防护」提供跨实例一致的计数。
-- 手动在 Supabase SQL Editor 执行（与 001~005 流程一致）。
--
-- 为什么不用内存 Map：Vercel 是无状态多实例 Serverless，进程内存会在实例间丢失、
-- 冷启动即清零，形同虚设。故计数必须落库。
--
-- 设计要点：
--   1. bucket_key 形如 "otp:send:email:<邮箱>" / "otp:send:ip:<IP>" / "login:ip:<IP>"
--   2. window_start + count 构成固定窗口；窗口过期即重置（惰性，无 cron）
--   3. RLS 启用且无策略 = anon/authenticated 全拒；仅 service_role（服务端路由）可写

create table if not exists public.app_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);

create index if not exists idx_app_rate_limits_window_start
  on public.app_rate_limits (window_start);

alter table public.app_rate_limits enable row level security;
