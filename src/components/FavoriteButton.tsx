"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  listingId: string;
  currentUserId: string | null;
}

export default function FavoriteButton({ listingId, currentUserId }: Props) {
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    createClient()
      .from("favorites")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("listing_id", listingId)
      .maybeSingle()
      .then(({ data }) => setIsFav(!!data));
  }, [currentUserId, listingId]);

  async function toggle() {
    if (!currentUserId) { router.push("/auth"); return; }
    setLoading(true);
    const supabase = createClient();
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", currentUserId).eq("listing_id", listingId);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: currentUserId, listing_id: listingId });
      setIsFav(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
        isFav
          ? "border-red-300 bg-red-50 text-red-500"
          : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400"
      }`}
    >
      {isFav ? "❤️ Dans tes favoris" : "🤍 Ajouter aux favoris"}
    </button>
  );
}
