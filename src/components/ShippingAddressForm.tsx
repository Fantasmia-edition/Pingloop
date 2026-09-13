"use client";
import { useState } from "react";
import type { ShippingAddress } from "@/types";
import { Package } from "lucide-react";

interface Props {
  onSubmit: (address: ShippingAddress) => void;
}

export default function ShippingAddressForm({ onSubmit }: Props) {
  const [address, setAddress] = useState<ShippingAddress>({ name: "", line1: "", line2: "", postal_code: "", city: "" });

  const inputClass = "w-full border border-gray-200 dark:border-navy-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime bg-white dark:bg-navy-700 text-gray-900 dark:text-white placeholder:text-gray-400";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.name || !address.line1 || !address.postal_code || !address.city) return;
    onSubmit(address);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
        <Package className="w-4 h-4 shrink-0" strokeWidth={2} />
        Adresse de livraison
      </p>
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
        className="w-full bg-lime hover:bg-lime-dark text-navy font-bold py-3 rounded-xl text-sm transition-colors mt-1"
      >
        Continuer vers le paiement →
      </button>
    </form>
  );
}
