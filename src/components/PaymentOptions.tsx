"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { SHIPPING_PRICES } from "@/types";
import { PartyPopper, CreditCard, KeyRound } from "lucide-react";

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
  const [successPickupCode, setSuccessPickupCode] = useState<string | null>(null);
  const [paypalError, setPaypalError] = useState("");
  const [fetchedPaypal, setFetchedPaypal] = useState<boolean | null>(null);

  const hasServerData = sellerPaypalOnboarded !== undefined;

  useEffect(() => {
    if (hasServerData) return;
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const { data: listing } = await supabase
        .from("listings")
        .select("seller_id")
        .eq("id", listingId)
        .single();
      if (!listing) { if (!cancelled) setFetchedPaypal(false); return; }
      // Pas de clé étrangère directe entre listings et profiles (les deux
      // référencent auth.users séparément) — deux requêtes nécessaires.
      const { data: profile } = await supabase
        .from("profiles")
        .select("paypal_onboarded")
        .eq("id", listing.seller_id)
        .single();
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
        {successPickupCode && (
          <div className="mt-4 bg-white dark:bg-navy-800 border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-navy-100/60 flex items-center justify-center gap-1.5 mb-1.5">
              <KeyRound className="w-3.5 h-3.5" strokeWidth={2} />
              Ton code de remise
            </p>
            <p className="text-3xl font-black tabular-nums tracking-widest text-gray-900 dark:text-white">{successPickupCode}</p>
            <p className="text-xs text-gray-400 dark:text-navy-100/50 mt-1.5">
              Donne-le au vendeur au moment de l&apos;échange — il l&apos;utilisera pour confirmer la remise sur PingLoop.
            </p>
          </div>
        )}
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
          onSuccess={(pickupCode) => { setSuccessPickupCode(pickupCode ?? null); setSuccess(true); onPurchased(); }}
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
          onSuccess={(pickupCode) => {
            setShowStripe(false);
            setSuccessPickupCode(pickupCode ?? null);
            setSuccess(true);
            onPurchased();
          }}
        />
      )}
    </div>
  );
}
