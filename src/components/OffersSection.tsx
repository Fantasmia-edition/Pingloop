"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Offer {
  id: string;
  listing_id: string;
  from_id: string;
  to_id: string;
  from_name: string;
  amount: number;
  status: "pending" | "accepted" | "declined";
  parent_id: string | null;
  created_at: string;
}

interface Props {
  listingId: string;
  sellerId: string;
  listingPrice: number;
  currentUserId: string;
}

export default function OffersSection({ listingId, sellerId, listingPrice, currentUserId }: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [counterForm, setCounterForm] = useState<{ offerId: string; buyerId: string } | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myName, setMyName] = useState("");

  const isSeller = currentUserId === sellerId;
  const minBuyerAmount = Math.ceil(listingPrice * 0.8);

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const [{ data: offersData }, { data: profile }] = await Promise.all([
      supabase.from("offers").select("*").eq("listing_id", listingId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("display_name").eq("id", currentUserId).single(),
    ]);
    setOffers((offersData as Offer[]) ?? []);
    setMyName(profile?.display_name ?? "");
    setLoading(false);
  }

  async function submitOffer(toId: string, amount: number, parentId?: string) {
    setSubmitting(true);
    const supabase = createClient();
    if (parentId) {
      await supabase.from("offers").update({ status: "declined" }).eq("id", parentId);
    }
    await supabase.from("offers").insert({
      listing_id: listingId,
      from_id: currentUserId,
      to_id: toId,
      from_name: myName,
      amount,
      parent_id: parentId ?? null,
    });
    setShowBuyerForm(false);
    setOfferAmount("");
    setCounterForm(null);
    setCounterAmount("");
    await load();
    setSubmitting(false);
  }

  async function respond(offerId: string, status: "accepted" | "declined") {
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("offers").update({ status }).eq("id", offerId);
    if (status === "accepted") {
      await supabase.from("listings").update({ sold_at: new Date().toISOString() }).eq("id", listingId);
    }
    await load();
    setSubmitting(false);
  }

  if (loading) return null;

  const inputClass = "flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime";

  // ── BUYER VIEW ──────────────────────────────────────────────
  if (!isSeller) {
    const latest = offers.find(o => o.from_id === currentUserId || o.to_id === currentUserId);

    if (!latest || (latest.status === "declined" && latest.from_id === currentUserId)) {
      return (
        <div className="border border-gray-200 rounded-xl p-4">
          {latest?.status === "declined" && (
            <p className="text-sm text-gray-500 text-center mb-3">
              Ton offre de <strong>{latest.amount}€</strong> a été refusée.
            </p>
          )}
          {showBuyerForm ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-500">Entre ton offre · min. <strong>{minBuyerAmount}€</strong> (−20% max)</p>
              <div className="flex gap-2 items-center">
                <input type="number" min={minBuyerAmount} max={listingPrice - 1} placeholder={`ex : ${Math.round(listingPrice * 0.9)}`} value={offerAmount} onChange={e => setOfferAmount(e.target.value)} className={inputClass} />
                <span className="text-gray-500 font-bold">€</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { const a = Number(offerAmount); if (a >= minBuyerAmount && a < listingPrice) submitOffer(sellerId, a); }}
                  disabled={submitting || Number(offerAmount) < minBuyerAmount || Number(offerAmount) >= listingPrice}
                  className="flex-1 bg-lime hover:bg-lime-dark disabled:opacity-40 text-navy font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Envoyer l&apos;offre
                </button>
                <button onClick={() => { setShowBuyerForm(false); setOfferAmount(""); }} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBuyerForm(true)}
              className="w-full border-2 border-dashed border-gray-300 hover:border-lime text-gray-500 hover:text-navy font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              💬 Faire une offre
            </button>
          )}
        </div>
      );
    }

    if (latest.status === "accepted") {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-700 font-black text-lg">✓ Offre acceptée — {latest.amount}€</p>
          <p className="text-green-600 text-sm mt-1">Le vendeur a accepté ton offre.</p>
        </div>
      );
    }

    if (latest.status === "pending" && latest.from_id === currentUserId) {
      return (
        <div className="bg-lime-50 border border-lime/30 rounded-xl p-4 text-center">
          <p className="text-navy-800 font-semibold text-sm">Offre envoyée — <strong>{latest.amount}€</strong></p>
          <p className="text-navy text-xs mt-1">En attente de réponse du vendeur…</p>
        </div>
      );
    }

    if (latest.status === "pending" && latest.to_id === currentUserId) {
      return (
        <div className="border-2 border-lime/60 bg-lime-50 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-black text-navy-800">Contre-offre du vendeur — {latest.amount}€</p>
            <p className="text-xs text-gray-500 mt-0.5">Prix affiché : {listingPrice}€</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => respond(latest.id, "accepted")} disabled={submitting} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">✓ Accepter</button>
            <button onClick={() => respond(latest.id, "declined")} disabled={submitting} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition-colors">✗ Refuser</button>
          </div>
        </div>
      );
    }

    if (latest.status === "declined" && latest.to_id === currentUserId) {
      return (
        <div className="border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-400">
          Tu as refusé la contre-offre du vendeur.
        </div>
      );
    }

    return null;
  }

  // ── SELLER VIEW ─────────────────────────────────────────────
  const buyerIds = [...new Set(
    offers
      .filter(o => o.from_id !== currentUserId || o.to_id !== currentUserId)
      .map(o => o.from_id === currentUserId ? o.to_id : o.from_id)
  )];

  if (buyerIds.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center text-sm text-gray-400">
        Aucune offre reçue pour l&apos;instant.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <p className="text-sm font-semibold text-gray-700">💬 Offres reçues ({buyerIds.length})</p>
      </div>
      <div className="divide-y divide-gray-100">
        {buyerIds.map(buyerId => {
          const buyerOffers = offers.filter(o => o.from_id === buyerId || o.to_id === buyerId);
          const latest = buyerOffers[0];
          if (!latest) return null;
          const buyerName = latest.from_id === buyerId ? latest.from_name : "Acheteur";

          return (
            <div key={buyerId} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{buyerName}</p>
                  <p className="text-xs text-gray-400">{new Date(latest.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-gray-900">{latest.amount}€</p>
                  <p className="text-xs text-gray-400">Prix : {listingPrice}€</p>
                </div>
              </div>

              {latest.status === "accepted" && <p className="text-green-600 font-semibold text-sm text-center bg-green-50 rounded-lg py-2">✓ Acceptée</p>}
              {latest.status === "declined" && <p className="text-gray-400 text-sm text-center">Offre refusée</p>}
              {latest.status === "pending" && latest.from_id === currentUserId && (
                <p className="text-navy font-semibold text-sm text-center bg-lime-50 rounded-lg py-2">Contre-offre envoyée ({latest.amount}€) — en attente</p>
              )}
              {latest.status === "pending" && latest.to_id === currentUserId && (
                counterForm?.offerId === latest.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <input type="number" min={1} max={listingPrice} placeholder={`ex : ${Math.round(listingPrice * 0.95)}`} value={counterAmount} onChange={e => setCounterAmount(e.target.value)} className={inputClass} />
                      <span className="text-gray-500 font-bold">€</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { const a = Number(counterAmount); if (a > 0 && a <= listingPrice) submitOffer(buyerId, a, latest.id); }} disabled={submitting} className="flex-1 bg-lime text-navy font-bold py-2 rounded-lg text-sm">Envoyer</button>
                      <button onClick={() => { setCounterForm(null); setCounterAmount(""); }} className="px-3 py-2 border rounded-lg text-sm text-gray-500">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => respond(latest.id, "accepted")} disabled={submitting} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">✓ Accepter</button>
                    <button onClick={() => { setCounterForm({ offerId: latest.id, buyerId }); setCounterAmount(""); }} disabled={submitting} className="flex-1 bg-lime-100 hover:bg-orange-200 text-navy-800 font-bold py-2 rounded-lg text-sm transition-colors">↔ Contre-offre</button>
                    <button onClick={() => respond(latest.id, "declined")} disabled={submitting} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-lg text-sm transition-colors">✗ Refuser</button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
