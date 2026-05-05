import { NextRequest, NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";
import { COMMISSION_RATE } from "@/lib/config";

export async function POST(req: NextRequest) {
  const { listingId } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { data: listing } = await supabase
    .from("listings")
    .select("*, profiles!listings_seller_id_fkey(paypal_merchant_id, paypal_onboarded)")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sold_at) return NextResponse.json({ error: "Déjà vendu" }, { status: 400 });

  const sellerProfile = (listing as { profiles?: { paypal_merchant_id?: string; paypal_onboarded?: boolean } }).profiles;
  if (!sellerProfile?.paypal_onboarded || !sellerProfile?.paypal_merchant_id) {
    return NextResponse.json({ error: "Vendeur non configuré sur PayPal" }, { status: 400 });
  }

  const price = listing.price.toFixed(2);
  const fee = (listing.price * COMMISSION_RATE).toFixed(2);

  const order = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: listingId,
        amount: { currency_code: "EUR", value: price },
        payee: { merchant_id: sellerProfile.paypal_merchant_id },
        payment_instruction: {
          disbursement_mode: "INSTANT",
          platform_fees: [{
            amount: { currency_code: "EUR", value: fee },
          }],
        },
      }],
    }),
  });

  return NextResponse.json({ orderId: order.id });
}
