import { NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/config";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const referral = await paypalFetch("/v2/customer/partner-referrals", {
    method: "POST",
    body: JSON.stringify({
      tracking_id: user.id,
      operations: [{
        operation: "API_INTEGRATION",
        api_integration_preference: {
          rest_api_integration: {
            integration_method: "PAYPAL",
            integration_type: "THIRD_PARTY",
            third_party_details: { features: ["PAYMENT", "REFUND"] },
          },
        },
      }],
      products: ["PPCP"],
      legal_consents: [{ type: "SHARE_DATA_CONSENT", granted: true }],
      partner_config_override: {
        return_url: `${SITE_URL}/profil?paypal=success`,
        return_url_description: "Retour sur PingLoop",
      },
    }),
  });

  const actionUrl = referral.links?.find((l: { rel: string; href: string }) => l.rel === "action_url")?.href;
  return NextResponse.json({ url: actionUrl });
}
