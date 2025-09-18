create table if not exists public.user_video_flags (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  blur boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);