import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/config";

/**
 * Retour du flux d'onboarding PayPal Commerce Platform (Partner Referrals).
 * PayPal ajoute ces paramètres à l'URL de retour une fois l'inscription du
 * vendeur terminée côté PayPal — voir partner_config_override.return_url
 * dans src/app/api/paypal/onboard/route.ts.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get("merchantIdInPayPal");
  const permissionsGranted = searchParams.get("permissionsGranted") === "true";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${SITE_URL}/profil?paypal=error`);

  if (!merchantId || !permissionsGranted) {
    return NextResponse.redirect(`${SITE_URL}/profil?paypal=pending`);
  }

  await supabase
    .from("profiles")
    .update({ paypal_merchant_id: merchantId, paypal_onboarded: true })
    .eq("id", user.id);

  return NextResponse.redirect(`${SITE_URL}/profil?paypal=success`);
}
