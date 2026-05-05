"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  listingId: string;
  sellerId: string;
  sellerName: string;
  listingTitle: string;
  listingPrice: number;
  onClose: () => void;
}

export default function FirstMessageModal({ listingId, sellerId, sellerName, listingTitle, listingPrice, onClose }: Props) {
  const router = useRouter();
  const defaultMsg = `Bonjour ${sellerName.split(" ")[0]} ! Ton annonce "${listingTitle}" à ${listingPrice}€ m'intéresse. C'est toujours disponible ?`;
  const [text, setText] = useState(defaultMsg);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/auth?redirect=/annonces/${listingId}`); return; }

    const buyerName = user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Acheteur";

    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .single();

    let convId = existing?.id;

    if (!convId) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId, buyer_name: buyerName, seller_name: sellerName })
        .select("id")
        .single();
      convId = created?.id;
    }

    if (convId) {
      await supabase.from("messages").insert({ conversation_id: convId, from_id: user.id, text: text.trim() });
      router.push(`/messages/${convId}`);
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="font-black text-gray-900 text-lg">Contacter {sellerName.split(" ")[0]}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{listingTitle} · {listingPrice}€</p>
        </div>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3 rounded-xl text-sm transition-colors"
          >
            {sending ? "Envoi…" : "Envoyer 💬"}
          </button>
        </div>
      </div>
    </div>
  );
}
