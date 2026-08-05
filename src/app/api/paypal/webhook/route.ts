import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyPaypalWebhookSignature } from "@/lib/paypal";
import { recordClubContribution } from "@/lib/club-contributions";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const verified = await verifyPaypalWebhookSignature(req.headers, rawBody);
  if (!verified) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const listingId = event.resource?.purchase_units?.[0]?.reference_id;
    if (listingId) {
      // Service role → bypass RLS (pas de session utilisateur sur un webhook)
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
        // Ce webhook est un filet de secours (la capture côté client insère déjà
        // la contribution club — insert idempotent, cf. club-contributions.ts).
        // event.resource est directement l'objet Capture ici, d'où custom_id à plat.
        const customId = event.resource?.custom_id;
        const paidItemPrice = customId && !isNaN(Number(customId)) ? Number(customId) : listing.price;
        await recordClubContribution(supabase, listingId, listing.seller_id, paidItemPrice);
      }
    }
  }

  return NextResponse.json({ received: true });
}
