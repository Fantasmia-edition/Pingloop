import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "PingLoop <alertes@pingloop.fr>";

export async function POST(req: NextRequest) {
  const { listingId } = await req.json();
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Find matching alerts
  let query = supabase.from("search_alerts").select("*");

  if (listing.category) query = query.or(`category.is.null,category.eq.${listing.category}`);
  if (listing.brand) query = query.or(`brand.is.null,brand.eq.${listing.brand}`);
  if (listing.pimple_type) query = query.or(`pimple_type.is.null,pimple_type.eq.${listing.pimple_type}`);
  query = query.or(`max_price.is.null,max_price.gte.${listing.price}`);

  const { data: alerts } = await query;
  if (!alerts?.length) return NextResponse.json({ sent: 0 });

  // Filter by name if specified (substring match)
  const matching = alerts.filter((a) =>
    !a.name || listing.name.toLowerCase().includes(a.name.toLowerCase())
  );

  let sent = 0;
  for (const alert of matching) {
    const listingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/annonces/${listing.id}`;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: alert.email,
      subject: `🏓 Alerte PingLoop — ${listing.brand} ${listing.name} à ${listing.price}€`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
          <h1 style="color:#f97316;font-size:24px;margin-bottom:4px">PingLoop</h1>
          <p style="color:#6b7280;font-size:14px;margin-bottom:24px">Une annonce correspond à ton alerte !</p>

          <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px">
            <p style="font-size:12px;font-weight:700;color:#f97316;text-transform:uppercase;margin:0 0 4px">
              ${listing.category === "rubber" ? "Revêtement" : "Bois"}
            </p>
            <h2 style="margin:0 0 12px;font-size:20px;color:#111">${listing.brand} ${listing.name}</h2>
            <p style="font-size:28px;font-weight:900;color:#111;margin:0 0 12px">${listing.price} €</p>
            <p style="font-size:13px;color:#6b7280;margin:0">
              ${listing.condition === "new" ? "Neuf" : listing.condition === "like_new" ? "Comme neuf" : listing.condition === "good" ? "Bon état" : "État correct"}
              ${listing.location ? ` · ${listing.location}` : ""}
            </p>
          </div>

          <a href="${listingUrl}" style="display:block;text-align:center;background:#f97316;color:white;font-weight:700;padding:14px 24px;border-radius:10px;text-decoration:none;font-size:15px">
            Voir l'annonce →
          </a>

          <p style="font-size:11px;color:#9ca3af;margin-top:24px;text-align:center">
            Tu reçois cet email car tu as créé une alerte sur PingLoop.<br>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/alertes" style="color:#9ca3af">Gérer mes alertes</a>
          </p>
        </div>
      `,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
