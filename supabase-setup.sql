-- Run this once in the Supabase SQL editor for your project.
-- It creates the posts table, the post-images storage bucket,
-- and the RLS/storage policies.

-- === Posts table ===================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  topic text,
  subtopic text,
  date date not null default current_date,
  body text,
  image_path text,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- === Profiles table =================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) >= 3),
  biography text,
  created_at timestamptz not null default now()
);

-- Backfill profiles for all existing auth users to avoid foreign key violations
insert into public.profiles (id, username, biography)
select 
  id, 
  concat(
    coalesce(nullif(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), ''), 'user'),
    '_',
    substring(id::text from 1 for 4)
  ) as username,
  'Author biography.' as biography
from auth.users
on conflict (id) do nothing;

-- Function to handle new user profile auto-creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, biography)
  values (
    new.id,
    concat(
      coalesce(nullif(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), ''), 'user'),
      '_',
      substring(new.id::text from 1 for 4)
    ),
    'Author biography.'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute handle_new_user function after user insertion
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update posts foreign key to point to profiles
alter table public.posts drop constraint if exists posts_author_id_fkey;
alter table public.posts
  add constraint posts_author_id_fkey
  foreign key (author_id)
  references public.profiles(id)
  on delete set null;

alter table public.posts enable row level security;

drop policy if exists "Posts are readable by everyone" on public.posts;
create policy "Posts are readable by everyone"
  on public.posts for select
  using (true);

drop policy if exists "Authenticated users can create posts" on public.posts;
create policy "Authenticated users can create posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "Authors can update their posts" on public.posts;
create policy "Authors can update their posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id);

drop policy if exists "Authors can delete their posts" on public.posts;
create policy "Authors can delete their posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- === Storage bucket =================================================
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "Post images are publicly readable" on storage.objects;
create policy "Post images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "Authenticated users can upload post images" on storage.objects;
create policy "Authenticated users can upload post images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images');

drop policy if exists "Owners can update their post images" on storage.objects;
create policy "Owners can update their post images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'post-images' and owner = auth.uid());

drop policy if exists "Owners can delete their post images" on storage.objects;
create policy "Owners can delete their post images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'post-images' and owner = auth.uid());

-- === Profiles Policies ==============================================
alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);
