import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { SHIPPING_PRICES } from "@/types";
import { checkRateLimit } from "@/lib/rate-limit";
import { COMMISSION_RATE } from "@/lib/config";

export async function POST(req: NextRequest) {
  const { listingId, shippingMethod, offerId, shippingAddress } = await req.json();

  if (shippingMethod === "home") {
    const a = shippingAddress;
    if (!a?.name || !a?.line1 || !a?.postal_code || !a?.city) {
      return NextResponse.json({ error: "Adresse de livraison incomplète." }, { status: 400 });
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const rateLimitKey = `stripe-payment-intent:user:${user.id}`;
  const allowed = await checkRateLimit(supabase, rateLimitKey, 20, 600);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes, réessaie plus tard." }, { status: 429 });

  const { data: listing } = await supabase
    .from("listings")
    .select("price, sold_at, brand, name, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sold_at) return NextResponse.json({ error: "Cet article a déjà été vendu." }, { status: 400 });

  // Pas de clé étrangère directe entre listings et profiles (les deux référencent
  // auth.users séparément) — impossible à embarquer dans le select ci-dessus.
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarded")
    .eq("id", listing.seller_id)
    .single();
  // Vendeur pas encore onboardé sur Stripe → on encaisse quand même (sur le
  // solde Stripe de la plateforme, sans split) plutôt que de perdre la vente.
  // Les fonds dus sont débloqués vers le vendeur via un Transfer explicite dès
  // qu'il termine son onboarding (cf. /api/stripe/connect/return).
  const sellerOnboarded = !!sellerProfile?.stripe_onboarded && !!sellerProfile?.stripe_account_id;

  // Si paiement d'une offre acceptée → utiliser le montant de l'offre
  let itemPrice = listing.price;
  if (offerId) {
    const { data: offer } = await supabase
      .from("offers")
      .select("amount, status, from_id, to_id")
      .eq("id", offerId)
      .eq("listing_id", listingId)
      .single();

    if (!offer || offer.status !== "accepted") {
      return NextResponse.json({ error: "Offre introuvable ou non acceptée." }, { status: 400 });
    }
    itemPrice = offer.amount;
  }

  const shippingCost = shippingMethod === "home" ? SHIPPING_PRICES.home : 0;

  const totalCents = Math.round((itemPrice + shippingCost) * 100);
  // Commission calculée sur le prix de l'article uniquement (pas les frais de port,
  // qui reviennent intégralement au vendeur pour couvrir l'affranchissement réel).
  const applicationFeeCents = Math.round(itemPrice * COMMISSION_RATE * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "eur",
    metadata: {
      listing_id:       listingId,
      offer_id:         offerId ?? "",
      buyer_id:         user.id,
      shipping_method:  shippingMethod ?? "none",
      item_price:       String(itemPrice),
      shipping_cost:    String(shippingCost),
      shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : "",
      pending_payout:   sellerOnboarded ? "" : "true",
    },
    automatic_payment_methods: { enabled: true },
    ...(sellerOnboarded ? {
      application_fee_amount: applicationFeeCents,
      transfer_data: { destination: sellerProfile!.stripe_account_id! },
    } : {}),
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
