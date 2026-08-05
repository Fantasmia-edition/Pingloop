import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

const FROM_EMAIL = "PingLoop <notifications@pingloop.fr>";
const SUPPORT_EMAIL = "support@pingloop.fr";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pingloop.fr";

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const { listingId, reason, comment } = await req.json();
  if (!listingId || !reason) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const allowed = await checkRateLimit(supabase, `report:${user.id}`, 10, 3600);
  if (!allowed) return NextResponse.json({ error: "Trop de signalements, réessaie plus tard." }, { status: 429 });

  const { error } = await supabase.from("reports").insert({
    listing_id: listingId,
    reporter_id: user.id,
    reason: comment ? `${reason} — ${comment}` : reason,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Tu as déjà signalé cette annonce." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Email au support — best-effort, n'affecte pas la réponse à l'utilisateur
  const service = createServiceClient();
  const { data: listing } = await service
    .from("listings")
    .select("brand, name, seller_name")
    .eq("id", listingId)
    .single();

  const listingLabel = listing ? escapeHtml(`${listing.brand} ${listing.name}`) : listingId;
  const sellerLabel = listing ? escapeHtml(listing.seller_name) : "?";

  const resend = new Resend(process.env.RESEND_API_KEY);
  resend.emails.send({
    from: FROM_EMAIL,
    to: SUPPORT_EMAIL,
    subject: `🚩 Signalement — ${listingLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
        <h1 style="color:#f43f5e;font-size:20px;margin-bottom:12px">Nouveau signalement</h1>
        <p><strong>Annonce :</strong> ${listingLabel} (vendeur : ${sellerLabel})</p>
        <p><strong>Motif :</strong> ${escapeHtml(reason)}</p>
        ${comment ? `<p><strong>Commentaire :</strong> ${escapeHtml(comment)}</p>` : ""}
        <p><a href="${SITE_URL}/annonces/${listingId}">Voir l'annonce →</a></p>
      </div>
    `,
  }).catch((err) => console.error("report notification email failed", err));

  return NextResponse.json({ ok: true });
}
