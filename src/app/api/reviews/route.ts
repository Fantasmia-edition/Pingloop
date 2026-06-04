import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listing_id, rating, comment } = await req.json();
  if (!listing_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  // Vérifie que l'annonce est bien vendue et que l'user est l'acheteur
  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, seller_name, brand, name")
    .eq("id", listing_id)
    .not("sold_at", "is", null)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found or not sold" }, { status: 404 });
  if (listing.seller_id === user.id) return NextResponse.json({ error: "Cannot review yourself" }, { status: 403 });

  // Vérifie qu'il n'y a pas déjà un avis de cet user pour ce listing
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("listing_id", listing_id)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Already reviewed" }, { status: 409 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("reviews").insert({
    listing_id,
    seller_id: listing.seller_id,
    reviewer_id: user.id,
    reviewer_name: profile?.display_name ?? user.email?.split("@")[0] ?? "Anonyme",
    rating,
    comment: comment?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
