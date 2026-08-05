import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { recordClubContribution } from "@/lib/club-contributions";
import { PICKUP_TIP_CLUB_SHARE } from "@/lib/config";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const listingId     = pi.metadata?.listing_id;
    const buyerId       = pi.metadata?.buyer_id;
    const shippingMethod = pi.metadata?.shipping_method;
    const shippingAddress = pi.metadata?.shipping_address
      ? JSON.parse(pi.metadata.shipping_address)
      : null;

    if (!listingId) return NextResponse.json({ received: true });

    // Service role → bypass RLS
    const supabase = createServiceClient();

    // Pourboire "remise en main propre" — flux distinct de la vente elle-même,
    // ne marque jamais l'annonce comme vendue.
    if (pi.metadata?.type === "pickup_tip") {
      const { data: listing } = await supabase
        .from("listings")
        .select("seller_id")
        .eq("id", listingId)
        .single();

      if (listing && buyerId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("club")
          .eq("id", listing.seller_id)
          .single();

        const club = profile?.club?.trim() || null;
        const amount = pi.amount / 100;
        const clubShare = club ? Math.round(amount * PICKUP_TIP_CLUB_SHARE * 100) / 100 : null;

        await supabase.from("pickup_tips").insert({
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: listing.seller_id,
          amount,
          club,
          club_share: clubShare,
        });
      }
      return NextResponse.json({ received: true });
    }

    // 1. Marquer l'annonce comme vendue
    await supabase
      .from("listings")
      .update({ sold_at: new Date().toISOString() })
      .eq("id", listingId);

    // 2. Récupérer infos annonce + vendeur pour notifier
    const { data: listing } = await supabase
      .from("listings")
      .select("brand, name, price, seller_id, seller_name")
      .eq("id", listingId)
      .single();

    if (listing) {
      // 3. Suivi du reversement club (informatif, cf. src/lib/club-contributions.ts)
      // Reprend le prix article réellement facturé (metadata) — diffère du prix
      // affiché de l'annonce si une offre négociée a été acceptée.
      const paidItemPrice = pi.metadata?.item_price ? Number(pi.metadata.item_price) : listing.price;
      await recordClubContribution(supabase, listingId, listing.seller_id, paidItemPrice);

      // 4. Créer une notification pour le vendeur (table notifications si elle existe)
      // ou poster un message dans la conversation
      if (buyerId && buyerId !== "guest") {
        const { data: conv } = await supabase
          .from("conversations")
          .select("id")
          .eq("listing_id", listingId)
          .eq("buyer_id", buyerId)
          .maybeSingle();

        if (conv) {
          const amount = (pi.amount / 100).toFixed(2);
          let msgText = `✅ Paiement de ${amount} € confirmé !`;

          if (shippingMethod === "home" && shippingAddress) {
            msgText += `\n\n📦 Adresse de livraison :\n${shippingAddress.name}\n${shippingAddress.line1}${shippingAddress.line2 ? "\n" + shippingAddress.line2 : ""}\n${shippingAddress.postal_code} ${shippingAddress.city}`;
          } else if (shippingMethod === "pickup") {
            msgText += `\n\n🤝 Remise en main propre — contacte l'acheteur pour convenir d'un rendez-vous.`;
          }

          // Message visible dans la conversation pour les deux parties
          await supabase.from("messages").insert({
            conversation_id: conv.id,
            from_id: buyerId,
            text: msgText,
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
