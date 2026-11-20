-- InterviewLab accounts: profile, learning progress, comments and private notes.
-- Run once in the Supabase SQL editor (or `supabase db push`). Safe to re-run.

-- ---------- profiles: public display name, created automatically on sign-up ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- progress: one row per answered section ----------
create table if not exists public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_slug text not null,
  section_id text not null,
  solved boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_slug, section_id)
);

-- ---------- last opened lesson, so "Học tiếp" follows the learner across devices ----------
create table if not exists public.user_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  last_lesson text,
  updated_at timestamptz not null default now()
);

-- ---------- private notes per section ----------
create table if not exists public.notes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_slug text not null,
  section_id text not null,
  body text not null check (char_length(body) <= 10000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_slug, section_id)
);

-- ---------- public comments / Q&A, one level of replies ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  lesson_slug text not null,
  section_id text,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null default '',
  body text not null check (char_length(trim(body)) between 1 and 2000),
  parent_id uuid references public.comments (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists comments_lesson_idx on public.comments (lesson_slug, created_at);

-- the author name always comes from the profile, so nobody can post under another name
create or replace function public.set_comment_author() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select display_name into new.author_name from public.profiles where id = new.user_id;
  if new.author_name is null then new.author_name := 'Ẩn danh'; end if;
  return new;
end $$;

drop trigger if exists comments_set_author on public.comments;
create trigger comments_set_author before insert on public.comments
  for each row execute function public.set_comment_author();

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.user_state enable row level security;
alter table public.notes enable row level security;
alter table public.comments enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "progress own" on public.lesson_progress;
create policy "progress own" on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "state own" on public.user_state;
create policy "state own" on public.user_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notes own" on public.notes;
create policy "notes own" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select using (true);
drop policy if exists "comments insert own" on public.comments;
create policy "comments insert own" on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "comments delete own" on public.comments;
create policy "comments delete own" on public.comments for delete to authenticated using (auth.uid() = user_id);
