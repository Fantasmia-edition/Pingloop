"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

const StripePaymentModal = dynamic(() => import("./StripePaymentModal"), { ssr: false });
const PayPalPaymentButton = dynamic(() => import("./PayPalPaymentButton"), { ssr: false });

interface SellerProfile {
  stripe_onboarded: boolean;
  paypal_onboarded: boolean;
}

interface Props {
  listingId: string;
  price: number;
  sellerProfile: SellerProfile;
  onPurchased: () => void;
}

export default function PaymentOptions({ listingId, price, sellerProfile, onPurchased }: Props) {
  const [showStripe, setShowStripe] = useState(false);
  const [paypalError, setPaypalError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasStripe = sellerProfile.stripe_onboarded;
  const hasPaypal = sellerProfile.paypal_onboarded;

  if (!hasStripe && !hasPaypal) return null;

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-green-700 font-bold text-lg">✅ Paiement confirmé !</p>
        <p className="text-sm text-green-600 mt-1">Le vendeur a été notifié. L&apos;annonce est maintenant marquée comme vendue.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <h2 className="font-black text-gray-900">Acheter cet article</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Paiement sécurisé — <span className="font-semibold text-gray-700">{price} €</span>
          </p>
        </div>

        {hasStripe && (
          <button
            onClick={() => setShowStripe(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            <span className="bg-white text-indigo-600 font-black text-xs w-5 h-5 rounded flex items-center justify-center">S</span>
            Payer par carte (Stripe)
          </button>
        )}

        {hasPaypal && (
          <div className="flex flex-col gap-1">
            {paypalError && <p className="text-red-600 text-xs">{paypalError}</p>}
            <PayPalPaymentButton
              listingId={listingId}
              onSuccess={() => { setSuccess(true); onPurchased(); }}
              onError={setPaypalError}
            />
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">7% de commission PingLoop incluse</p>
      </div>

      {showStripe && (
        <StripePaymentModal
          listingId={listingId}
          price={price}
          onClose={() => setShowStripe(false)}
          onSuccess={() => { setShowStripe(false); setSuccess(true); onPurchased(); }}
        />
      )}
    </>
  );
}
