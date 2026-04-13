-- 在 Supabase SQL Editor 中執行此腳本
-- https://supabase.com/dashboard/project/pmsevkpcmdmxynvbvujj/sql/new

-- 建立 tasks 資料表
create table if not exists public.tasks (
  id text primary key,
  title text not null default '',
  description text default '',
  "column" text not null default 'todo',
  priority text not null default 'medium',
  start_date text,
  end_date text,
  tags text[] default '{}',
  color text default '#8B9DAF',
  dependencies jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 如果 tasks 表已存在，新增 dependencies 欄位
alter table public.tasks add column if not exists dependencies jsonb default '[]';

-- 啟用 RLS（行級安全）
alter table public.tasks enable row level security;

-- 允許匿名用戶完整 CRUD（個人工具，無需登入）
create policy "Allow all access" on public.tasks
  for all using (true) with check (true);

-- 啟用 Realtime
alter publication supabase_realtime add table public.tasks;
