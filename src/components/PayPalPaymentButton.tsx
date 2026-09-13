"use client";
import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { ShippingAddress } from "@/types";
import ShippingAddressForm from "./ShippingAddressForm";
import { Package } from "lucide-react";

interface Props {
  listingId: string;
  offerId?: string;
  shippingMethod?: "home" | "pickup" | null;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function PayPalPaymentButton({ listingId, offerId, shippingMethod, onSuccess, onError }: Props) {
  const needsAddress = shippingMethod === "home";
  const [address, setAddress] = useState<ShippingAddress | null>(null);

  // Adresse de livraison requise avant d'afficher les boutons PayPal — même
  // logique que le paiement par carte, l'acheteur ne doit jamais avoir à
  // transmettre son adresse par messagerie.
  if (needsAddress && !address) {
    return <ShippingAddressForm onSubmit={setAddress} />;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {needsAddress && address && (
        <div className="bg-gray-50 dark:bg-navy-700/60 rounded-xl p-3 text-xs text-gray-600 dark:text-navy-100/70 flex items-start gap-1.5">
          <Package className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} />
          <span>
            Livraison à <strong>{address.name}</strong>, {address.line1}, {address.postal_code} {address.city}
            <button onClick={() => setAddress(null)} className="ml-2 text-navy dark:text-lime underline">Modifier</button>
          </span>
        </div>
      )}

      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
          currency: "EUR",
          intent: "capture",
        }}
      >
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
          createOrder={async () => {
            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ listingId, offerId, shippingMethod, shippingAddress: address }),
            });
            const { orderId, error } = await res.json();
            if (error) { onError(error); throw new Error(error); }
            return orderId;
          }}
          onApprove={async (data) => {
            const res = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID, shippingMethod, shippingAddress: address }),
            });
            const { status } = await res.json();
            if (status === "COMPLETED") {
              onSuccess();
            } else {
              onError("Le paiement n'a pas pu être confirmé.");
            }
          }}
          onError={() => onError("Une erreur PayPal est survenue.")}
        />
      </PayPalScriptProvider>
    </div>
  );
}
