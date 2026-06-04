import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Resend } from "resend";

const FROM_EMAIL = "PingLoop <digest@pingloop.fr>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pingloop.fr";

// Protège la route avec un secret pour l'appel depuis un cron externe
function isAuthorized(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createServiceClient();

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Récupère toutes les alertes actives avec leur user
  const { data: alerts } = await supabase
    .from("search_alerts")
    .select("id, user_id, email, category, brand, name, pimple_type, max_price");

  if (!alerts?.length) return NextResponse.json({ sent: 0 });

  // Grouper les alertes par email
  const byEmail: Record<string, typeof alerts> = {};
  for (const a of alerts) {
    if (!byEmail[a.email]) byEmail[a.email] = [];
    byEmail[a.email].push(a);
  }

  let sent = 0;

  for (const [email, userAlerts] of Object.entries(byEmail)) {
    const matchingListings: Array<{ id: string; brand: string; name: string; price: number; condition: string; photos: string[] }> = [];

    for (const alert of userAlerts) {
      let query = supabase
        .from("listings")
        .select("id, brand, name, price, condition, photos")
        .is("sold_at", null)
        .gte("created_at", oneWeekAgo)
        .order("created_at", { ascending: false })
        .limit(3);

      if (alert.category) query = query.eq("category", alert.category);
      if (alert.brand) query = query.eq("brand", alert.brand);
      if (alert.pimple_type) query = query.eq("pimple_type", alert.pimple_type);
      if (alert.max_price) query = query.lte("price", alert.max_price);

      const { data: listings } = await query;
      const filtered = (listings ?? []).filter(
        (l) => !alert.name || l.name.toLowerCase().includes(alert.name.toLowerCase())
      );
      for (const l of filtered) {
        if (!matchingListings.find((x) => x.id === l.id)) matchingListings.push(l);
      }
    }

    if (!matchingListings.length) continue;

    const conditionLabels: Record<string, string> = { new: "Neuf", like_new: "Comme neuf", good: "Bon état", fair: "État correct" };

    const listingsHtml = matchingListings.slice(0, 6).map((l) => `
      <a href="${SITE_URL}/annonces/${l.id}" style="display:block;text-decoration:none;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0f172a">${l.brand} ${l.name}</p>
            <p style="margin:0;font-size:12px;color:#6b7280">${conditionLabels[l.condition] ?? l.condition}</p>
          </div>
          <p style="margin:0;font-size:20px;font-weight:900;color:#f43f5e">${l.price} €</p>
        </div>
      </a>
    `).join("");

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `🏓 ${matchingListings.length} nouvelle${matchingListings.length > 1 ? "s" : ""} annonce${matchingListings.length > 1 ? "s" : ""} cette semaine`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
          <h1 style="color:#f43f5e;font-size:22px;margin-bottom:4px">PingLoop</h1>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px">
            Voici ce qui correspond à tes alertes cette semaine.
          </p>

          ${listingsHtml}

          <a href="${SITE_URL}/annonces" style="display:block;text-align:center;background:#0f172a;color:white;font-weight:700;padding:14px 24px;border-radius:10px;text-decoration:none;font-size:14px;margin-top:16px">
            Voir toutes les annonces →
          </a>

          <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center">
            Tu reçois cet email car tu as des alertes actives.<br>
            <a href="${SITE_URL}/alertes" style="color:#9ca3af">Gérer mes alertes</a>
          </p>
        </div>
      `,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
