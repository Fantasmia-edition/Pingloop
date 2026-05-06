"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/components/ListingCard";
import { Listing, ItemCategory, PimpleType, Condition } from "@/types";

function AnnoncesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Init state from URL
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<ItemCategory | "">(
    (searchParams.get("cat") as ItemCategory) ?? ""
  );
  const [pimpleType, setPimpleType] = useState<PimpleType | "">(
    (searchParams.get("picots") as PimpleType) ?? ""
  );
  const [condition, setCondition] = useState<Condition | "">(
    (searchParams.get("etat") as Condition) ?? ""
  );
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxprix") ?? "");

  // Push filter changes to URL
  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function handleSearch(v: string) { setSearch(v); updateUrl({ q: v }); }
  function handleCategory(v: string) { setCategory(v as ItemCategory); updateUrl({ cat: v }); }
  function handlePimple(v: string) { setPimpleType(v as PimpleType); updateUrl({ picots: v }); }
  function handleCondition(v: string) { setCondition(v as Condition); updateUrl({ etat: v }); }
  function handleMaxPrice(v: string) { setMaxPrice(v); updateUrl({ maxprix: v }); }

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

  const hasFilters = !!(search || category || pimpleType || condition || maxPrice);

  function clearFilters() {
    setSearch(""); setCategory(""); setPimpleType(""); setCondition(""); setMaxPrice("");
    router.replace(pathname, { scroll: false });
  }

  const inputCls = "border border-gray-200 dark:border-navy-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Toutes les annonces</h1>
        {!loading && (
          <p className="text-sm text-gray-500 dark:text-navy-100/60">
            {listings.length} annonce{listings.length !== 1 ? "s" : ""} disponible{listings.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Recherche (marque, modèle…)"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={`flex-1 min-w-48 ${inputCls}`}
        />
        <select value={category} onChange={(e) => handleCategory(e.target.value)} className={inputCls}>
          <option value="">Type : tous</option>
          <option value="rubber">🏓 Revêtement</option>
          <option value="blade">🪵 Bois</option>
          <option value="racket">🎯 Raquette complète</option>
          <option value="tshirt">👕 T-Shirt</option>
          <option value="case">🎒 Housse</option>
        </select>
        <select value={pimpleType} onChange={(e) => handlePimple(e.target.value)} className={inputCls}>
          <option value="">Picots : tous</option>
          <option value="In">Backside</option>
          <option value="Out">Picots courts</option>
          <option value="Long">Picots longs</option>
        </select>
        <select value={condition} onChange={(e) => handleCondition(e.target.value)} className={inputCls}>
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
          onChange={(e) => handleMaxPrice(e.target.value)}
          className={`w-32 ${inputCls}`}
        />
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-gray-500 dark:text-navy-100/60 hover:text-gray-800 dark:hover:text-white transition-colors px-2 underline underline-offset-2"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-4 h-44 animate-pulse">
              <div className="h-3 bg-gray-100 dark:bg-navy-700 rounded w-1/3 mb-2" />
              <div className="h-5 bg-gray-100 dark:bg-navy-700 rounded w-2/3 mb-4" />
              <div className="h-3 bg-gray-100 dark:bg-navy-700 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-navy-700 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-gray-600 dark:text-navy-100/70">Aucune annonce trouvée</p>
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

export default function AnnoncesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-100 dark:bg-navy-800 rounded w-48 mb-6 animate-pulse" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 h-44 animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <AnnoncesContent />
    </Suspense>
  );
}
