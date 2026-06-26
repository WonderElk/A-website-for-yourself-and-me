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
