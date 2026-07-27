-- Generic multi-industry schema for rental/deployment of assets
-- Apply in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  notes text not null default '',
  status text not null default 'disponible',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null default '',
  license text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete restrict,
  start_date date not null,
  rental_days integer not null check (rental_days > 0),
  end_date date not null,
  client_name text not null,
  lat double precision,
  lng double precision,
  address text not null default '',
  status text not null default 'activo',
  delivery_operator_id uuid references public.operators(id) on delete set null,
  pickup_operator_id uuid references public.operators(id) on delete set null,
  receipt_uri text,
  receipt_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('asset', 'operator', 'rental')),
  key text not null,
  label text not null,
  field_type text not null default 'text',
  unique (entity, key)
);

create table if not exists public.custom_field_values (
  id uuid primary key default gen_random_uuid(),
  field_def_id uuid not null references public.custom_field_defs(id) on delete cascade,
  entity_id uuid not null,
  value text not null default '',
  unique (field_def_id, entity_id)
);

create index if not exists rentals_status_idx on public.rentals(status);
create index if not exists rentals_asset_id_idx on public.rentals(asset_id);
create index if not exists assets_status_idx on public.assets(status);

-- Storage bucket for receipts / attachments
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- RLS: authenticated users full access (tighten per tenant later)
alter table public.assets enable row level security;
alter table public.operators enable row level security;
alter table public.rentals enable row level security;
alter table public.custom_field_defs enable row level security;
alter table public.custom_field_values enable row level security;

create policy "assets_auth_all" on public.assets
  for all to authenticated using (true) with check (true);

create policy "operators_auth_all" on public.operators
  for all to authenticated using (true) with check (true);

create policy "rentals_auth_all" on public.rentals
  for all to authenticated using (true) with check (true);

create policy "custom_field_defs_auth_all" on public.custom_field_defs
  for all to authenticated using (true) with check (true);

create policy "custom_field_values_auth_all" on public.custom_field_values
  for all to authenticated using (true) with check (true);

-- Dev-friendly anon policies for quick start (remove in production if using auth)
create policy "assets_anon_all" on public.assets
  for all to anon using (true) with check (true);

create policy "operators_anon_all" on public.operators
  for all to anon using (true) with check (true);

create policy "rentals_anon_all" on public.rentals
  for all to anon using (true) with check (true);

create policy "attachments_public_read" on storage.objects
  for select to public using (bucket_id = 'attachments');

create policy "attachments_auth_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'attachments');

create policy "attachments_anon_write" on storage.objects
  for insert to anon with check (bucket_id = 'attachments');
