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

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  postal_code: string;
  city: string;
}

interface Props {
  listingId: string;
  price: number;
  shippingMethod: "home" | "pickup" | null;
  itemPrice: number;
  shippingCost: number;
  offerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StripePaymentModal({
  listingId, price, shippingMethod, itemPrice, shippingCost, offerId, onClose, onSuccess,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Adresse de livraison — uniquement pour La Poste
  const needsAddress = shippingMethod === "home";
  const [address, setAddress] = useState<ShippingAddress>({ name: "", line1: "", line2: "", postal_code: "", city: "" });
  const [addressReady, setAddressReady] = useState(!needsAddress);

  const inputClass = "w-full border border-gray-200 dark:border-navy-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime bg-white dark:bg-navy-700 text-gray-900 dark:text-white placeholder:text-gray-400";

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.name || !address.line1 || !address.postal_code || !address.city) return;
    setAddressReady(true);
    initPayment(address);
  }

  async function initPayment(shippingAddr?: ShippingAddress) {
    setLoading(true);
    const res = await fetch("/api/stripe/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        shippingMethod,
        offerId,
        shippingAddress: shippingAddr ?? null,
      }),
    });
    const { clientSecret: cs, error: err } = await res.json();
    if (err) { setError(err); setLoading(false); return; }
    setClientSecret(cs);
    setLoading(false);
  }

  // Pour pickup : init immédiatement
  if (!needsAddress && !clientSecret && !loading && !error) {
    initPayment();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-md flex flex-col gap-5 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-black text-gray-900 dark:text-white">Paiement sécurisé</h2>
            <p className="text-xs text-gray-400 dark:text-navy-100/50 mt-0.5">Propulsé par Stripe</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Récapitulatif */}
        <div className="bg-gray-50 dark:bg-navy-700/60 rounded-xl p-3 flex flex-col gap-1.5 text-sm shrink-0">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-navy-100/60">Article</span>
            <span className="font-semibold text-gray-900 dark:text-white">{itemPrice} €</span>
          </div>
          {shippingCost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-navy-100/60">Livraison La Poste</span>
              <span className="font-semibold text-gray-900 dark:text-white">{shippingCost} €</span>
            </div>
          )}
          <div className="flex justify-between pt-1.5 border-t border-gray-200 dark:border-navy-600 mt-0.5">
            <span className="font-bold text-gray-900 dark:text-white">Total</span>
            <span className="font-black text-lg text-navy dark:text-lime">{price} €</span>
          </div>
        </div>

        {/* Étape 1 : Adresse de livraison (uniquement La Poste) */}
        {needsAddress && !addressReady && (
          <form onSubmit={handleAddressSubmit} className="flex flex-col gap-3">
            <p className="text-sm font-bold text-gray-900 dark:text-white">📦 Adresse de livraison</p>
            <input
              required
              placeholder="Nom et prénom"
              value={address.name}
              onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
              className={inputClass}
            />
            <input
              required
              placeholder="Adresse (rue, numéro)"
              value={address.line1}
              onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Complément d'adresse (optionnel)"
              value={address.line2}
              onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))}
              className={inputClass}
            />
            <div className="flex gap-2">
              <input
                required
                placeholder="Code postal"
                value={address.postal_code}
                onChange={e => setAddress(a => ({ ...a, postal_code: e.target.value }))}
                className={inputClass}
                style={{ maxWidth: "120px" }}
              />
              <input
                required
                placeholder="Ville"
                value={address.city}
                onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-lime hover:bg-lime-dark text-navy font-black py-3 rounded-xl text-sm transition-colors mt-1"
            >
              Continuer vers le paiement →
            </button>
          </form>
        )}

        {/* Étape 2 : Paiement Stripe */}
        {addressReady && (
          <>
            {needsAddress && (
              <div className="bg-gray-50 dark:bg-navy-700/60 rounded-xl p-3 text-xs text-gray-600 dark:text-navy-100/70">
                📦 Livraison à <strong>{address.name}</strong>, {address.line1}, {address.postal_code} {address.city}
                <button onClick={() => setAddressReady(false)} className="ml-2 text-navy dark:text-lime underline">Modifier</button>
              </div>
            )}

            {loading && (
              <div className="py-6 text-center text-gray-400 dark:text-navy-100/50 text-sm">
                Initialisation du paiement…
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  locale: "fr",
                  appearance: {
                    theme: "stripe",
                    variables: { colorPrimary: "#b8e831", colorBackground: "#ffffff" },
                  },
                }}
              >
                <CheckoutForm onSuccess={onSuccess} onClose={onClose} />
              </Elements>
            )}
          </>
        )}
      </div>
    </div>
  );
}
