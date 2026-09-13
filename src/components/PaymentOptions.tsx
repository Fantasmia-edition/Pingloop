"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { SHIPPING_PRICES } from "@/types";
import { PartyPopper, CreditCard } from "lucide-react";

const StripePaymentModal = dynamic(() => import("./StripePaymentModal"), { ssr: false });
const PayPalPaymentButton = dynamic(() => import("./PayPalPaymentButton"), { ssr: false });

type ShippingMethod = "home" | "pickup" | null;

interface Props {
  listingId: string;
  itemPrice: number;
  shippingMethod: ShippingMethod;
  offerId?: string;
  onPurchased: () => void;
  /** Si fourni par le parent (page annonce, déjà chargé côté serveur), on
   * évite un aller-retour réseau supplémentaire et le flash de chargement. */
  sellerPaypalOnboarded?: boolean;
}

export default function PaymentOptions({
  listingId, itemPrice, shippingMethod, offerId, onPurchased,
  sellerPaypalOnboarded,
}: Props) {
  const [showStripe, setShowStripe] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paypalError, setPaypalError] = useState("");
  const [fetchedPaypal, setFetchedPaypal] = useState<boolean | null>(null);

  const hasServerData = sellerPaypalOnboarded !== undefined;

  useEffect(() => {
    if (hasServerData) return;
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("listings")
        .select("profiles!listings_seller_id_fkey(paypal_onboarded)")
        .eq("id", listingId)
        .single();
      const profile = (data as { profiles?: { paypal_onboarded?: boolean } } | null)?.profiles;
      if (!cancelled) {
        setFetchedPaypal(!!profile?.paypal_onboarded);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [listingId, hasServerData]);

  // Le paiement carte fonctionne toujours, même si le vendeur n'a pas encore
  // connecté Stripe — les fonds sont retenus sur le solde plateforme puis
  // débloqués automatiquement dès qu'il termine son onboarding (cf.
  // /api/stripe/payment-intent et /api/stripe/connect/return).
  const paypalAvailable = hasServerData ? !!sellerPaypalOnboarded : fetchedPaypal;

  const shippingCost = shippingMethod === "home" ? SHIPPING_PRICES.home : 0;
  const total = itemPrice + shippingCost;

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-5 text-center">
        <PartyPopper className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" strokeWidth={2} />
        <p className="text-green-700 dark:text-green-400 font-bold text-base">Paiement confirmé !</p>
        <p className="text-sm text-green-600 dark:text-green-500 mt-1">
          Tu recevras un email de confirmation. Le vendeur a été notifié.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={() => setShowStripe(true)}
        className="w-full bg-lime hover:bg-lime-dark text-navy font-bold py-3.5 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
      >
        <CreditCard className="w-4 h-4" strokeWidth={2} />
        Payer par carte — {total} €
      </button>

      {paypalAvailable && (
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
