-- =============================================================
-- PingLoop — Déclarations de ventes hors plateforme
-- Colle ce fichier dans l'éditeur SQL de ton dashboard Supabase
-- =============================================================

create table public.off_platform_sales (
  id             uuid default gen_random_uuid() primary key,
  listing_id     uuid not null,
  seller_id      uuid references auth.users(id) on delete cascade not null,
  brand          text not null,
  name           text not null,
  price          integer not null,
  support_amount numeric default 0,
  created_at     timestamptz default now()
);

alter table public.off_platform_sales enable row level security;

create policy "Vendeur déclare ses ventes hors plateforme" on public.off_platform_sales
  for insert with check (auth.uid() = seller_id);

create policy "Vendeur voit ses déclarations" on public.off_platform_sales
  for select using (auth.uid() = seller_id);
