-- Add durable post view tracking for all content types.
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  created_at timestamptz not null default now(),
  check (user_id is not null or session_id is not null),
  unique (post_id, user_id),
  unique (post_id, session_id)
);

create index if not exists post_views_post_id_idx on public.post_views(post_id);
create index if not exists post_views_user_id_idx on public.post_views(user_id);

alter table public.post_views enable row level security;

drop policy if exists post_views_select on public.post_views;
create policy post_views_select on public.post_views
for select
using (true);

drop policy if exists post_views_insert on public.post_views;
create policy post_views_insert on public.post_views
for insert
with check (
  (user_id is not null and auth.uid() = user_id)
  or (user_id is null and session_id is not null)
  or public.is_admin()
);

drop policy if exists post_views_update on public.post_views;
create policy post_views_update on public.post_views
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists post_views_delete on public.post_views;
create policy post_views_delete on public.post_views
for delete
using (auth.uid() = user_id or public.is_admin());
