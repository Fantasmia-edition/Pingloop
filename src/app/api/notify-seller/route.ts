import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

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
  const { type, listingId, conversationId } = await req.json();
  if (!type || !listingId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Authentification requise — on ne fait jamais confiance à fromName/amount envoyés par le client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const allowed = await checkRateLimit(supabase, `notify-seller:${user.id}`, 15, 600);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes, réessaie plus tard." }, { status: 429 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const fromName = escapeHtml(profile?.display_name ?? user.email?.split("@")[0] ?? "Un membre PingLoop");

  let amount: number | null = null;

  if (type === "offer") {
    // RLS: ne retourne l'offre que si l'utilisateur en est bien l'auteur
    const { data: offer } = await supabase
      .from("offers")
      .select("amount")
      .eq("listing_id", listingId)
      .eq("from_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!offer) return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    amount = offer.amount;
  } else if (type === "message") {
    if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    // RLS: ne retourne la conversation que si l'utilisateur en est participant
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("listing_id", listingId)
      .maybeSingle();
    if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  } else {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: listing } = await service
    .from("listings")
    .select("id, brand, name, price, seller_id")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.seller_id === user.id) return NextResponse.json({ sent: false, reason: "self" });

  const { data: authUser } = await service.auth.admin.getUserById(listing.seller_id);
  const sellerEmail = authUser?.user?.email;
  if (!sellerEmail) return NextResponse.json({ sent: false, reason: "no email" });

  const listingTitle = escapeHtml(`${listing.brand} ${listing.name}`);
  const resend = new Resend(process.env.RESEND_API_KEY);

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
  } else {
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
  }

  await resend.emails.send({ from: FROM_EMAIL, to: sellerEmail, subject, html });
  return NextResponse.json({ sent: true, to: sellerEmail });
}
