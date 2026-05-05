import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

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
    const listingId = pi.metadata?.listing_id;
    if (listingId) {
      const supabase = await createClient();
      await supabase
        .from("listings")
        .update({ sold_at: new Date().toISOString() })
        .eq("id", listingId);
    }
  }

  return NextResponse.json({ received: true });
}

// Stripe envoie du raw body — pas de parsing JSON automatique
export const config = { api: { bodyParser: false } };
