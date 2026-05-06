"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/components/ListingCard";
import { Listing, ItemCategory, PimpleType, Condition } from "@/types";

export default function AnnoncesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [pimpleType, setPimpleType] = useState<PimpleType | "">("");
  const [condition, setCondition] = useState<Condition | "">("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("listings")
      .select("*")
      .is("sold_at", null)
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category", category);
    if (pimpleType) query = query.eq("pimple_type", pimpleType);
    if (condition) query = query.eq("condition", condition);
    if (maxPrice) query = query.lte("price", Number(maxPrice));
    if (search) query = query.or(`brand.ilike.%${search}%,name.ilike.%${search}%`);

    const { data } = await query;
    setListings((data as Listing[]) ?? []);
    setLoading(false);
  }, [category, pimpleType, condition, maxPrice, search]);

  useEffect(() => {
    const timer = setTimeout(fetchListings, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchListings, search]);

  const selectClass =
    "border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Toutes les annonces</h1>
        {!loading && (
          <p className="text-sm text-gray-500">{listings.length} annonce{listings.length !== 1 ? "s" : ""} disponible{listings.length !== 1 ? "s" : ""}</p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Recherche (marque, modèle…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as ItemCategory | "")} className={selectClass}>
          <option value="">Type : tous</option>
          <option value="rubber">🏓 Revêtement</option>
          <option value="blade">🪵 Bois</option>
          <option value="racket">🎯 Raquette complète</option>
          <option value="tshirt">👕 T-Shirt</option>
          <option value="case">🎒 Housse</option>
        </select>
        <select value={pimpleType} onChange={(e) => setPimpleType(e.target.value as PimpleType | "")} className={selectClass}>
          <option value="">Picots : tous</option>
          <option value="In">Lisse (inverted)</option>
          <option value="Out">Picots courts</option>
          <option value="Long">Picots longs</option>
        </select>
        <select value={condition} onChange={(e) => setCondition(e.target.value as Condition | "")} className={selectClass}>
          <option value="">État : tous</option>
          <option value="new">Neuf</option>
          <option value="like_new">Comme neuf</option>
          <option value="good">Bon état</option>
          <option value="fair">État correct</option>
        </select>
        <input
          type="number"
          placeholder="Prix max (€)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-44 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-4" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-gray-600">Aucune annonce trouvée</p>
          <p className="text-sm mt-1">Modifie tes filtres ou crée une alerte pour être prévenu.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
