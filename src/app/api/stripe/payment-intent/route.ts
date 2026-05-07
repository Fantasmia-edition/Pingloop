import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { SHIPPING_PRICES } from "@/types";

export async function POST(req: NextRequest) {
  const { listingId, shippingMethod, offerId, shippingAddress } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("listings")
    .select("price, sold_at, brand, name, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sold_at) return NextResponse.json({ error: "Cet article a déjà été vendu." }, { status: 400 });

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
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
