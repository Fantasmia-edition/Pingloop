"use client";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Erreur de paiement");
      setProcessing(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          {processing ? "Paiement…" : "Payer par carte"}
        </button>
      </div>
    </form>
  );
}

interface Props {
  listingId: string;
  price: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StripePaymentModal({ listingId, price, onClose, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function initPayment() {
    setLoading(true);
    const res = await fetch("/api/stripe/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const { clientSecret: cs, error: err } = await res.json();
    if (err) { setError(err); setLoading(false); return; }
    setClientSecret(cs);
    setLoading(false);
  }

  if (!clientSecret && !loading && !error) {
    initPayment();
    return (
      <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md flex items-center justify-center min-h-[120px]">
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-gray-900">Paiement par carte</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-gray-500">Montant : <span className="font-bold text-gray-900">{price} €</span></p>

        {loading && <p className="text-gray-400 text-sm text-center py-4">Chargement…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, locale: "fr" }}>
            <CheckoutForm onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        )}
      </div>
    </div>
  );
}
