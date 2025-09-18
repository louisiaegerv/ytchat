-- Safe DDL for per-user settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  blur_thumbnails boolean not null default false,
  updated_at timestamptz not null default now()
);