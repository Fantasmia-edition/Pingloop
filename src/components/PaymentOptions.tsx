"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { SHIPPING_PRICES } from "@/types";

const StripePaymentModal = dynamic(() => import("./StripePaymentModal"), { ssr: false });

type ShippingMethod = "home" | "pickup" | null;

interface Props {
  listingId: string;
  itemPrice: number;
  shippingMethod: ShippingMethod;
  offerId?: string;
  onPurchased: () => void;
}

export default function PaymentOptions({ listingId, itemPrice, shippingMethod, offerId, onPurchased }: Props) {
  const [showStripe, setShowStripe] = useState(false);
  const [success, setSuccess] = useState(false);

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

  return (
    <>
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
    </>
  );
}
