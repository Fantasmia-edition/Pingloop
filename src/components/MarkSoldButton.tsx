"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MarkSoldButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  async function markSold() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("listings")
      .update({ sold_at: new Date().toISOString() })
      .eq("id", listingId);
    router.refresh();
    setLoading(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={markSold}
          disabled={loading}
          className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? "…" : "Confirmer la vente ✓"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors"
    >
      Marquer comme vendu
    </button>
  );
}
