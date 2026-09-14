import { NextRequest, NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";
import { COMMISSION_RATE } from "@/lib/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { SHIPPING_PRICES } from "@/types";

export async function POST(req: NextRequest) {
  const { listingId, offerId, shippingMethod, shippingAddress } = await req.json();

  if (shippingMethod === "home") {
    const a = shippingAddress;
    if (!a?.name || !a?.line1 || !a?.postal_code || !a?.city) {
      return NextResponse.json({ error: "Adresse de livraison incomplète." }, { status: 400 });
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const allowed = await checkRateLimit(supabase, `paypal-create-order:${user.id}`, 20, 600);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes, réessaie plus tard." }, { status: 429 });

  const { data: listing } = await supabase
    .from("listings")
    .select("price, sold_at, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  if (listing.sold_at) return NextResponse.json({ error: "Déjà vendu" }, { status: 400 });

  // Pas de clé étrangère directe entre listings et profiles (les deux référencent
  // auth.users séparément) — impossible à embarquer dans le select ci-dessus.
  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("paypal_merchant_id, paypal_onboarded")
    .eq("id", listing.seller_id)
    .single();
  if (!sellerProfile?.paypal_onboarded || !sellerProfile?.paypal_merchant_id) {
    return NextResponse.json({ error: "Vendeur non configuré sur PayPal" }, { status: 400 });
  }

  // Si paiement d'une offre acceptée → utiliser le montant de l'offre (comme côté Stripe)
  let itemPrice = listing.price;
  if (offerId) {
    const { data: offer } = await supabase
      .from("offers")
      .select("amount, status")
      .eq("id", offerId)
      .eq("listing_id", listingId)
      .single();

    if (!offer || offer.status !== "accepted") {
      return NextResponse.json({ error: "Offre introuvable ou non acceptée." }, { status: 400 });
    }
    itemPrice = offer.amount;
  }

  const shippingCost = shippingMethod === "home" ? SHIPPING_PRICES.home : 0;
  const total = itemPrice + shippingCost;

  const price = total.toFixed(2);
  // Commission calculée sur le prix de l'article uniquement — le port revient
  // intégralement au vendeur (même logique que côté Stripe).
  const fee = (itemPrice * COMMISSION_RATE).toFixed(2);

  const order = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: listingId,
        // Conserve le prix article réellement facturé (utile en capture/webhook,
        // notamment pour calculer le reversement club sur le bon montant).
        custom_id: String(itemPrice),
        amount: { currency_code: "EUR", value: price },
        payee: { merchant_id: sellerProfile.paypal_merchant_id },
        payment_instruction: {
          disbursement_mode: "INSTANT",
          platform_fees: [{
            amount: { currency_code: "EUR", value: fee },
          }],
        },
        ...(shippingMethod === "home" ? {
          shipping: {
            name: { full_name: shippingAddress.name },
            address: {
              address_line_1: shippingAddress.line1,
              address_line_2: shippingAddress.line2 || undefined,
              admin_area_2: shippingAddress.city,
              postal_code: shippingAddress.postal_code,
              country_code: "FR",
            },
          },
        } : {}),
      }],
    }),
  });

  return NextResponse.json({ orderId: order.id });
}
