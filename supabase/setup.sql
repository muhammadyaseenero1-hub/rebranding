-- Run once in the Supabase SQL Editor. Product rows and images are managed by /admin.
create extension if not exists pgcrypto;
create table if not exists public.watches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  description text not null check (char_length(description) between 1 and 3000),
  price numeric(12,2) not null check (price >= 0),
  collection text not null,
  specifications jsonb not null default '{}'::jsonb,
  movement_type text not null,
  case_material text not null,
  dial_colour text not null,
  strap_material text not null,
  reference_number text not null unique,
  case_size text not null,
  edition text not null default 'Core collection',
  availability boolean not null default true,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.watches enable row level security;
grant select on public.watches to anon, authenticated;
grant insert, update, delete on public.watches to authenticated;

drop policy if exists "Anyone can read VELMONT watches" on public.watches;
create policy "Anyone can read VELMONT watches"
  on public.watches for select using (true);

drop policy if exists "VELMONT admins manage watches" on public.watches;
create policy "VELMONT admins manage watches"
  on public.watches for all to authenticated
  using ((select auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Preserve the six timepieces already shown by the original VELMONT website.
insert into public.watches
  (slug,name,description,price,collection,specifications,movement_type,case_material,dial_colour,strap_material,reference_number,case_size,edition,availability,images)
values
 ('meridian-automatic','Meridian Automatic','A quiet expression of precision. The Meridian pairs a deep forest dial with warm, hand-finished details for a watch made to move between worlds.',18400,'Meridian','{"Water resistance":"100 m","Power reserve":"72 hours","Crystal":"Scratch-resistant sapphire"}','Automatic','18k rose gold','Forest green','Rose gold bracelet','VM-MER-001','40 mm','Limited series',true,array['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=85']),
 ('luminor-nocturne','Luminor Nocturne','An evening companion with a midnight enamel dial, sculpted indices and a refined mechanical heart visible through its sapphire caseback.',22800,'Nocturne','{"Water resistance":"50 m","Power reserve":"68 hours","Crystal":"Double-domed sapphire"}','Automatic','Polished stainless steel','Midnight enamel','Black alligator leather','VM-NOC-001','39 mm','Made to order',true,array['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85']),
 ('aurelian-calendar','Aurelian Calendar','A considered study in balance. A refined annual calendar complication meets a champagne sunray dial and a supple hand-stitched leather strap.',31600,'Aurelian','{"Water resistance":"50 m","Power reserve":"60 hours","Crystal":"Scratch-resistant sapphire"}','Automatic annual calendar','18k yellow gold','Champagne','Brown hand-stitched leather','VM-AUR-001','41 mm','Numbered edition',true,array['https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=85']),
 ('meridian-verdant','Meridian Verdant','A signature Meridian silhouette, distinguished by a rich green dial and an individually finished bracelet.',19200,'Meridian','{"Water resistance":"100 m","Power reserve":"72 hours","Crystal":"Scratch-resistant sapphire"}','Automatic','Brushed stainless steel','Verdant green','Stainless steel bracelet','VM-MER-002','40 mm','Core collection',true,array['https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1200&q=85']),
 ('nocturne-slate','Nocturne Slate','Architectural lines meet a slate-grey dial, with polished surfaces that catch the light without asking for it.',24100,'Nocturne','{"Water resistance":"100 m","Power reserve":"68 hours","Crystal":"Double-domed sapphire"}','Automatic','Titanium and steel','Slate grey','Integrated titanium bracelet','VM-NOC-002','39 mm','Limited series',true,array['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=85']),
 ('aurelian-reserve','Aurelian Reserve','A modern heirloom in precious metal, with a moonphase display and a hand-polished movement crafted in the Vallée de Joux.',36900,'Aurelian','{"Water resistance":"50 m","Power reserve":"60 hours","Crystal":"Scratch-resistant sapphire"}','Automatic moonphase','18k rose gold','Silver opaline','Brown alligator leather','VM-AUR-002','40 mm','Numbered edition',true,array['https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1200&q=85'])
on conflict (reference_number) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('watch-images', 'watch-images', true, 20971520, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "VELMONT admins upload watch images" on storage.objects;
create policy "VELMONT admins upload watch images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'watch-images' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "VELMONT admins delete watch images" on storage.objects;
create policy "VELMONT admins delete watch images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'watch-images' and (select auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Create an Auth user in Supabase first, then grant that account admin access.
-- Replace the email and run this statement from the Supabase SQL Editor:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'admin@example.com';
-- The administrator must sign out and sign in again after the role is added.
