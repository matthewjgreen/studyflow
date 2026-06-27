-- StudyFlow database schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: it drops and recreates the tables.

drop table if exists public.assignments cascade;
drop table if exists public.courses cascade;

-- Courses ------------------------------------------------------------------
create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  color       text not null default 'emerald',
  created_at  timestamptz not null default now()
);

-- Assignments --------------------------------------------------------------
create table public.assignments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  course_id   uuid references public.courses (id) on delete set null,
  type        text not null default 'Homework',
  subtitle    text default '',
  due_date    timestamptz not null default now(),
  priority    text not null default 'Normal',
  completed   boolean not null default false,
  notes       text default '',
  created_at  timestamptz not null default now()
);

create index assignments_user_idx on public.assignments (user_id);
create index assignments_due_idx  on public.assignments (due_date);
create index courses_user_idx     on public.courses (user_id);

-- Row Level Security: each user can only touch their own rows ---------------
alter table public.courses     enable row level security;
alter table public.assignments enable row level security;

create policy "Users manage their own courses"
  on public.courses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own assignments"
  on public.assignments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
