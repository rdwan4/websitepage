create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  full_name text,
  avatar_url text,
  score integer not null default 0,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guidance_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_ar text not null,
  summary_en text not null,
  summary_ar text not null,
  body_en text not null,
  body_ar text not null,
  image_url text,
  accent_label_en text,
  accent_label_ar text,
  source_type text check (source_type in ('quran', 'hadith', 'athar', 'scholar')),
  source_reference text,
  category text not null check (category in ('reflection', 'story', 'gallery', 'daily-wisdom')),
  position integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_content (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('dua', 'hadith', 'inspiration')),
  title text not null,
  title_ar text,
  arabic_text text,
  english_text text not null,
  transliteration text,
  source_type text not null check (source_type in ('quran', 'hadith', 'athar', 'scholar')),
  source_reference text not null,
  authenticity_notes text,
  image_url text,
  tags text[] default '{}'::text[],
  is_published boolean not null default true,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question_en text not null,
  question_ar text,
  explanation_en text,
  explanation_ar text,
  source_type text not null check (source_type in ('quran', 'hadith', 'athar', 'scholar')),
  source_reference text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  category text not null,
  correct_option_id uuid,
  is_published boolean not null default true,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label_en text not null,
  label_ar text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_date date not null,
  selected_option_id uuid not null references public.question_options(id) on delete cascade,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, question_id, answer_date)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text not null,
  slug text unique not null,
  icon text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  series_slug text,
  series_title text,
  lesson_order integer not null default 1,
  parent_post_id uuid references public.posts(id) on delete set null,
  title text not null,
  content text not null,
  excerpt text,
  post_type text not null check (post_type in ('video', 'image', 'article', 'blog', 'pdf', 'audio', 'blogger')),
  image_url text,
  media_url text,
  attachments text[],
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  views_count integer not null default 0,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.post_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  last_position_seconds integer not null default 0,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists posts_series_slug_idx on public.posts(series_slug);
create index if not exists posts_lesson_order_idx on public.posts(lesson_order);
create index if not exists posts_parent_post_id_idx on public.posts(parent_post_id);
create index if not exists post_progress_user_idx on public.post_progress(user_id);
create index if not exists post_progress_post_idx on public.post_progress(post_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  activity_id uuid,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

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

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  content text not null,
  score_earned integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  time text not null,
  type text not null check (type in ('prayer', 'quran', 'dua', 'study', 'general')),
  days text[] not null default array[]::text[],
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_current_timestamp_updated_at();
drop trigger if exists set_guidance_updated_at on public.guidance_items;
create trigger set_guidance_updated_at before update on public.guidance_items for each row execute procedure public.set_current_timestamp_updated_at();
drop trigger if exists set_daily_content_updated_at on public.daily_content;
create trigger set_daily_content_updated_at before update on public.daily_content for each row execute procedure public.set_current_timestamp_updated_at();
drop trigger if exists set_questions_updated_at on public.questions;
create trigger set_questions_updated_at before update on public.questions for each row execute procedure public.set_current_timestamp_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  if lower(new.email) = 'kurdishphelps@gmail.com' then
    update public.profiles
    set role = 'admin'
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

update public.profiles
set role = 'admin'
where lower(email) = 'kurdishphelps@gmail.com';

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles where id = user_id and role = 'admin');
$$;

create or replace view public.leaderboard as
select
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  p.score as total_score,
  rank() over (order by p.score desc, p.created_at asc) as rank
from public.profiles p;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.guidance_items enable row level security;
alter table public.daily_content enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.user_answers enable row level security;
alter table public.posts enable row level security;
alter table public.post_progress enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.post_views enable row level security;
alter table public.activities enable row level security;
alter table public.quiz_scores enable row level security;
alter table public.reminders enable row level security;

create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id or public.is_admin());
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "guidance_public_select" on public.guidance_items for select using (is_published = true or public.is_admin());
create policy "guidance_admin_all" on public.guidance_items for all using (public.is_admin()) with check (public.is_admin());

create policy "daily_content_public_select" on public.daily_content for select using (is_published = true or public.is_admin());
create policy "daily_content_admin_all" on public.daily_content for all using (public.is_admin()) with check (public.is_admin());

create policy "questions_public_select" on public.questions for select using (is_published = true or public.is_admin());
create policy "questions_admin_all" on public.questions for all using (public.is_admin()) with check (public.is_admin());

create policy "question_options_public_select" on public.question_options for select using (true);
create policy "question_options_admin_all" on public.question_options for all using (public.is_admin()) with check (public.is_admin());

create policy "user_answers_select_self" on public.user_answers for select using (auth.uid() = user_id or public.is_admin());
create policy "user_answers_insert_self" on public.user_answers for insert with check (auth.uid() = user_id);
create policy "user_answers_update_self" on public.user_answers for update using (auth.uid() = user_id or public.is_admin());

create policy "posts_select" on public.posts for select using (is_approved = true or auth.uid() = author_id or public.is_admin());
create policy "posts_insert" on public.posts for insert with check (auth.uid() = author_id or public.is_admin());
create policy "posts_update_own" on public.posts for update using (auth.uid() = author_id or public.is_admin()) with check (auth.uid() = author_id or public.is_admin());
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = author_id or public.is_admin());

create policy "post_progress_select_self" on public.post_progress for select using (auth.uid() = user_id or public.is_admin());
create policy "post_progress_insert_self" on public.post_progress for insert with check (auth.uid() = user_id or public.is_admin());
create policy "post_progress_update_self" on public.post_progress for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "post_progress_delete_self" on public.post_progress for delete using (auth.uid() = user_id or public.is_admin());

create policy "comments_select" on public.comments for select using (status = 'approved' or public.is_admin());
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_update" on public.comments for update using (auth.uid() = user_id or public.is_admin());
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id or public.is_admin());

create policy "likes_select" on public.likes for select using (true);
create policy "likes_manage" on public.likes for all using (auth.uid() = user_id);

create policy "post_views_select" on public.post_views for select using (true);
create policy "post_views_insert" on public.post_views
for insert
with check (
  (user_id is not null and auth.uid() = user_id)
  or (user_id is null and session_id is not null)
  or public.is_admin()
);
create policy "post_views_update" on public.post_views
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());
create policy "post_views_delete" on public.post_views
for delete
using (auth.uid() = user_id or public.is_admin());

create policy "activities_select" on public.activities for select using (true);
create policy "activities_insert" on public.activities for insert with check (auth.uid() = user_id);

create policy "quiz_scores_select" on public.quiz_scores for select using (true);
create policy "quiz_scores_insert" on public.quiz_scores for insert with check (auth.uid() = user_id);

create policy "reminders_select" on public.reminders for select using (auth.uid() = user_id or public.is_admin());
create policy "reminders_insert" on public.reminders for insert with check (auth.uid() = user_id);
create policy "reminders_update" on public.reminders for update using (auth.uid() = user_id or public.is_admin());
create policy "reminders_delete" on public.reminders for delete using (auth.uid() = user_id or public.is_admin());

create policy "media_public_read" on storage.objects for select using (bucket_id = 'media');
create policy "media_upload_auth" on storage.objects for insert with check (bucket_id = 'media' and auth.uid() is not null);
create policy "media_update_owner_or_admin" on storage.objects for update using (bucket_id = 'media' and (owner = auth.uid() or public.is_admin()));
create policy "media_delete_owner_or_admin" on storage.objects for delete using (bucket_id = 'media' and (owner = auth.uid() or public.is_admin()));

alter table public.questions
  add constraint questions_correct_option_fk
  foreign key (correct_option_id) references public.question_options(id)
  on delete set null;
