import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Resend } from "resend";

const FROM_EMAIL = "PingLoop <notifications@pingloop.fr>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pingloop.fr";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  // Seul le vendeur de l'annonce peut déclencher cette notification
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const supabase = createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, brand, name, price, condition, seller_id, seller_name")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.seller_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: authUser } = await supabase.auth.admin.getUserById(listing.seller_id);
  const email = authUser?.user?.email;
  if (!email) return NextResponse.json({ sent: false, reason: "no email" });

  const listingUrl = `${SITE_URL}/annonces/${listing.id}`;
  const conditionLabels: Record<string, string> = { new: "Neuf", like_new: "Comme neuf", good: "Bon état", fair: "État correct" };

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `✅ Ton annonce est en ligne — ${listing.brand} ${listing.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
        <h1 style="color:#f43f5e;font-size:22px;margin-bottom:4px">PingLoop</h1>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px">Bonjour ${listing.seller_name} !</p>

        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase">Annonce publiée</p>
          <h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#0f172a">${listing.brand} ${listing.name}</h2>
          <p style="margin:0;font-size:26px;font-weight:900;color:#f43f5e">${listing.price} €</p>
          <p style="margin:6px 0 0;font-size:13px;color:#6b7280">${conditionLabels[listing.condition] ?? listing.condition}</p>
        </div>

        <a href="${listingUrl}" style="display:block;text-align:center;background:#0f172a;color:white;font-weight:700;padding:14px 24px;border-radius:10px;text-decoration:none;font-size:15px;margin-bottom:20px">
          Voir mon annonce →
        </a>

        <div style="background:#f9fafb;border-radius:10px;padding:16px;font-size:13px;color:#6b7280">
          <p style="margin:0 0 8px;font-weight:700;color:#374151">Quelques conseils :</p>
          <ul style="margin:0;padding-left:16px;line-height:1.8">
            <li>Réponds vite aux messages — les acheteurs n'attendent pas</li>
            <li>Si tu n'as pas de réponses sous 48h, baisse légèrement le prix</li>
            <li>Active les alertes pour être notifié dès qu'un message arrive</li>
          </ul>
        </div>

        <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center">
          PingLoop — Le marché des pongistes
        </p>
      </div>
    `,
  });

  return NextResponse.json({ sent: true });
}
