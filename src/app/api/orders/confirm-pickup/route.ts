import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { listingId, code } = await req.json();
  if (!listingId || !code) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const allowed = await checkRateLimit(supabase, `confirm-pickup:${user.id}`, 10, 600);
  if (!allowed) return NextResponse.json({ error: "Trop de tentatives, réessaie plus tard." }, { status: 429 });

  // RLS limite la lecture au vendeur ou à l'acheteur de cette commande — on
  // vérifie donc que l'appelant en est bien le vendeur avant toute écriture.
  const { data: order } = await supabase
    .from("orders")
    .select("id, seller_id, shipping_method, pickup_code, pickup_confirmed_at")
    .eq("listing_id", listingId)
    .single();

  if (!order || order.seller_id !== user.id) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }
  if (order.shipping_method !== "pickup") {
    return NextResponse.json({ error: "Cette commande n'est pas en remise en main propre." }, { status: 400 });
  }
  if (order.pickup_confirmed_at) {
    return NextResponse.json({ confirmed: true });
  }
  if (!order.pickup_code || String(code).trim() !== order.pickup_code) {
    return NextResponse.json({ error: "Code incorrect." }, { status: 400 });
  }

  // Écriture via service role : aucune policy UPDATE n'existe sur orders pour
  // un client authentifié classique, la vérification ci-dessus en tient lieu.
  const service = createServiceClient();
  const { error } = await service
    .from("orders")
    .update({ pickup_confirmed_at: new Date().toISOString() })
    .eq("id", order.id);

  if (error) {
    console.error("confirm-pickup: échec mise à jour", listingId, error);
    return NextResponse.json({ error: "Erreur serveur, réessaie." }, { status: 500 });
  }

  return NextResponse.json({ confirmed: true });
}
