import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import EarlyAdopterBadge from "@/components/EarlyAdopterBadge";
import { Listing } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name").eq("id", id).single();
  if (!data) return {};
  return {
    title: `${data.display_name} — Vendeur PingLoop`,
    description: `Toutes les annonces de ${data.display_name} sur PingLoop, le marché des pongistes.`,
  };
}

export default async function VendeurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: profile }, { data: activeRaw }, { data: soldRaw }, { data: reviewsRaw }] = await Promise.all([
    supabase.from("profiles").select("display_name, location, early_adopter, created_at").eq("id", id).single(),
    supabase.from("listings").select("*").eq("seller_id", id).is("sold_at", null).order("created_at", { ascending: false }),
    supabase.from("listings").select("id, brand, name, price, sold_at").eq("seller_id", id).not("sold_at", "is", null).order("sold_at", { ascending: false }).limit(50),
    supabase.from("reviews").select("id, rating, comment, reviewer_name, created_at").eq("seller_id", id).order("created_at", { ascending: false }),
  ]);

  if (!profile) notFound();

  const active = (activeRaw as Listing[]) ?? [];
  const sold = soldRaw ?? [];
  const reviews = reviewsRaw ?? [];

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header vendeur */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-lime-100 dark:bg-navy-700 flex items-center justify-center text-navy dark:text-white font-black text-2xl shrink-0">
          {profile.display_name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-navy dark:text-white">{profile.display_name}</h1>
            {profile.early_adopter && <EarlyAdopterBadge />}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-navy-100/60">
            {profile.location && <span>{profile.location}</span>}
            {profile.created_at && (
              <span>Membre depuis {new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
            )}
            <span>{sold.length} vente{sold.length !== 1 ? "s" : ""}</span>
            {avgRating && (
              <span className="flex items-center gap-1 font-semibold text-navy dark:text-white">
                ★ {avgRating}
                <span className="font-normal text-gray-400 dark:text-navy-100/50">({reviews.length} avis)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Annonces actives */}
      {active.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-black text-navy dark:text-white mb-4">
            En vente <span className="font-normal text-gray-400 text-base">({active.length})</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((l) => (
              <ListingCard key={l.id} listing={l as Listing & { photos: string[]; seller_name: string }} />
            ))}
          </div>
        </section>
      )}

      {active.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-2xl mb-12">
          <p className="text-gray-400 dark:text-navy-100/50 text-sm">Aucune annonce active pour le moment.</p>
        </div>
      )}

      {/* Avis */}
      {reviews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-black text-navy dark:text-white mb-4">
            Avis <span className="font-normal text-gray-400 text-base">({reviews.length})</span>
          </h2>
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-navy dark:text-white">{r.reviewer_name}</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <span key={star} className={star <= r.rating ? "text-yellow-400" : "text-gray-200 dark:text-navy-600"}>★</span>
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-gray-600 dark:text-navy-100/70">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
