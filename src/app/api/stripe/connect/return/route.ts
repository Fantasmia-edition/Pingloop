import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
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

  return NextResponse.redirect(`${SITE_URL}/profil?stripe=${onboarded ? "success" : "pending"}`);
}
