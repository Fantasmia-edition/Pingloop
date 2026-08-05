import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Nouvel inscrit qui vient de confirmer son email → onboarding pour choisir un pseudo,
    // plutôt que d'atterrir anonymement sur l'accueil (uniquement si aucune redirection explicite).
    if (data.user && !redirect) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .single();
      if (!profile?.display_name) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirect ?? "/"}`);
}
