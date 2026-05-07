"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { SHIPPING_PRICES } from "@/types";

const PaymentOptions = dynamic(() => import("./PaymentOptions"), { ssr: false });

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
  sellerName?: string;
  listingTitle?: string;
  listingPrice: number;
  currentUserId: string;
  shippingHome?: boolean;
  pickupAvailable?: boolean;
}

export default function OffersSection({
  listingId, sellerId, sellerName = "", listingTitle = "",
  listingPrice, currentUserId,
  shippingHome = false, pickupAvailable = false,
}: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuyerForm, setShowBuyerForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [counterForm, setCounterForm] = useState<{ offerId: string; buyerId: string } | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myName, setMyName] = useState("");
  // State for accepted-offer payment flow
  const [acceptedMethod, setAcceptedMethod] = useState<"home" | "pickup">(
    shippingHome ? "home" : "pickup"
  );

  const isSeller = currentUserId === sellerId;
  const minBuyerAmount = Math.ceil(listingPrice * 0.8);

  useEffect(() => {
    load();

    const supabase = createClient();
    const channel = supabase
      .channel(`offers-listing-${listingId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "offers",
        filter: `listing_id=eq.${listingId}`,
      }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

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

  /** Find or create a conversation for this listing+buyer, then post a system message. */
  async function syncToConversation(buyerId: string, buyerNameStr: string, msgText: string) {
    const supabase = createClient();

    let { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", buyerId)
      .maybeSingle();

    // Only the buyer can create a conversation (RLS policy)
    if (!conv && !isSeller && sellerName) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: sellerId,
          buyer_name: buyerNameStr,
          seller_name: sellerName,
        })
        .select("id")
        .single();
      conv = newConv;
    }

    if (!conv) return; // seller action but no conversation yet — skip silently

    await supabase.from("messages").insert({
      conversation_id: conv.id,
      from_id: currentUserId,
      text: msgText,
    });
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

    // Mirror to conversation
    const buyerId = isSeller ? toId : currentUserId;
    const buyerNameStr = isSeller
      ? (offers.find(o => o.from_id === toId)?.from_name ?? "Acheteur")
      : myName;
    const msgText = isSeller
      ? `↔️ Contre-offre de ${amount} €`
      : parentId
        ? `✅ Contre-offre de ${amount} € acceptée`
        : `💰 Offre de ${amount} €`;
    await syncToConversation(buyerId, buyerNameStr, msgText);

    setShowBuyerForm(false);
    setOfferAmount("");
    setCounterForm(null);
    setCounterAmount("");
    await load();
    setSubmitting(false);
  }

  async function respond(
    offerId: string,
    status: "accepted" | "declined",
    offerAmt: number,
    buyerId: string,
    buyerNameStr: string,
  ) {
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("offers").update({ status }).eq("id", offerId);
    // ⚠️  sold_at is set by the Stripe webhook after payment — do NOT set it here

    // Mirror to conversation
    const msgText =
      status === "accepted"
        ? `✅ Offre de ${offerAmt} € acceptée — procède au paiement pour finaliser.`
        : `❌ Offre de ${offerAmt} € refusée.`;
    await syncToConversation(buyerId, buyerNameStr, msgText);

    await load();
    setSubmitting(false);
  }

  if (loading) return null;

  const inputClass =
    "flex-1 border border-gray-200 dark:border-navy-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime bg-white dark:bg-navy-700 text-gray-900 dark:text-white";

  // ── BUYER VIEW ───────────────────────────────────────────────
  if (!isSeller) {
    const latest = offers.find(o => o.from_id === currentUserId || o.to_id === currentUserId);

    // ── No offer or declined by buyer ──
    if (!latest || (latest.status === "declined" && latest.from_id === currentUserId)) {
      return (
        <div className="border border-gray-200 dark:border-navy-700 rounded-xl p-4">
          {latest?.status === "declined" && (
            <p className="text-sm text-gray-500 dark:text-navy-100/60 text-center mb-3">
              Ton offre de <strong>{latest.amount} €</strong> a été refusée.
            </p>
          )}
          {showBuyerForm ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-500 dark:text-navy-100/60">
                Entre ton offre · min. <strong>{minBuyerAmount} €</strong> (−20 % max)
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={minBuyerAmount}
                  max={listingPrice - 1}
                  placeholder={`ex : ${Math.round(listingPrice * 0.9)}`}
                  value={offerAmount}
                  onChange={e => setOfferAmount(e.target.value)}
                  className={inputClass}
                />
                <span className="text-gray-500 font-bold">€</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const a = Number(offerAmount);
                    if (a >= minBuyerAmount && a < listingPrice) submitOffer(sellerId, a);
                  }}
                  disabled={submitting || Number(offerAmount) < minBuyerAmount || Number(offerAmount) >= listingPrice}
                  className="flex-1 bg-lime hover:bg-lime-dark disabled:opacity-40 text-navy font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Envoyer l&apos;offre
                </button>
                <button
                  onClick={() => { setShowBuyerForm(false); setOfferAmount(""); }}
                  className="px-4 py-2.5 border border-gray-200 dark:border-navy-600 rounded-xl text-sm text-gray-500 dark:text-navy-100/60"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBuyerForm(true)}
              className="w-full border-2 border-dashed border-gray-300 dark:border-navy-600 hover:border-lime text-gray-500 dark:text-navy-100/60 hover:text-navy font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              💬 Faire une offre
            </button>
          )}
        </div>
      );
    }

    // ── Offer accepted → shipping + payment ──
    if (latest.status === "accepted") {
      const hasShipping = shippingHome;
      const acceptedShippingCost = acceptedMethod === "home" ? SHIPPING_PRICES.home : 0;
      const acceptedTotal = latest.amount + acceptedShippingCost;

      const shippingOptions = [
        ...(shippingHome    ? [{ key: "home"   as const, icon: "🏠", label: "Envoi par La Poste",    sub: "Colissimo · livré chez vous", price: SHIPPING_PRICES.home }] : []),
        ...(pickupAvailable ? [{ key: "pickup" as const, icon: "🤝", label: "Remise en main propre", sub: "À convenir avec le vendeur",  price: 0                    }] : []),
      ];

      return (
        <div className="border-2 border-green-400 dark:border-green-600 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-200 dark:border-green-700">
            <p className="text-green-700 dark:text-green-400 font-black">
              🎉 Offre acceptée — {latest.amount} €
            </p>
            <p className="text-green-600 dark:text-green-500 text-xs mt-0.5">
              Choisis le mode de livraison et finalise le paiement.
            </p>
          </div>

          {/* Shipping selector */}
          {shippingOptions.length > 1 && (
            <div className="divide-y divide-gray-100 dark:divide-navy-700">
              {shippingOptions.map(o => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setAcceptedMethod(o.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    acceptedMethod === o.key
                      ? "bg-lime-50 dark:bg-lime/10"
                      : "bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700"
                  }`}
                >
                  <span className="text-base w-5 text-center">{o.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{o.label}</p>
                    <p className="text-xs text-gray-400 dark:text-navy-100/50 truncate">{o.sub}</p>
                  </div>
                  <p className={`text-sm font-black shrink-0 ${acceptedMethod === o.key ? "text-navy dark:text-lime" : "text-gray-700 dark:text-white"}`}>
                    {o.price === 0 ? "Offert" : `${o.price} €`}
                  </p>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    acceptedMethod === o.key ? "border-lime bg-lime" : "border-gray-300 dark:border-navy-600"
                  }`}>
                    {acceptedMethod === o.key && <span className="text-navy text-[8px] font-black leading-none">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Total */}
          {hasShipping && acceptedShippingCost > 0 && (
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-navy-700/60 border-t border-gray-200 dark:border-navy-700 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-navy-100/60 font-medium">
                {latest.amount} € + {acceptedShippingCost} € de port
              </span>
              <span className="text-base font-black text-gray-900 dark:text-lime">{acceptedTotal} €</span>
            </div>
          )}

          {/* Payment / Pickup CTA */}
          <div className="p-4">
            {acceptedMethod !== "pickup" ? (
              <PaymentOptions
                listingId={listingId}
                itemPrice={latest.amount}
                shippingMethod={acceptedMethod}
                offerId={latest.id}
                onPurchased={() => {}}
              />
            ) : (
              <p className="text-sm text-center text-gray-600 dark:text-navy-100/70 font-medium py-2">
                🤝 Contacte le vendeur via la messagerie pour convenir de la remise en main propre.
              </p>
            )}
          </div>
        </div>
      );
    }

    // ── Buyer's pending offer ──
    if (latest.status === "pending" && latest.from_id === currentUserId) {
      return (
        <div className="bg-lime-50 dark:bg-lime/10 border border-lime/30 dark:border-lime/20 rounded-xl p-4 text-center">
          <p className="text-navy-800 dark:text-lime font-semibold text-sm">
            Offre envoyée — <strong>{latest.amount} €</strong>
          </p>
          <p className="text-navy dark:text-lime/70 text-xs mt-1">En attente de réponse du vendeur…</p>
        </div>
      );
    }

    // ── Seller counter-offer pending ──
    if (latest.status === "pending" && latest.to_id === currentUserId) {
      return (
        <div className="border-2 border-lime/60 bg-lime-50 dark:bg-lime/10 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-black text-navy-800 dark:text-white">Contre-offre du vendeur — {latest.amount} €</p>
            <p className="text-xs text-gray-500 dark:text-navy-100/60 mt-0.5">Prix affiché : {listingPrice} €</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => respond(latest.id, "accepted", latest.amount, currentUserId, myName)}
              disabled={submitting}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              ✓ Accepter
            </button>
            <button
              onClick={() => respond(latest.id, "declined", latest.amount, currentUserId, myName)}
              disabled={submitting}
              className="flex-1 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-gray-700 dark:text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              ✗ Refuser
            </button>
          </div>
        </div>
      );
    }

    // ── Buyer declined seller counter ──
    if (latest.status === "declined" && latest.to_id === currentUserId) {
      return (
        <div className="border border-gray-200 dark:border-navy-700 rounded-xl p-4 text-center text-sm text-gray-400 dark:text-navy-100/50">
          Tu as refusé la contre-offre du vendeur.
        </div>
      );
    }

    return null;
  }

  // ── SELLER VIEW ──────────────────────────────────────────────
  const buyerIds = [...new Set(
    offers
      .filter(o => o.from_id !== currentUserId || o.to_id !== currentUserId)
      .map(o => o.from_id === currentUserId ? o.to_id : o.from_id)
  )];

  if (buyerIds.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 dark:border-navy-700 rounded-xl p-4 text-center text-sm text-gray-400 dark:text-navy-100/50">
        Aucune offre reçue pour l&apos;instant.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-navy-700 rounded-xl overflow-hidden">
      <div className="bg-gray-50 dark:bg-navy-800 px-4 py-2.5 border-b border-gray-200 dark:border-navy-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-navy-100">
          💬 Offres reçues ({buyerIds.length})
        </p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-navy-700">
        {buyerIds.map(buyerId => {
          const buyerOffers = offers.filter(o => o.from_id === buyerId || o.to_id === buyerId);
          const latest = buyerOffers[0];
          if (!latest) return null;
          const buyerName = latest.from_id === buyerId ? latest.from_name : "Acheteur";

          return (
            <div key={buyerId} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{buyerName}</p>
                  <p className="text-xs text-gray-400 dark:text-navy-100/50">
                    {new Date(latest.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-gray-900 dark:text-white">{latest.amount} €</p>
                  <p className="text-xs text-gray-400 dark:text-navy-100/50">Prix : {listingPrice} €</p>
                </div>
              </div>

              {latest.status === "accepted" && (
                <p className="text-green-600 font-semibold text-sm text-center bg-green-50 dark:bg-green-900/20 rounded-lg py-2">
                  ✓ Acceptée — en attente du paiement acheteur
                </p>
              )}
              {latest.status === "declined" && (
                <p className="text-gray-400 dark:text-navy-100/40 text-sm text-center">Offre refusée</p>
              )}
              {latest.status === "pending" && latest.from_id === currentUserId && (
                <p className="text-navy dark:text-lime font-semibold text-sm text-center bg-lime-50 dark:bg-lime/10 rounded-lg py-2">
                  Contre-offre envoyée ({latest.amount} €) — en attente
                </p>
              )}
              {latest.status === "pending" && latest.to_id === currentUserId && (
                counterForm?.offerId === latest.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min={1}
                        max={listingPrice}
                        placeholder={`ex : ${Math.round(listingPrice * 0.95)}`}
                        value={counterAmount}
                        onChange={e => setCounterAmount(e.target.value)}
                        className={inputClass}
                      />
                      <span className="text-gray-500 font-bold">€</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const a = Number(counterAmount);
                          if (a > 0 && a <= listingPrice) submitOffer(buyerId, a, latest.id);
                        }}
                        disabled={submitting}
                        className="flex-1 bg-lime text-navy font-bold py-2 rounded-lg text-sm"
                      >
                        Envoyer
                      </button>
                      <button
                        onClick={() => { setCounterForm(null); setCounterAmount(""); }}
                        className="px-3 py-2 border border-gray-200 dark:border-navy-600 rounded-lg text-sm text-gray-500"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(latest.id, "accepted", latest.amount, buyerId, buyerName)}
                      disabled={submitting}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-sm transition-colors"
                    >
                      ✓ Accepter
                    </button>
                    <button
                      onClick={() => { setCounterForm({ offerId: latest.id, buyerId }); setCounterAmount(""); }}
                      disabled={submitting}
                      className="flex-1 bg-lime-100 dark:bg-lime/20 hover:bg-lime-200 text-navy-800 dark:text-white font-bold py-2 rounded-lg text-sm transition-colors"
                    >
                      ↔ Contre-offre
                    </button>
                    <button
                      onClick={() => respond(latest.id, "declined", latest.amount, buyerId, buyerName)}
                      disabled={submitting}
                      className="flex-1 bg-gray-100 dark:bg-navy-700 hover:bg-gray-200 dark:hover:bg-navy-600 text-gray-700 dark:text-white font-bold py-2 rounded-lg text-sm transition-colors"
                    >
                      ✗ Refuser
                    </button>
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
