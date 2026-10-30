-- SHAKIB PORTFOLIO MANAGER — Supabase SQL setup
-- IMPORTANT: Replace admin@example.com with the exact admin email you will use to sign in.
-- Run this in Supabase Dashboard > SQL Editor > New query.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) between 1 and 600),
  image_url text,
  live_url text,
  github_url text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Public can view published projects" on public.projects;
create policy "Public can view published projects"
on public.projects for select
to anon, authenticated
using (published = true or (auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com');

drop policy if exists "Admin can add projects" on public.projects;
create policy "Admin can add projects"
on public.projects for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com');

drop policy if exists "Admin can edit projects" on public.projects;
create policy "Admin can edit projects"
on public.projects for update
to authenticated
using ((auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com')
with check ((auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com');

drop policy if exists "Admin can delete projects" on public.projects;
create policy "Admin can delete projects"
on public.projects for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com');

-- Public bucket for project screenshots/images. Admin-only uploads/deletes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 4194304, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 4194304,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "Anyone can view project images" on storage.objects;
create policy "Anyone can view project images" on storage.objects
for select to anon, authenticated
using (bucket_id = 'project-images');

drop policy if exists "Admin can upload project images" on storage.objects;
create policy "Admin can upload project images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'project-images'
  and (auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admin can update project images" on storage.objects;
create policy "Admin can update project images" on storage.objects
for update to authenticated
using (bucket_id = 'project-images' and (auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com')
with check (bucket_id = 'project-images' and (auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com');
drop policy if exists "Admin can delete project images" on storage.objects;
create policy "Admin can delete project images" on storage.objects
for delete to authenticated
using (bucket_id = 'project-images' and (auth.jwt() ->> 'email') = 'munabbirshakib355@gmail.com');