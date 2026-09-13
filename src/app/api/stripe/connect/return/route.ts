import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { SITE_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("account");
  const userId = searchParams.get("user");

  if (!accountId || !userId) {
    return NextResponse.redirect(`${SITE_URL}/profil?stripe=error`);
  }

  const account = await stripe.accounts.retrieve(accountId);
  const onboarded = account.details_submitted && !account.requirements?.disabled_reason;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ stripe_onboarded: onboarded })
    .eq("id", userId);

  // Débloque la "cagnotte" : ventes encaissées sur le solde plateforme pendant
  // que ce vendeur n'était pas encore onboardé (cf. /api/stripe/payment-intent
  // et le webhook payment_intent.succeeded) — un Transfer par commande en attente.
  if (onboarded) {
    const serviceSupabase = createServiceClient();
    const { data: pendingOrders } = await serviceSupabase
      .from("orders")
      .select("id, stripe_charge_id, amount_due_seller")
      .eq("seller_id", userId)
      .eq("provider", "stripe")
      .eq("payout_status", "pending_seller_onboarding");

    for (const order of pendingOrders ?? []) {
      if (!order.stripe_charge_id || !order.amount_due_seller) continue;
      try {
        await stripe.transfers.create({
          amount: Math.round(order.amount_due_seller * 100),
          currency: "eur",
          destination: accountId,
          source_transaction: order.stripe_charge_id,
        });
        await serviceSupabase
          .from("orders")
          .update({ payout_status: "paid_out" })
          .eq("id", order.id);
      } catch {
        // Laisse payout_status à 'pending_seller_onboarding' pour cette commande —
        // nécessite une reprise manuelle (le Transfer n'a pas de mécanisme de retry
        // automatique ici).
      }
    }
  }

  return NextResponse.redirect(`${SITE_URL}/profil?stripe=${onboarded ? "success" : "pending"}`);
}
