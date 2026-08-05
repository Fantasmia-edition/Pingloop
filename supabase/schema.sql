-- =============================================================
-- PingLoop — Schéma Supabase
-- Colle ce fichier entier dans l'éditeur SQL de ton dashboard
-- =============================================================

-- LISTINGS
create table public.listings (
  id          uuid default gen_random_uuid() primary key,
  category    text not null check (category in ('rubber', 'blade', 'racket', 'tshirt', 'case')),
  brand       text not null,
  name        text not null,
  pimple_type text check (pimple_type in ('In', 'Out', 'Long')),
  color       text,
  condition   text not null check (condition in ('new', 'like_new', 'good', 'fair')),
  price       integer not null check (price > 0),
  description text default '',
  location    text,
  seller_id   uuid references auth.users(id) on delete cascade not null,
  seller_name text not null,
  approval_code text,
  photos      text[] default '{}',
  shipping_home     boolean default false,
  pickup_available  boolean default false,
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

create policy "Participants marquent les messages lus" on public.messages
  for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- Permet à Supabase Realtime de livrer les événements UPDATE (ex: read_at)
alter table public.messages replica identity full;


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


-- OFFERS (négociation de prix entre acheteur et vendeur)
create table public.offers (
  id          uuid default gen_random_uuid() primary key,
  listing_id  uuid references public.listings(id) on delete cascade not null,
  from_id     uuid references auth.users(id) on delete cascade not null,
  to_id       uuid references auth.users(id) on delete cascade not null,
  from_name   text not null,
  amount      integer not null check (amount > 0),
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  parent_id   uuid references public.offers(id) on delete cascade,
  created_at  timestamptz default now()
);

alter table public.offers enable row level security;

create policy "Participants voient leurs offres" on public.offers
  for select using (auth.uid() = from_id or auth.uid() = to_id);

create policy "Utilisateur crée une offre" on public.offers
  for insert with check (auth.uid() = from_id);

create policy "Destinataire répond à une offre" on public.offers
  for update using (auth.uid() = to_id);

-- REALTIME (offres en temps réel — utilisé par OffersSection)
alter publication supabase_realtime add table public.offers;


-- REVIEWS
create table public.reviews (
  id            uuid default gen_random_uuid() primary key,
  listing_id    uuid references public.listings(id) on delete cascade,
  seller_id     uuid references auth.users(id) on delete cascade,
  reviewer_id   uuid references auth.users(id) on delete cascade,
  reviewer_name text,
  rating        integer check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz default now(),
  unique(listing_id, reviewer_id)
);

alter table public.reviews enable row level security;

create policy "Tout le monde voit les avis" on public.reviews
  for select using (true);

create policy "Acheteur laisse un avis" on public.reviews
  for insert with check (auth.uid() = reviewer_id);


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


-- PICKUP TIPS
-- Soutien optionnel lors d'une remise en main propre (aucun argent ne
-- transite par la plateforme pour l'article lui-même dans ce cas — le
-- vendeur est payé directement par l'acheteur). 50% pour PingLoop, 50%
-- pour le club du vendeur s'il en a déclaré un. Écriture réservée au
-- webhook Stripe (service role) ; lecture publique pour la page /clubs.
create table public.pickup_tips (
  id          uuid default gen_random_uuid() primary key,
  listing_id  uuid references public.listings(id) on delete cascade not null,
  buyer_id    uuid references auth.users(id) on delete cascade not null,
  seller_id   uuid references auth.users(id) on delete cascade not null,
  amount      numeric(10,2) not null check (amount > 0),
  club        text,
  club_share  numeric(10,2),
  created_at  timestamptz default now()
);

alter table public.pickup_tips enable row level security;

create policy "Tout le monde voit les pourboires" on public.pickup_tips
  for select using (true);


-- FAVORITES
create table public.favorites (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  listing_id  uuid references public.listings(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Utilisateur voit ses favoris" on public.favorites
  for select using (auth.uid() = user_id);

create policy "Utilisateur ajoute un favori" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "Utilisateur retire un favori" on public.favorites
  for delete using (auth.uid() = user_id);


-- CLUB CONTRIBUTIONS
-- Suivi (informatif) du 1% reversé au club du vendeur, prélevé sur la
-- commission de 7% — n'affecte ni le prix payé par l'acheteur, ni le montant
-- reçu par le vendeur. Pas de virement automatique : écriture réservée aux
-- webhooks de paiement (service role), lecture publique pour la page /clubs.
create table public.club_contributions (
  id          uuid default gen_random_uuid() primary key,
  listing_id  uuid references public.listings(id) on delete cascade not null unique,
  seller_id   uuid references auth.users(id) on delete cascade not null,
  club        text not null,
  amount      numeric(10,2) not null,
  created_at  timestamptz default now()
);

alter table public.club_contributions enable row level security;

create policy "Tout le monde voit les contributions clubs" on public.club_contributions
  for select using (true);


-- REPORTS (signalement d'annonces par les utilisateurs)
create table public.reports (
  id          uuid default gen_random_uuid() primary key,
  listing_id  uuid references public.listings(id) on delete cascade not null,
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reason      text not null,
  created_at  timestamptz default now(),
  unique(listing_id, reporter_id)
);

alter table public.reports enable row level security;

create policy "Utilisateur crée un signalement" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "Utilisateur voit ses propres signalements" on public.reports
  for select using (auth.uid() = reporter_id);


-- RATE LIMITING
-- Table + fonction RPC génériques, appelables depuis les routes API
-- (Postgres plutôt que Vercel Edge : couvre aussi bien les appels API que
-- les écritures faites directement depuis le navigateur vers Supabase)
create table public.rate_limit_hits (
  key          text primary key,
  count        int not null default 1,
  window_start timestamptz not null default now()
);

alter table public.rate_limit_hits enable row level security;
-- Aucune policy : la table n'est accessible que via la fonction security definer ci-dessous.

create or replace function public.check_rate_limit(
  p_key text, p_max_count int, p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.rate_limit_hits%rowtype;
begin
  insert into public.rate_limit_hits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when public.rate_limit_hits.window_start < now() - (p_window_seconds || ' seconds')::interval
        then 1
      else public.rate_limit_hits.count + 1
    end,
    window_start = case
      when public.rate_limit_hits.window_start < now() - (p_window_seconds || ' seconds')::interval
        then now()
      else public.rate_limit_hits.window_start
    end
  returning * into v_row;

  return v_row.count <= p_max_count;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated;

-- Anti-spam sur les écritures faites directement depuis le navigateur
create or replace function public.check_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.messages
    where from_id = new.from_id and sent_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'Trop de messages envoyés, réessaie dans une minute.';
  end if;
  return new;
end;
$$;

create trigger messages_rate_limit
  before insert on public.messages
  for each row execute procedure public.check_message_rate_limit();

create or replace function public.check_offer_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.offers
    where from_id = new.from_id and created_at > now() - interval '10 minutes'
  ) >= 15 then
    raise exception 'Trop d''offres envoyées, réessaie plus tard.';
  end if;
  return new;
end;
$$;

create trigger offers_rate_limit
  before insert on public.offers
  for each row execute procedure public.check_offer_rate_limit();

create or replace function public.check_alert_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.search_alerts where user_id = new.user_id
  ) >= 20 then
    raise exception 'Limite de 20 alertes atteinte.';
  end if;
  return new;
end;
$$;

create trigger search_alerts_limit
  before insert on public.search_alerts
  for each row execute procedure public.check_alert_limit();
