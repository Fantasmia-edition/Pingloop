"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface Props {
  listingId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function PayPalPaymentButton({ listingId, onSuccess, onError }: Props) {
  return (
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
            body: JSON.stringify({ listingId }),
          });
          const { orderId, error } = await res.json();
          if (error) { onError(error); throw new Error(error); }
          return orderId;
        }}
        onApprove={async (data) => {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
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
  );
}
