import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { SHIPPING_PRICES } from "@/types";
import { checkRateLimit } from "@/lib/rate-limit";
import { COMMISSION_RATE } from "@/lib/config";

export async function POST(req: NextRequest) {
  const { listingId, shippingMethod, offerId, shippingAddress } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimitKey = user ? `stripe-payment-intent:user:${user.id}` : `stripe-payment-intent:ip:${ip}`;
  const allowed = await checkRateLimit(supabase, rateLimitKey, 20, 600);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes, réessaie plus tard." }, { status: 429 });

  const { data: listing } = await supabase
    .from("listings")
    .select("price, sold_at, brand, name, seller_id, profiles!listings_seller_id_fkey(stripe_account_id, stripe_onboarded)")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sold_at) return NextResponse.json({ error: "Cet article a déjà été vendu." }, { status: 400 });

  const sellerProfile = (listing as { profiles?: { stripe_account_id?: string; stripe_onboarded?: boolean } }).profiles;
  if (!sellerProfile?.stripe_onboarded || !sellerProfile?.stripe_account_id) {
    return NextResponse.json({ error: "Le vendeur n'a pas encore activé les paiements par carte." }, { status: 400 });
  }

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
      buyer_id:         user?.id ?? "guest",
      shipping_method:  shippingMethod ?? "none",
      item_price:       String(itemPrice),
      shipping_cost:    String(shippingCost),
      shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : "",
    },
    automatic_payment_methods: { enabled: true },
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: sellerProfile.stripe_account_id },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
