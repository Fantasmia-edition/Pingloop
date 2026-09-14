import { NextRequest, NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { recordClubContribution } from "@/lib/club-contributions";
import { generatePickupCode } from "@/lib/pickup-code";
import { SHIPPING_PRICES } from "@/types";

export async function POST(req: NextRequest) {
  const { orderId, shippingMethod, shippingAddress } = await req.json();

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const capture = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  let pickupCode: string | null = null;

  if (capture.status === "COMPLETED") {
    const listingId = capture.purchase_units?.[0]?.reference_id;
    if (listingId) {
      // Service role → bypass RLS (l'acheteur, qui appelle cette route, n'est pas
      // le vendeur : un client soumis à la RLS ne peut pas mettre à jour l'annonce)
      const supabase = createServiceClient();
      await supabase
        .from("listings")
        .update({ sold_at: new Date().toISOString() })
        .eq("id", listingId);

      const { data: listing } = await supabase
        .from("listings")
        .select("price, seller_id")
        .eq("id", listingId)
        .single();

      if (listing) {
        // Reprend le prix article réellement facturé (posé en custom_id à la création
        // de la commande) — diffère du prix affiché de l'annonce si une offre a été acceptée.
        const customId =
          capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id ??
          capture.purchase_units?.[0]?.custom_id;
        const paidItemPrice = customId && !isNaN(Number(customId)) ? Number(customId) : listing.price;
        await recordClubContribution(supabase, listingId, listing.seller_id, paidItemPrice);

        // Remis à l'acheteur juste après paiement, à donner au vendeur lors de la
        // remise en main propre pour qu'il confirme l'échange sur la plateforme.
        if (shippingMethod !== "home") pickupCode = generatePickupCode();

        // Commande + adresse de livraison — stockage structuré, indépendant de la
        // messagerie (upsert idempotent si l'acheteur redéclenche la capture).
        const { error: orderError } = await supabase.from("orders").upsert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          provider: "paypal",
          item_price: paidItemPrice,
          shipping_cost: shippingMethod === "home" ? SHIPPING_PRICES.home : 0,
          shipping_method: shippingMethod === "home" ? "home" : "pickup",
          shipping_name: shippingAddress?.name ?? null,
          shipping_line1: shippingAddress?.line1 ?? null,
          shipping_line2: shippingAddress?.line2 ?? null,
          shipping_postal_code: shippingAddress?.postal_code ?? null,
          shipping_city: shippingAddress?.city ?? null,
          pickup_code: pickupCode,
        }, { onConflict: "listing_id", ignoreDuplicates: true });
        if (orderError) console.error("paypal capture: échec création order", listingId, orderError);
      }
    }
  }

  return NextResponse.json({ status: capture.status, pickupCode });
}
