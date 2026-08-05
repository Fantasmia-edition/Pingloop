"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { SHIPPING_PRICES } from "@/types";

const StripePaymentModal = dynamic(() => import("./StripePaymentModal"), { ssr: false });
const PayPalPaymentButton = dynamic(() => import("./PayPalPaymentButton"), { ssr: false });

type ShippingMethod = "home" | "pickup" | null;

interface Props {
  listingId: string;
  itemPrice: number;
  shippingMethod: ShippingMethod;
  offerId?: string;
  onPurchased: () => void;
  /** Si fournis par le parent (page annonce, déjà chargée côté serveur), on
   * évite un aller-retour réseau supplémentaire et le flash de chargement. */
  sellerStripeOnboarded?: boolean;
  sellerPaypalOnboarded?: boolean;
}

export default function PaymentOptions({
  listingId, itemPrice, shippingMethod, offerId, onPurchased,
  sellerStripeOnboarded, sellerPaypalOnboarded,
}: Props) {
  const [showStripe, setShowStripe] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paypalError, setPaypalError] = useState("");
  const [fetchedMethods, setFetchedMethods] = useState<{ stripe: boolean; paypal: boolean } | null>(null);

  const hasServerData = sellerStripeOnboarded !== undefined && sellerPaypalOnboarded !== undefined;

  useEffect(() => {
    if (hasServerData) return;
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("listings")
        .select("profiles!listings_seller_id_fkey(stripe_onboarded, paypal_onboarded)")
        .eq("id", listingId)
        .single();
      const profile = (data as { profiles?: { stripe_onboarded?: boolean; paypal_onboarded?: boolean } } | null)?.profiles;
      if (!cancelled) {
        setFetchedMethods({ stripe: !!profile?.stripe_onboarded, paypal: !!profile?.paypal_onboarded });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [listingId, hasServerData]);

  const methods = hasServerData
    ? { stripe: !!sellerStripeOnboarded, paypal: !!sellerPaypalOnboarded }
    : fetchedMethods;

  const shippingCost = shippingMethod === "home" ? SHIPPING_PRICES.home : 0;
  const total = itemPrice + shippingCost;

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-5 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-green-700 dark:text-green-400 font-black text-base">Paiement confirmé !</p>
        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
          Tu recevras un email de confirmation. Le vendeur a été notifié.
        </p>
      </div>
    );
  }

  if (!methods) {
    return <div className="h-12 rounded-xl bg-gray-100 dark:bg-navy-700/60 animate-pulse" />;
  }

  if (!methods.stripe && !methods.paypal) {
    return (
      <div className="text-sm text-gray-400 dark:text-navy-100/50 text-center py-3 border border-dashed border-gray-200 dark:border-navy-700 rounded-xl">
        Le vendeur n&apos;a pas encore connecté de moyen de paiement.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {methods.stripe && (
        <button
          onClick={() => setShowStripe(true)}
          className="w-full bg-lime hover:bg-lime-dark text-navy font-black py-3.5 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Payer par carte — {total} €
        </button>
      )}

      {methods.paypal && (
        <PayPalPaymentButton
          listingId={listingId}
          offerId={offerId}
          shippingMethod={shippingMethod}
          onSuccess={() => { setSuccess(true); onPurchased(); }}
          onError={(msg) => setPaypalError(msg)}
        />
      )}
      {paypalError && <p className="text-xs text-red-500 text-center">{paypalError}</p>}

      {showStripe && (
        <StripePaymentModal
          listingId={listingId}
          price={total}
          itemPrice={itemPrice}
          shippingCost={shippingCost}
          shippingMethod={shippingMethod}
          offerId={offerId}
          onClose={() => setShowStripe(false)}
          onSuccess={() => {
            setShowStripe(false);
            setSuccess(true);
            onPurchased();
          }}
        />
      )}
    </div>
  );
}
