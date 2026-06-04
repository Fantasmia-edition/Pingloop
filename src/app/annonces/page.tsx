"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/components/ListingCard";
import { Listing, ItemCategory, PimpleType, Condition } from "@/types";

const PAGE_SIZE = 24;

function AnnoncesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<ItemCategory | "">((searchParams.get("cat") as ItemCategory) ?? "");
  const [pimpleType, setPimpleType] = useState<PimpleType | "">((searchParams.get("picots") as PimpleType) ?? "");
  const [condition, setCondition] = useState<Condition | "">((searchParams.get("etat") as Condition) ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxprix") ?? "");
  const [sort, setSort] = useState(searchParams.get("tri") ?? "recent");

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function handleSearch(v: string) { setSearch(v); setPage(0); updateUrl({ q: v }); }
  function handleCategory(v: string) { setCategory(v as ItemCategory); setPage(0); updateUrl({ cat: v }); }
  function handlePimple(v: string) { setPimpleType(v as PimpleType); setPage(0); updateUrl({ picots: v }); }
  function handleCondition(v: string) { setCondition(v as Condition); setPage(0); updateUrl({ etat: v }); }
  function handleMaxPrice(v: string) { setMaxPrice(v); setPage(0); updateUrl({ maxprix: v }); }
  function handleSort(v: string) { setSort(v); setPage(0); updateUrl({ tri: v }); }

  function buildQuery(supabase: ReturnType<typeof createClient>, offset: number) {
    const orderCol = sort === "prix_asc" || sort === "prix_desc" ? "price" : "created_at";
    const ascending = sort === "prix_asc" || sort === "ancien";
    let q = supabase
      .from("listings")
      .select("*")
      .is("sold_at", null)
      .order(orderCol, { ascending })
      .range(offset, offset + PAGE_SIZE - 1);
    if (category) q = q.eq("category", category);
    if (pimpleType) q = q.eq("pimple_type", pimpleType);
    if (condition) q = q.eq("condition", condition);
    if (maxPrice) q = q.lte("price", Number(maxPrice));
    if (search) q = q.or(`brand.ilike.%${search}%,name.ilike.%${search}%`);
    return q;
  }

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setPage(0);
    const supabase = createClient();
    const { data } = await buildQuery(supabase, 0);
    const results = (data as Listing[]) ?? [];
    setListings(results);
    setHasMore(results.length === PAGE_SIZE);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, pimpleType, condition, maxPrice, search, sort]);

  async function loadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    const supabase = createClient();
    const { data } = await buildQuery(supabase, nextPage * PAGE_SIZE);
    const results = (data as Listing[]) ?? [];
    setListings((prev) => [...prev, ...results]);
    setHasMore(results.length === PAGE_SIZE);
    setPage(nextPage);
    setLoadingMore(false);
  }

  useEffect(() => {
    const timer = setTimeout(fetchListings, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchListings, search]);

  const hasFilters = !!(search || category || pimpleType || condition || maxPrice);

  function clearFilters() {
    setSearch(""); setCategory(""); setPimpleType(""); setCondition(""); setMaxPrice(""); setSort("recent"); setPage(0);
    router.replace(pathname, { scroll: false });
  }

  const inputCls = "border border-gray-200 dark:border-navy-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Toutes les annonces</h1>
        {!loading && (
          <p className="text-sm text-gray-500 dark:text-navy-100/60">
            {listings.length} annonce{listings.length !== 1 ? "s" : ""} chargée{listings.length !== 1 ? "s" : ""}
            {hasMore ? " — il y en a d'autres" : ""}
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
        <select value={sort} onChange={(e) => handleSort(e.target.value)} className={inputCls}>
          <option value="recent">Plus récents</option>
          <option value="ancien">Plus anciens</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
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
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 text-navy dark:text-white font-bold px-8 py-3 rounded-xl hover:border-lime dark:hover:border-lime transition-colors disabled:opacity-50 text-sm"
              >
                {loadingMore ? "Chargement…" : "Voir plus d'annonces"}
              </button>
            </div>
          )}
        </>
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
