import type { SupabaseClient } from "@supabase/supabase-js";
import { CLUB_SHARE_RATE } from "@/lib/config";

/**
 * Enregistre la part reversée au club du vendeur pour une vente conclue.
 * Idempotent (unique(listing_id) en base) — sûr à appeler depuis plusieurs
 * points d'entrée (webhook + confirmation client) pour la même vente.
 * Ne lève jamais d'erreur bloquante : un souci ici ne doit pas faire échouer
 * la vente elle-même, seulement le suivi du reversement club.
 */
export async function recordClubContribution(
  supabase: SupabaseClient,
  listingId: string,
  sellerId: string,
  price: number
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("club")
    .eq("id", sellerId)
    .single();

  const club = profile?.club?.trim();
  if (!club) return;

  const amount = Math.round(price * CLUB_SHARE_RATE * 100) / 100;

  const { error } = await supabase.from("club_contributions").insert({
    listing_id: listingId,
    seller_id: sellerId,
    club,
    amount,
  });

  if (error && error.code !== "23505") {
    console.error("recordClubContribution failed", error);
  }
}
