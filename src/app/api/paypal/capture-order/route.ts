import { NextRequest, NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal";
import { createServiceClient } from "@/lib/supabase/service";
import { recordClubContribution } from "@/lib/club-contributions";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();

  const capture = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    body: JSON.stringify({}),
  });

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
      }
    }
  }

  return NextResponse.json({ status: capture.status });
}
