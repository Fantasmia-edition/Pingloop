import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé service role — bypass RLS.
 * À utiliser UNIQUEMENT dans les API routes server-side (webhooks, cron…).
 * Ne jamais exposer côté client.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
