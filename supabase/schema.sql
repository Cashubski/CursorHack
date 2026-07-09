-- PatchPilot schema. Run this in the Supabase SQL editor (or `supabase db push`).
-- One row per bug-report task; the pipeline artifacts are stored as JSONB.

create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null default 'Untitled report',
  reporter text,
  severity text not null default 'medium',
  area text not null default 'Other',
  status text not null default 'triage',
  issue jsonb not null default '{}'::jsonb,
  brief jsonb,
  run jsonb,
  review jsonb
);

create index if not exists tasks_created_at_idx on public.tasks (created_at desc);
create index if not exists tasks_status_idx on public.tasks (status);

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Row Level Security. These policies are intentionally permissive for the demo
-- (anon key, single shared board). Tighten before any real deployment.
alter table public.tasks enable row level security;

drop policy if exists "tasks_anon_select" on public.tasks;
create policy "tasks_anon_select" on public.tasks
  for select using (true);

drop policy if exists "tasks_anon_insert" on public.tasks;
create policy "tasks_anon_insert" on public.tasks
  for insert with check (true);

drop policy if exists "tasks_anon_update" on public.tasks;
create policy "tasks_anon_update" on public.tasks
  for update using (true) with check (true);

drop policy if exists "tasks_anon_delete" on public.tasks;
create policy "tasks_anon_delete" on public.tasks
  for delete using (true);
