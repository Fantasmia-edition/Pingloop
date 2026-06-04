import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Resend } from "resend";

const FROM_EMAIL = "PingLoop <notifications@pingloop.fr>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = await req.json();
  const { type, listingId, fromName, amount, conversationId } = body;

  if (!type || !listingId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, brand, name, price, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", listing.seller_id)
    .single();

  const { data: authUser } = await supabase.auth.admin.getUserById(listing.seller_id);
  const sellerEmail = authUser?.user?.email;

  if (!sellerEmail) return NextResponse.json({ sent: false, reason: "no email" });

  const listingTitle = `${listing.brand} ${listing.name}`;
  const sellerName = profile?.display_name ?? "là";

  let subject = "";
  let html = "";

  if (type === "offer") {
    const listingUrl = `${SITE_URL}/annonces/${listingId}`;
    subject = `💬 ${fromName} t'a fait une offre à ${amount} € — ${listingTitle}`;
    html = `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
        <h1 style="color:#f43f5e;font-size:22px;margin-bottom:4px">PingLoop</h1>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px">Nouvelle offre sur ton annonce</p>
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Annonce</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:900;color:#0f172a">${listingTitle}</p>
          <p style="margin:0;font-size:28px;font-weight:900;color:#f43f5e">${amount} €</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280">proposé par <strong>${fromName}</strong> (prix affiché : ${listing.price} €)</p>
        </div>
        <a href="${listingUrl}" style="display:block;text-align:center;background:#0f172a;color:white;font-weight:700;padding:14px 24px;border-radius:10px;text-decoration:none;font-size:15px">
          Voir l'offre et répondre →
        </a>
        <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center">
          PingLoop — Le marché des pongistes
        </p>
      </div>
    `;
  } else if (type === "message") {
    const convUrl = `${SITE_URL}/messages/${conversationId}`;
    subject = `✉️ Nouveau message de ${fromName} — ${listingTitle}`;
    html = `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
        <h1 style="color:#f43f5e;font-size:22px;margin-bottom:4px">PingLoop</h1>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px">Nouveau message sur ton annonce</p>
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Annonce concernée</p>
          <p style="margin:0;font-size:18px;font-weight:900;color:#0f172a">${listingTitle}</p>
          <p style="margin:8px 0 0;font-size:13px;color:#6b7280"><strong>${fromName}</strong> t'a envoyé un message.</p>
        </div>
        <a href="${convUrl}" style="display:block;text-align:center;background:#0f172a;color:white;font-weight:700;padding:14px 24px;border-radius:10px;text-decoration:none;font-size:15px">
          Lire le message →
        </a>
        <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center">
          PingLoop — Le marché des pongistes
        </p>
      </div>
    `;
  } else {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  await resend.emails.send({ from: FROM_EMAIL, to: sellerEmail, subject, html });
  return NextResponse.json({ sent: true, to: sellerEmail });
}
