-- Web Push setup for StudyFlow closed-app notifications.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

-- One row per browser/device subscription, with a copy of the user's reminder
-- preferences so the backend worker knows when and what to send.
create table if not exists public.push_subscriptions (
  endpoint     text primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription jsonb not null,
  enabled      boolean not null default true,
  reminder     boolean not null default true,
  hours_before int not null default 24,
  due_today    boolean not null default true,
  overdue      boolean not null default true,
  updated_at   timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Dedupe log so a given reminder is pushed only once per device.
-- Written only by the backend worker (service role bypasses RLS); RLS is on with
-- no policies, so the browser/anon clients cannot read or write it.
create table if not exists public.push_sent (
  endpoint   text not null,
  notif_key  text not null,
  sent_at    timestamptz not null default now(),
  primary key (endpoint, notif_key)
);

alter table public.push_sent enable row level security;
