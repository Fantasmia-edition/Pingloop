"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import rubbersData from "@/data/rubbers_ittf.json";
import { Rubber, ItemCategory, PimpleType, PIMPLE_LABELS, CATEGORY_CONFIG } from "@/types";
import { createClient } from "@/lib/supabase/client";

const rubbers = rubbersData as Rubber[];
const brands = [...new Set(rubbers.map((r) => r.brand))].sort();

interface Alert {
  id: string;
  category: ItemCategory | null;
  brand: string | null;
  name: string | null;
  pimple_type: PimpleType | null;
  max_price: number | null;
  created_at: string;
}

function alertLabel(a: Alert) {
  const parts = [
    a.brand && a.name ? `${a.brand} ${a.name}` : a.brand ?? a.name ?? "Tout type",
    a.pimple_type ? PIMPLE_LABELS[a.pimple_type] : null,
    a.max_price ? `< ${a.max_price}€` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export default function AlertesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<ItemCategory>("rubber");
  const [brand, setBrand] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [pimpleType, setPimpleType] = useState<PimpleType | "">("");
  const [maxPrice, setMaxPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/alertes"); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? "");

      const { data } = await supabase
        .from("search_alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setAlerts((data as Alert[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const filteredRubbers = useMemo(() => {
    if (!brand && !productSearch) return [];
    return rubbers.filter((r) => {
      const matchBrand = brand ? r.brand === brand : true;
      const matchSearch = productSearch ? r.name.toLowerCase().includes(productSearch.toLowerCase()) : true;
      const matchPimple = pimpleType ? r.pimple_type === pimpleType : true;
      return matchBrand && matchSearch && matchPimple;
    }).slice(0, 10);
  }, [brand, productSearch, pimpleType]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("search_alerts")
      .insert({
        user_id: userId,
        email: userEmail,
        category: category || null,
        brand: brand || null,
        name: productSearch || null,
        pimple_type: pimpleType || null,
        max_price: maxPrice ? Number(maxPrice) : null,
      })
      .select()
      .single();

    if (!error && data) {
      setAlerts((prev) => [data as Alert, ...prev]);
      setBrand(""); setProductSearch(""); setPimpleType(""); setMaxPrice("");
    }
    setSaving(false);
  }

  async function deleteAlert(alertId: string) {
    const supabase = createClient();
    await supabase.from("search_alerts").delete().eq("id", alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Mes alertes</h1>
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => <div key={i} className="h-14 bg-white border border-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Mes alertes</h1>
        <p className="text-sm text-gray-500">On t&apos;envoie un email à <strong>{userEmail}</strong> dès qu&apos;une annonce correspond.</p>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Alertes actives</h2>
          {alerts.map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{alertLabel(a)}</p>
                <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <button
                onClick={() => deleteAlert(a.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-black text-gray-900 mb-4">Créer une alerte</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [ItemCategory, { label: string; emoji: string }][]).map(([cat, { label, emoji }]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`border-2 rounded-xl py-2.5 text-xs font-bold transition-colors flex flex-col items-center gap-1 ${
                    category === cat ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-600"
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {category === "rubber" && (
            <div>
              <label className={labelClass}>Marque <span className="font-normal text-gray-400">(optionnel)</span></label>
              <select value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass}>
                <option value="">Toutes les marques</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Modèle <span className="font-normal text-gray-400">(optionnel)</span></label>
            <input
              type="text"
              placeholder={
                category === "rubber" ? "ex : Tenergy 05, Evolution MX-P…" :
                category === "blade"  ? "ex : Timo Boll ALC…" :
                category === "racket" ? "ex : Butterfly Primorac…" :
                category === "tshirt" ? "ex : Butterfly, Tibhar…" :
                "ex : Butterfly, Donic…"
              }
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className={inputClass}
            />
            {category === "rubber" && filteredRubbers.length > 0 && productSearch && (
              <div className="mt-1 border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {filteredRubbers.map((r) => (
                  <button
                    key={`${r.brand}-${r.name}`}
                    type="button"
                    onClick={() => { setProductSearch(r.name); setBrand(r.brand); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{r.brand} {r.name}</span>
                    <span className="text-xs text-gray-400">{PIMPLE_LABELS[r.pimple_type]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {category === "rubber" && (
            <div>
              <label className={labelClass}>Type de picots <span className="font-normal text-gray-400">(optionnel)</span></label>
              <select value={pimpleType} onChange={(e) => setPimpleType(e.target.value as PimpleType | "")} className={inputClass}>
                <option value="">Tous</option>
                <option value="In">Backside</option>
                <option value="Out">Picots courts</option>
                <option value="Long">Picots longs</option>
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Prix maximum <span className="font-normal text-gray-400">(optionnel)</span></label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="ex : 30"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className={`${inputClass} pr-10`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-colors"
          >
            {saving ? "Enregistrement…" : "Créer l'alerte 🔔"}
          </button>
        </form>
      </div>
    </div>
  );
}
