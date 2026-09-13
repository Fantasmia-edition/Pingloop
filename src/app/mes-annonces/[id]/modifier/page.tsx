"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Condition, CONDITION_LABELS } from "@/types";
import { HOME_SHIPPING_ENABLED } from "@/lib/config";

export default function ModifierAnnoncePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<Condition>("good");
  const [shippingHome, setShippingHome] = useState(false);
  const [pickupAvailable, setPickupAvailable] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("seller_id", user.id)
        .single();

      if (error || !data) { router.push("/mes-annonces"); return; }

      setTitle(`${data.brand} ${data.name}`);
      setPrice(String(data.price));
      setLocation(data.location ?? "");
      setDescription(data.description ?? "");
      setCondition(data.condition as Condition);
      // Bêta : seule la remise en main propre est disponible pour l'instant.
      setShippingHome(HOME_SHIPPING_ENABLED && !!data.shipping_home);
      setPickupAvailable(!!data.pickup_available);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!price || Number(price) <= 0) { setError("Le prix doit être supérieur à 0."); return; }
    if (!shippingHome && !pickupAvailable) { setError("Sélectionne au moins un mode de livraison."); return; }
    if (pickupAvailable && !location.trim()) { setError("Indique ta ville pour la remise en main propre."); return; }

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("listings")
      .update({
        price: Number(price),
        location: location.trim() || null,
        description: description.trim(),
        condition,
        shipping_home: shippingHome,
        pickup_available: pickupAvailable,
      })
      .eq("id", id);

    if (error) { setError("Erreur lors de la sauvegarde."); setSaving(false); return; }
    setSuccess(true);
    setTimeout(() => router.push("/mes-annonces"), 1200);
  }

  const inputCls = "w-full border border-gray-200 dark:border-navy-700 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime";

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="h-6 bg-gray-100 dark:bg-navy-800 rounded w-48 mb-6 animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-navy-800 rounded-lg mb-4 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button onClick={() => router.push("/mes-annonces")} className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-white mb-4 inline-flex items-center gap-1">
        ← Mes annonces
      </button>
      <h1 className="text-xl font-black text-gray-900 dark:text-white mb-1">Modifier l&apos;annonce</h1>
      <p className="text-sm text-gray-400 mb-6">{title}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-navy-100 mb-1.5">Prix (€)</label>
          <input
            type="number"
            min="1"
            step="0.50"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-navy-100 mb-1.5">État</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value as Condition)} className={inputCls}>
            {(Object.keys(CONDITION_LABELS) as Condition[]).map((c) => (
              <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-navy-100 mb-1.5">Localisation</label>
          <input
            type="text"
            placeholder="Ex : Paris 11e, Lyon…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-navy-100 mb-1.5">Description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails supplémentaires, heures de jeu, état réel…"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-navy-100 mb-2">Modes de livraison</p>
          <p className="text-xs text-gray-400 dark:text-navy-100/50 -mt-1 mb-2">
            Version bêta : seule la remise en main propre est disponible pour l&apos;instant.
          </p>
          <div className="flex flex-col gap-2">
            <label className={`flex items-center gap-3 ${HOME_SHIPPING_ENABLED ? "cursor-pointer" : "opacity-50"}`}>
              <input
                type="checkbox"
                checked={shippingHome}
                disabled={!HOME_SHIPPING_ENABLED}
                onChange={(e) => setShippingHome(e.target.checked)}
                className="w-4 h-4 accent-lime"
              />
              <span className="text-sm text-gray-700 dark:text-navy-100">La Poste (8 €)</span>
              {!HOME_SHIPPING_ENABLED && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-navy-100/50 border border-gray-300 dark:border-navy-600 rounded-full px-2 py-0.5">
                  Bientôt
                </span>
              )}
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={pickupAvailable} onChange={(e) => setPickupAvailable(e.target.checked)} className="w-4 h-4 accent-lime" />
              <span className="text-sm text-gray-700 dark:text-navy-100">Remise en main propre</span>
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">Annonce mise à jour !</p>}

        <button
          type="submit"
          disabled={saving || success}
          className="bg-lime hover:bg-lime-dark disabled:opacity-50 text-navy font-black py-3 rounded-xl transition-colors"
        >
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}
