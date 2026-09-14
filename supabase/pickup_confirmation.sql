-- =============================================================
-- PingLoop — Code de confirmation de remise en main propre
-- Colle ce fichier dans l'éditeur SQL de ton dashboard Supabase
-- =============================================================

alter table public.orders
  add column pickup_code text,
  add column pickup_confirmed_at timestamptz;
