-- =============================================================
-- PingLoop — Table profiles
-- Colle dans l'éditeur SQL Supabase et clique Run
-- =============================================================

create table public.profiles (
  id                  uuid references auth.users(id) on delete cascade primary key,
  display_name        text,
  location            text,
  -- Stripe Connect Express
  stripe_account_id   text unique,
  stripe_onboarded    boolean default false,
  -- PayPal Commerce Platform
  paypal_merchant_id  text unique,
  paypal_onboarded    boolean default false,
  created_at          timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profils visibles par tous" on public.profiles
  for select using (true);

create policy "Utilisateur crée son profil" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Utilisateur modifie son profil" on public.profiles
  for update using (auth.uid() = id);

-- Auto-créer le profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
