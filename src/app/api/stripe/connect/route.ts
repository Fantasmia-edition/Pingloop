import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/config";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  // Récupère ou crée le compte Stripe Connect Express
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  let accountId = profile?.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    });
    accountId = account.id;
    await supabase.from("profiles").upsert({ id: user.id, stripe_account_id: accountId });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${SITE_URL}/profil?stripe=refresh`,
    return_url: `${SITE_URL}/api/stripe/connect/return?account=${accountId}&user=${user.id}`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
