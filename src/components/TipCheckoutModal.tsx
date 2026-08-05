"use client";
import { useState, useEffect } from "react";
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
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      <div className="flex gap-3 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-gray-200 dark:border-navy-700 rounded-xl py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-lime hover:bg-lime-dark disabled:opacity-50 text-navy font-black py-3 rounded-xl text-sm transition-colors"
        >
          {processing ? "Paiement…" : "Payer →"}
        </button>
      </div>
    </form>
  );
}

interface Props {
  listingId: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TipCheckoutModal({ listingId, amount, onClose, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stripe/tip-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, amount }),
    })
      .then((res) => res.json())
      .then(({ clientSecret: cs, error: err }) => {
        if (cancelled) return;
        if (err) setError(err);
        else setClientSecret(cs);
      });
    return () => { cancelled = true; };
  }, [listingId, amount]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-gray-900 dark:text-white">Soutien — {amount.toString().replace(".", ",")} €</h2>
            <p className="text-xs text-gray-400 dark:text-navy-100/50 mt-0.5">Propulsé par Stripe</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {!clientSecret && !error && (
          <div className="py-8 text-center text-gray-400 dark:text-navy-100/50 text-sm">Initialisation…</div>
        )}
        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              locale: "fr",
              appearance: { theme: "stripe", variables: { colorPrimary: "#f43f5e", colorBackground: "#ffffff" } },
            }}
          >
            <CheckoutForm onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        )}
      </div>
    </div>
  );
}
