-- Run this once in the NEW Supabase project's SQL Editor to (re)create
-- everything customize.js and js/app.js expect. Safe to re-run.

create table if not exists public.orders (
  id uuid primary key,
  partner_name text not null,
  signature_name text not null,
  letter_paragraphs jsonb not null,
  gratitude_messages jsonb not null,
  photo_urls jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "anon can insert orders" on public.orders;
create policy "anon can insert orders"
  on public.orders for insert
  to anon
  with check (true);

drop policy if exists "anon can read orders by id" on public.orders;
create policy "anon can read orders by id"
  on public.orders for select
  to anon
  using (true);

insert into storage.buckets (id, name, public)
values ('couple-photos', 'couple-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "anon can upload couple photos" on storage.objects;
create policy "anon can upload couple photos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'couple-photos');

drop policy if exists "anon can read couple photos" on storage.objects;
create policy "anon can read couple photos"
  on storage.objects for select
  to anon
  using (bucket_id = 'couple-photos');
