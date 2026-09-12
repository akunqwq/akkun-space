-- 004_account_identity.sql
-- 允许以「用户名」作为登录标识，邮箱改为可选（仅用于验证码登录等增强能力）。
-- 手动在 Supabase SQL Editor 执行。
--
-- 前提：app_users 当前**无任何存量账号**，因此不需要"把 email 本地名回填进 username"
--       那段历史迁移逻辑。
--       ⚠️ 若日后表内已有账号再执行本文件，步骤 3 会因 NULL 值直接失败；
--          届时需要先跑回填（取 email 的 '@' 前本地名，并用窗函数给重名追加 _1/_2），
--          再回过头执行本文件。
--
-- 变更：
--   1. 新增 username 列，作为登录标识（not null + unique）
--   2. email 降级为可选，保留既有唯一约束（Postgres 唯一索引允许多个 NULL 并存）
--   3. 两者不重叠：账号名不允许含 '@'，故登录时能明确区分该查哪一列

-- 0) 前置守卫：确认确实无存量账号，避免迁移跑到一半才失败
do $$
declare
  n bigint;
begin
  select count(*) into n from public.app_users;
  if n > 0 then
    raise exception 'app_users 已有 % 行数据，需先回填 username 再执行本迁移', n;
  end if;
end $$;

-- 1) 新增 username 列
alter table public.app_users add column if not exists username text;

-- 2) 唯一约束（登录标识必须唯一）
-- ⚠️ PostgreSQL 的 ALTER TABLE ... ADD CONSTRAINT **不支持** IF NOT EXISTS
--    （IF NOT EXISTS 只适用于 ADD COLUMN；DROP CONSTRAINT 才支持 IF EXISTS）
--    故写成先 DROP IF EXISTS 再 ADD 的两段式，保证可重复执行。
alter table public.app_users
  drop constraint if exists app_users_username_unique;
alter table public.app_users
  add constraint app_users_username_unique unique (username);

-- 3) 设为非空（空表前提下必然成立）
alter table public.app_users alter column username set not null;

-- 4) email 改为可选
alter table public.app_users alter column email drop not null;
