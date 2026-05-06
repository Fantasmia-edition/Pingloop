import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { SHIPPING_PRICES } from "@/types";

export async function POST(req: NextRequest) {
  const { listingId, shippingMethod } = await req.json();

  const supabase = await createClient();
  // Auth optionnel — les acheteurs peuvent payer sans compte PingLoop
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("listings")
    .select("price, sold_at, brand, name, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sold_at) return NextResponse.json({ error: "Cet article a déjà été vendu." }, { status: 400 });

  const shippingCost =
    shippingMethod === "relay" ? SHIPPING_PRICES.relay :
    shippingMethod === "home"  ? SHIPPING_PRICES.home  : 0;

  const totalCents = Math.round((listing.price + shippingCost) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: "eur",
    metadata: {
      listing_id:      listingId,
      buyer_id:        user?.id ?? "guest",
      shipping_method: shippingMethod ?? "none",
      item_price:      String(listing.price),
      shipping_cost:   String(shippingCost),
    },
    // Stripe collecte l'email de l'acheteur via PaymentElement (pour le reçu)
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
