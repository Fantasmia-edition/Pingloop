"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import FirstMessageModal from "@/components/FirstMessageModal";
import { MessageCircle } from "lucide-react";

interface Props {
  listingId: string;
  sellerId: string;
  sellerName: string;
  listingTitle: string;
  listingPrice: number;
}

export default function ContactButton({ listingId, sellerId, sellerName, listingTitle, listingPrice }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleContact() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth?redirect=/annonces/${listingId}`);
      return;
    }

    // If conversation already exists, go straight to it
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .single();

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    setLoading(false);
    setShowModal(true);
  }

  return (
    <>
      <button
        onClick={handleContact}
        disabled={loading}
        className="w-full bg-lime hover:bg-lime-dark disabled:opacity-50 text-navy font-bold py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
      >
        {loading ? "Chargement…" : (
          <>
            <MessageCircle className="w-4 h-4" strokeWidth={2} />
            Contacter {sellerName.split(" ")[0]}
          </>
        )}
      </button>
      {showModal && (
        <FirstMessageModal
          listingId={listingId}
          sellerId={sellerId}
          sellerName={sellerName}
          listingTitle={listingTitle}
          listingPrice={listingPrice}
          onClose={() => { setShowModal(false); setLoading(false); }}
        />
      )}
    </>
  );
}
