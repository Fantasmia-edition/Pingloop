import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/annonces`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/comment-ca-marche`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/clubs`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/vendre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/cgu-cgv`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/confidentialite`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.1 },
  ];

  // Client anonyme, lecture publique (RLS: "Tout le monde voit les annonces")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: listings } = await supabase
    .from("listings")
    .select("id, created_at")
    .is("sold_at", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  const listingRoutes: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${SITE_URL}/annonces/${l.id}`,
    lastModified: l.created_at,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes];
}
