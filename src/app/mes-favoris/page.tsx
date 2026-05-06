"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/components/ListingCard";
import { Listing } from "@/types";

export default function MesFavorisPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/mes-favoris"); return; }

      const { data } = await supabase
        .from("favorites")
        .select("listing_id, listings(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const favListings = (data ?? [])
        .map((f: { listing_id: string; listings: unknown }) => f.listings)
        .filter(Boolean) as Listing[];

      setListings(favListings);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Mes favoris</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-white border border-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Mes favoris</h1>
        <p className="text-sm text-gray-500">{listings.length} annonce{listings.length !== 1 ? "s" : ""} sauvegardée{listings.length !== 1 ? "s" : ""}</p>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🤍</p>
          <p className="font-semibold text-gray-600">Aucun favori pour l&apos;instant</p>
          <p className="text-sm mt-1">Clique sur le cœur d&apos;une annonce pour la retrouver ici.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
