import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { COMMISSION_RATE } from "@/lib/config";

export async function POST(req: NextRequest) {
  const { listingId } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { data: listing } = await supabase
    .from("listings")
    .select("*, profiles!listings_seller_id_fkey(stripe_account_id, stripe_onboarded)")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sold_at) return NextResponse.json({ error: "Déjà vendu" }, { status: 400 });

  const sellerProfile = (listing as { profiles?: { stripe_account_id?: string; stripe_onboarded?: boolean } }).profiles;
  if (!sellerProfile?.stripe_onboarded || !sellerProfile?.stripe_account_id) {
    return NextResponse.json({ error: "Vendeur non configuré sur Stripe" }, { status: 400 });
  }

  const amountCents = Math.round(listing.price * 100);
  const feeCents = Math.round(amountCents * COMMISSION_RATE);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "eur",
    application_fee_amount: feeCents,
    transfer_data: { destination: sellerProfile.stripe_account_id },
    metadata: { listing_id: listingId, buyer_id: user.id },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
