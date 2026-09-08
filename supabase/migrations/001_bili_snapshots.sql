-- =============================================================================
-- 001_bili_snapshots.sql
-- B 站 UP 主粉丝快照 + 追踪表 DDL + RLS
-- 阿鲲在 Supabase 控制台手动执行。
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 表 1：bili_up_tracked — 被追踪的 UP 主（用户查询时 upsert 标记，Cron 据此采样）
-- ---------------------------------------------------------------------------
create table if not exists public.bili_up_tracked (
  mid              bigint        primary key,
  name             text,
  last_queried_at  timestamptz   not null,
  created_at       timestamptz   default now()
);

comment on table public.bili_up_tracked is 'B 站被追踪的 UP 主（用户查询过的 mid 标记追踪，Cron 据此每日采样粉丝数）';
comment on column public.bili_up_tracked.mid is 'B 站用户 ID（与 space.bilibili.com/{mid} 一致）';
comment on column public.bili_up_tracked.name is '昵称（冗余存储，Cron 采样时无需再查 acc/info）';
comment on column public.bili_up_tracked.last_queried_at is '最近被用户查询的时间，用于排序采样优先级';

-- ---------------------------------------------------------------------------
-- 表 2：bili_up_snapshots — 粉丝数每日快照（增长曲线原始数据）
-- ---------------------------------------------------------------------------
create table if not exists public.bili_up_snapshots (
  id               uuid          primary key default gen_random_uuid(),
  mid              bigint        not null,
  follower_count   integer       not null,
  following_count  integer       default 0,
  sampled_at       timestamptz   not null,
  created_at       timestamptz   default now()
);

comment on table public.bili_up_snapshots is 'B 站 UP 主粉丝数每日快照（Vercel Cron 每日采样写入）';
comment on column public.bili_up_snapshots.mid is 'B 站用户 ID';
comment on column public.bili_up_snapshots.follower_count is '采样时粉丝数';
comment on column public.bili_up_snapshots.following_count is '采样时关注数';
comment on column public.bili_up_snapshots.sampled_at is '采样时间（Cron 执行时刻）';

-- 索引：按 mid + 采样时间倒序，支撑增长曲线查询
create index if not exists idx_bili_snapshots_mid_sampled
  on public.bili_up_snapshots (mid, sampled_at desc);

-- ---------------------------------------------------------------------------
-- RLS 策略（架构设计 3.3）
-- 公开读（anon SELECT）：ISR 静态页生成需读权限（安全网，实际走 supabaseAdmin）
-- 写入只允许 service_role：Cron 任务 / API Route 用 supabaseAdmin
-- ---------------------------------------------------------------------------
alter table public.bili_up_tracked enable row level security;
alter table public.bili_up_snapshots enable row level security;

-- 追踪表：anon 可读，service_role 可写
create policy "tracked_select_public"
  on public.bili_up_tracked for select
  to anon, authenticated
  using (true);

create policy "tracked_insert_service"
  on public.bili_up_tracked for insert
  to service_role
  with check (true);

create policy "tracked_update_service"
  on public.bili_up_tracked for update
  to service_role
  using (true) with check (true);

-- 快照表：anon 可读，service_role 可写
create policy "snapshots_select_public"
  on public.bili_up_snapshots for select
  to anon, authenticated
  using (true);

create policy "snapshots_insert_service"
  on public.bili_up_snapshots for insert
  to service_role
  with check (true);

create policy "snapshots_update_service"
  on public.bili_up_snapshots for update
  to service_role
  using (true) with check (true);

create policy "snapshots_delete_service"
  on public.bili_up_snapshots for delete
  to service_role
  using (true);
