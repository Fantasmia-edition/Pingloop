"use client";
import { useEffect, useState } from "react";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/components/ListingCard";
import { Listing } from "@/types";

export default function RecentlyViewed() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const ids = getRecentlyViewed();
    if (!ids.length) return;
    const supabase = createClient();
    supabase
      .from("listings")
      .select("*")
      .in("id", ids)
      .then(({ data }) => {
        if (!data) return;
        // Préserver l'ordre de visite
        const sorted = ids
          .map((id) => (data as Listing[]).find((l) => l.id === id))
          .filter(Boolean) as Listing[];
        setListings(sorted);
      });
  }, []);

  if (!listings.length) return null;

  return (
    <section className="py-12 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-navy-800">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-navy dark:text-white">Récemment consultés</h2>
            <p className="text-xs text-gray-400 mt-0.5">Là où tu t'es arrêté</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </div>
    </section>
  );
}
