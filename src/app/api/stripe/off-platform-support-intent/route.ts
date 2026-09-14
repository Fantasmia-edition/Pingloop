import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { OFF_PLATFORM_SUPPORT_AMOUNTS } from "@/lib/config";

export async function POST(req: NextRequest) {
  const { listingId, amount } = await req.json();

  if (!listingId || !OFF_PLATFORM_SUPPORT_AMOUNTS.includes(amount)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const allowed = await checkRateLimit(supabase, `off-platform-support-intent:${user.id}`, 10, 600);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes, réessaie plus tard." }, { status: 429 });

  // Le vendeur doit être propriétaire de l'annonce qu'il déclare vendue ailleurs.
  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", listingId)
    .single();
  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  // Pas de transfer_data : ce paiement reste entièrement sur le compte plateforme.
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "eur",
    metadata: {
      type: "off_platform_support",
      listing_id: listingId,
      seller_id: user.id,
    },
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
