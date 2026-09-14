import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { recordClubContribution } from "@/lib/club-contributions";
import { PICKUP_TIP_CLUB_SHARE, COMMISSION_RATE } from "@/lib/config";

const FROM_EMAIL = "PingLoop <notifications@pingloop.fr>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    const { error: markSoldError } = await supabase
      .from("listings")
      .update({ sold_at: new Date().toISOString() })
      .eq("id", listingId);
    if (markSoldError) console.error("webhook: échec mark sold_at", listingId, markSoldError);

    // 2. Récupérer infos annonce + vendeur pour notifier
    const { data: listing, error: listingFetchError } = await supabase
      .from("listings")
      .select("brand, name, price, seller_id, seller_name")
      .eq("id", listingId)
      .single();
    if (listingFetchError) console.error("webhook: échec lecture listing", listingId, listingFetchError);

    if (listing) {
      // 3. Suivi du reversement club (informatif, cf. src/lib/club-contributions.ts)
      // Reprend le prix article réellement facturé (metadata) — diffère du prix
      // affiché de l'annonce si une offre négociée a été acceptée.
      const paidItemPrice = pi.metadata?.item_price ? Number(pi.metadata.item_price) : listing.price;
      await recordClubContribution(supabase, listingId, listing.seller_id, paidItemPrice);

      // 3bis. Commande + adresse de livraison — stockage structuré, indépendant de la
      // messagerie (upsert idempotent : Stripe peut retenter l'envoi du webhook).
      // pending_payout = "true" → le vendeur n'était pas encore onboardé Stripe au
      // moment du paiement, les fonds sont retenus sur le solde plateforme (aucun
      // transfer_data sur le PaymentIntent, cf. /api/stripe/payment-intent) et seront
      // débloqués via un Transfer explicite dès qu'il termine son onboarding.
      const isPending = pi.metadata?.pending_payout === "true";
      const shippingCostValue = pi.metadata?.shipping_cost ? Number(pi.metadata.shipping_cost) : 0;
      const latestCharge = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null;

      const { error: orderError } = await supabase.from("orders").upsert({
        listing_id: listingId,
        buyer_id: buyerId && buyerId !== "guest" ? buyerId : null,
        seller_id: listing.seller_id,
        provider: "stripe",
        item_price: paidItemPrice,
        shipping_cost: shippingCostValue,
        shipping_method: shippingMethod === "home" ? "home" : "pickup",
        shipping_name: shippingAddress?.name ?? null,
        shipping_line1: shippingAddress?.line1 ?? null,
        shipping_line2: shippingAddress?.line2 ?? null,
        shipping_postal_code: shippingAddress?.postal_code ?? null,
        shipping_city: shippingAddress?.city ?? null,
        payout_status: isPending ? "pending_seller_onboarding" : "paid_out",
        stripe_charge_id: isPending ? latestCharge : null,
        pickup_code: shippingMethod !== "home" ? (pi.metadata?.pickup_code || null) : null,
        amount_due_seller: isPending
          ? Math.round((paidItemPrice * (1 - COMMISSION_RATE) + shippingCostValue) * 100) / 100
          : null,
      }, { onConflict: "listing_id", ignoreDuplicates: true });
      if (orderError) console.error("webhook: échec création order", listingId, orderError);

      // 4. Message de confirmation dans la conversation — créée si elle n'existe
      // pas encore (un achat direct au prix affiché ne passe plus forcément par
      // "Contacter le vendeur" avant de payer).
      if (buyerId && buyerId !== "guest") {
        const { data: existingConv } = await supabase
          .from("conversations")
          .select("id")
          .eq("listing_id", listingId)
          .eq("buyer_id", buyerId)
          .maybeSingle();

        let convId = existingConv?.id ?? null;

        if (!convId) {
          const { data: buyerProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", buyerId)
            .single();
          const { data: buyerAuth } = await supabase.auth.admin.getUserById(buyerId);
          const buyerName = buyerProfile?.display_name
            || buyerAuth?.user?.email?.split("@")[0]
            || "Acheteur";

          const { data: createdConv, error: convError } = await supabase
            .from("conversations")
            .insert({
              listing_id: listingId,
              buyer_id: buyerId,
              seller_id: listing.seller_id,
              buyer_name: buyerName,
              seller_name: listing.seller_name,
            })
            .select("id")
            .single();
          if (convError) console.error("webhook: échec création conversation", listingId, convError);
          convId = createdConv?.id ?? null;
        }

        if (convId) {
          const amount = (pi.amount / 100).toFixed(2);
          let msgText = `✅ Paiement de ${amount} € confirmé !`;

          if (shippingMethod === "home" && shippingAddress) {
            msgText += `\n\n📦 Adresse de livraison :\n${shippingAddress.name}\n${shippingAddress.line1}${shippingAddress.line2 ? "\n" + shippingAddress.line2 : ""}\n${shippingAddress.postal_code} ${shippingAddress.city}`;
          } else if (shippingMethod === "pickup") {
            msgText += `\n\n🤝 Remise en main propre — contacte l'acheteur pour convenir d'un rendez-vous.`;
          }

          // Message visible dans la conversation pour les deux parties
          const { error: msgError } = await supabase.from("messages").insert({
            conversation_id: convId,
            from_id: buyerId,
            text: msgText,
          });
          if (msgError) console.error("webhook: échec message confirmation", listingId, msgError);
        }
      }

      // 5. Email de vente au vendeur — seul canal garanti de le prévenir tout de
      // suite (la cloche in-app ne se rafraîchit qu'à la prochaine navigation).
      const { data: sellerAuth } = await supabase.auth.admin.getUserById(listing.seller_id);
      const sellerEmail = sellerAuth?.user?.email;
      if (sellerEmail) {
        const listingTitle = escapeHtml(`${listing.brand} ${listing.name}`);
        const amount = (pi.amount / 100).toFixed(2);
        const listingUrl = `${SITE_URL}/annonces/${listingId}`;
        const resend = new Resend(process.env.RESEND_API_KEY);
        try {
          const { error: emailSendError } = await resend.emails.send({
            from: FROM_EMAIL,
            to: sellerEmail,
            subject: `🎉 Vendu ! ${listingTitle} — ${amount} €`,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
                <h1 style="color:#f43f5e;font-size:22px;margin-bottom:4px">PingLoop</h1>
                <p style="color:#6b7280;font-size:14px;margin-bottom:24px">Ton annonce vient d'être payée</p>
                <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
                  <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Annonce vendue</p>
                  <p style="margin:0 0 12px;font-size:18px;font-weight:900;color:#0f172a">${listingTitle}</p>
                  <p style="margin:0;font-size:28px;font-weight:900;color:#f43f5e">${amount} €</p>
                  <p style="margin:8px 0 0;font-size:13px;color:#6b7280">
                    ${shippingMethod === "home" ? "Envoi par La Poste — prépare le colis." : "Remise en main propre — contacte l'acheteur pour convenir d'un rendez-vous."}
                  </p>
                </div>
                <a href="${listingUrl}" style="display:block;text-align:center;background:#0f172a;color:white;font-weight:700;padding:14px 24px;border-radius:10px;text-decoration:none;font-size:15px">
                  Voir l'annonce →
                </a>
                <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center">
                  PingLoop — Le marché des pongistes
                </p>
              </div>
            `,
          });
          if (emailSendError) console.error("webhook: échec email vente vendeur", listingId, emailSendError);
        } catch (emailError) {
          console.error("webhook: échec email vente vendeur", listingId, emailError);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
