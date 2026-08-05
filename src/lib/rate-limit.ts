import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Limite le nombre d'appels pour une clé donnée sur une fenêtre glissante,
 * via la fonction Postgres `check_rate_limit` (voir supabase/schema.sql).
 * Fail-open : si la RPC échoue (ex. fonction pas encore déployée), on
 * n'empêche pas le service de fonctionner — on logge et on laisse passer.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("check_rate_limit failed", error);
    return true;
  }
  return data === true;
}
