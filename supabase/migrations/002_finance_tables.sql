-- =============================================================================
-- 002_finance_tables.sql
-- 游戏公司财报三表：finance_companies / finance_segments / finance_quarterly
-- 阿鲲在 Supabase 控制台手动执行（紧跟 001_bili_snapshots.sql 之后）。
-- 数据来源：data/finance/{companies,segments,quarterly}.csv（许清楚整理），
-- 由 scripts/import-finance-csv.ts 读取并 upsert 进本表。
-- code 必须与 lib/tools/finance-data.ts 的 FINANCE_COMPANIES 一致（路由/导入共用）。
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 表 1：finance_companies — 公司主体 + 当期游戏营收核心指标
-- ---------------------------------------------------------------------------
create table if not exists public.finance_companies (
  code           text          primary key,   -- 与 FINANCE_COMPANIES / CSV code 一致
  name           text          not null,
  market         text          not null,     -- HK / US / A股
  game_revenue   numeric(14,2) not null,     -- 游戏业务营收（亿元）
  total_revenue  numeric(14,2),              -- 总营收（亿元，可空）
  yoy_growth     numeric(6,1),               -- 游戏营收同比（%，可空）
  ratio          numeric(6,1),               -- 游戏营收占总营收比（%，可空）
  period         text          not null,     -- 财报期，如 26H1
  updated_at     timestamptz   default now()
);

comment on table public.finance_companies is '游戏公司财报主体 + 当期游戏营收核心指标（由 CSV 导入）';
comment on column public.finance_companies.code is '公司代码，与 lib/tools/finance-data.ts 的 FINANCE_COMPANIES 一致';
comment on column public.finance_companies.market is '上市地：HK 港股 / US 美股 / A股';
comment on column public.finance_companies.game_revenue is '游戏业务营收（亿元）';
comment on column public.finance_companies.yoy_growth is '游戏营收同比（%，可空）';
comment on column public.finance_companies.ratio is '游戏营收占总营收比（%，可空）';

-- ---------------------------------------------------------------------------
-- 表 2：finance_segments — 营收构成（分板块 / 分品类）
-- ---------------------------------------------------------------------------
create table if not exists public.finance_segments (
  id            uuid          primary key default gen_random_uuid(),
  company_code  text          not null references public.finance_companies(code) on delete cascade,
  segment_name  text          not null,
  revenue       numeric(14,2) not null,
  yoy_growth    numeric(6,1),               -- 板块同比（%，可空）
  period        text          not null
);

comment on table public.finance_segments is '游戏公司营收构成（分板块 / 分品类，由 CSV 导入）';
comment on column public.finance_segments.company_code is '外键 → finance_companies(code)';
comment on column public.finance_segments.revenue is '该板块营收（亿元）';

create index if not exists idx_finance_segments_code
  on public.finance_segments (company_code);

-- ---------------------------------------------------------------------------
-- 表 3：finance_quarterly — 近 N 季度游戏营收趋势（画柱状图用）
-- ---------------------------------------------------------------------------
create table if not exists public.finance_quarterly (
  id            uuid          primary key default gen_random_uuid(),
  company_code  text          not null references public.finance_companies(code) on delete cascade,
  quarter       text          not null,     -- 如 26Q1
  game_revenue  numeric(14,2) not null
);

comment on table public.finance_quarterly is '游戏公司近 N 季度游戏营收趋势（画柱状图，由 CSV 导入）';
comment on column public.finance_quarterly.quarter is '季度标识，如 26Q1';
comment on column public.finance_quarterly.game_revenue is '该季度游戏营收（亿元）';

create index if not exists idx_finance_quarterly_code
  on public.finance_quarterly (company_code);

-- ---------------------------------------------------------------------------
-- RLS 策略（对齐 001 风格）
-- 公开读（anon SELECT）：ISR 静态页生成需读权限（安全网，实际走 supabaseAdmin）
-- 写入只允许 service_role：导入脚本 / API Route 用 supabaseAdmin
-- ---------------------------------------------------------------------------
alter table public.finance_companies enable row level security;
alter table public.finance_segments  enable row level security;
alter table public.finance_quarterly enable row level security;

-- finance_companies
create policy "finance_companies_select_public"
  on public.finance_companies for select
  to anon, authenticated
  using (true);

create policy "finance_companies_write_service"
  on public.finance_companies for all
  to service_role
  using (true) with check (true);

-- finance_segments
create policy "finance_segments_select_public"
  on public.finance_segments for select
  to anon, authenticated
  using (true);

create policy "finance_segments_write_service"
  on public.finance_segments for all
  to service_role
  using (true) with check (true);

-- finance_quarterly
create policy "finance_quarterly_select_public"
  on public.finance_quarterly for select
  to anon, authenticated
  using (true);

create policy "finance_quarterly_write_service"
  on public.finance_quarterly for all
  to service_role
  using (true) with check (true);
