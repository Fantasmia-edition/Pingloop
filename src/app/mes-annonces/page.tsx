"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Listing, CONDITION_LABELS, CONDITION_COLORS } from "@/types";

type FullListing = Listing & { photos: string[]; seller_name: string; sold_at: string | null };

export default function MesAnnoncesPage() {
  const router = useRouter();
  const [listings, setListings] = useState<FullListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/mes-annonces"); return; }

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      setListings((data as FullListing[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function markSold(id: string) {
    const supabase = createClient();
    await supabase.from("listings").update({ sold_at: new Date().toISOString() }).eq("id", id);
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, sold_at: new Date().toISOString() } : l));
  }

  async function deleteListing(id: string) {
    const supabase = createClient();
    await supabase.from("listings").delete().eq("id", id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  const active = listings.filter((l) => !l.sold_at);
  const sold = listings.filter((l) => l.sold_at);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Mes annonces</h1>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white border border-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Mes annonces</h1>
        <Link href="/vendre" className="bg-lime hover:bg-lime-dark text-navy text-sm font-bold px-4 py-2 rounded-lg transition-colors">
          + Nouvelle annonce
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
          <p className="text-3xl mb-2">📦</p>
          <p className="font-semibold text-gray-600">Tu n&apos;as pas encore d&apos;annonce</p>
          <Link href="/vendre" className="mt-3 inline-block text-navy font-semibold text-sm hover:underline">
            Mettre en vente →
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                En vente ({active.length})
              </h2>
              <div className="flex flex-col gap-3">
                {active.map((l) => (
                  <ListingRow key={l.id} listing={l} onMarkSold={() => markSold(l.id)} onDelete={() => deleteListing(l.id)} />
                ))}
              </div>
            </div>
          )}

          {sold.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Vendus ({sold.length})
              </h2>
              <div className="flex flex-col gap-3 opacity-60">
                {sold.map((l) => (
                  <ListingRow key={l.id} listing={l} onDelete={() => deleteListing(l.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ListingRow({ listing: l, onMarkSold, onDelete }: {
  listing: FullListing;
  onMarkSold?: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSold, setConfirmSold] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      {/* Thumbnail */}
      <div className="w-16 h-16 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
        {l.photos?.[0]
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={l.photos[0]} alt="" className="w-full h-full object-cover" />
          : <span className="text-2xl">{l.category === "rubber" ? "🏓" : "🪵"}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-900 text-sm truncate">{l.brand} {l.name}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONDITION_COLORS[l.condition]}`}>
            {CONDITION_LABELS[l.condition]}
          </span>
          {l.sold_at && (
            <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">Vendu</span>
          )}
        </div>
        <p className="text-sm font-black text-gray-900 mt-0.5">{l.price} €</p>
        <p className="text-xs text-gray-400">{l.location} · {new Date(l.created_at).toLocaleDateString("fr-FR")}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <Link href={`/annonces/${l.id}`} className="text-xs text-gray-500 hover:text-gray-800 font-medium text-center">
          Voir →
        </Link>
        {!l.sold_at && onMarkSold && (
          confirmSold ? (
            <div className="flex gap-1">
              <button onClick={() => { onMarkSold(); setConfirmSold(false); }} className="text-xs text-green-600 font-bold">Oui</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setConfirmSold(false)} className="text-xs text-gray-400">Non</button>
            </div>
          ) : (
            <button onClick={() => setConfirmSold(true)} className="text-xs text-green-600 hover:text-green-700 font-medium">
              ✓ Vendu
            </button>
          )
        )}
        {confirmDelete ? (
          <div className="flex gap-1">
            <button onClick={onDelete} className="text-xs text-red-600 font-bold">Oui</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400">Non</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="text-xs text-gray-400 hover:text-red-500 font-medium">
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
