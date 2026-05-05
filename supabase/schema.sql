-- =============================================================
-- PingLoop — Schéma Supabase
-- Colle ce fichier entier dans l'éditeur SQL de ton dashboard
-- =============================================================

-- LISTINGS
create table public.listings (
  id          uuid default gen_random_uuid() primary key,
  category    text not null check (category in ('rubber', 'blade')),
  brand       text not null,
  name        text not null,
  pimple_type text check (pimple_type in ('In', 'Out', 'Long')),
  color       text,
  condition   text not null check (condition in ('new', 'like_new', 'good', 'fair')),
  price       integer not null check (price > 0),
  description text default '',
  location    text not null,
  seller_id   uuid references auth.users(id) on delete cascade not null,
  seller_name text not null,
  approval_code text,
  photos      text[] default '{}',
  sold_at     timestamptz,
  created_at  timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Tout le monde voit les annonces" on public.listings
  for select using (true);

create policy "Vendeur crée ses annonces" on public.listings
  for insert with check (auth.uid() = seller_id);

create policy "Vendeur modifie ses annonces" on public.listings
  for update using (auth.uid() = seller_id);

create policy "Vendeur supprime ses annonces" on public.listings
  for delete using (auth.uid() = seller_id);


-- CONVERSATIONS
create table public.conversations (
  id          uuid default gen_random_uuid() primary key,
  listing_id  uuid references public.listings(id) on delete cascade not null,
  buyer_id    uuid references auth.users(id) on delete cascade not null,
  seller_id   uuid references auth.users(id) on delete cascade not null,
  buyer_name  text not null,
  seller_name text not null,
  created_at  timestamptz default now(),
  unique(listing_id, buyer_id)
);

alter table public.conversations enable row level security;

create policy "Participants voient leurs conversations" on public.conversations
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Acheteur crée une conversation" on public.conversations
  for insert with check (auth.uid() = buyer_id);


-- MESSAGES
create table public.messages (
  id              uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  from_id         uuid references auth.users(id) not null,
  text            text not null,
  sent_at         timestamptz default now(),
  read_at         timestamptz
);

alter table public.messages enable row level security;

create policy "Participants lisent les messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Participants envoient des messages" on public.messages
  for insert with check (
    auth.uid() = from_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );


-- SEARCH ALERTS
create table public.search_alerts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  email       text not null,
  category    text check (category in ('rubber', 'blade')),
  brand       text,
  name        text,
  pimple_type text check (pimple_type in ('In', 'Out', 'Long')),
  max_price   integer,
  created_at  timestamptz default now()
);

alter table public.search_alerts enable row level security;

create policy "Utilisateur voit ses alertes" on public.search_alerts
  for select using (auth.uid() = user_id);

create policy "Utilisateur crée ses alertes" on public.search_alerts
  for insert with check (auth.uid() = user_id);

create policy "Utilisateur supprime ses alertes" on public.search_alerts
  for delete using (auth.uid() = user_id);


-- STORAGE BUCKET (photos)
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict do nothing;

create policy "Tout le monde voit les photos" on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy "Utilisateurs connectés uploadent" on storage.objects
  for insert with check (bucket_id = 'listing-photos' and auth.uid() is not null);

create policy "Utilisateurs suppriment leurs photos" on storage.objects
  for delete using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- REALTIME (messages en temps réel)
alter publication supabase_realtime add table public.messages;
