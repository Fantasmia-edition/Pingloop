"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import rubbersData from "@/data/rubbers_ittf.json";
import { Rubber, ItemCategory, Condition, CONDITION_LABELS, PIMPLE_LABELS, CATEGORY_CONFIG, SHIPPING_PRICES } from "@/types";
import { HOME_SHIPPING_ENABLED } from "@/lib/config";
import PhotoUpload from "@/components/PhotoUpload";
import PriceSuggestion from "@/components/PriceSuggestion";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { CategoryIcon, ShippingIcon } from "@/components/icons";
import { Lock, CreditCard, Check } from "lucide-react";

const rubbers = rubbersData as Rubber[];
const brands = [...new Set(rubbers.map((r) => r.brand))].sort();

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function uploadPhotos(dataUrls: string[], listingId: string, userId: string) {
  const supabase = createClient();
  const publicUrls: string[] = [];
  for (const dataUrl of dataUrls) {
    const blob = dataUrlToBlob(dataUrl);
    const path = `${userId}/${listingId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("listing-photos")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (!error) {
      const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
      publicUrls.push(data.publicUrl);
    }
  }
  return publicUrls;
}

export default function VendrePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [category, setCategory] = useState<ItemCategory>("rubber");
  const [brand, setBrand] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedRubber, setSelectedRubber] = useState<Rubber | null>(null);
  const [color, setColor] = useState("");
  const [condition, setCondition] = useState<Condition>("good");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  // Bêta : seule la remise en main propre est disponible pour l'instant.
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [shippingHome, setShippingHome] = useState(false);
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [stripeOnboarded, setStripeOnboarded] = useState(false);
  const [paypalOnboarded, setPaypalOnboarded] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, stripe_onboarded, paypal_onboarded")
          .eq("id", user.id)
          .single();
        if (profile?.display_name) setDisplayName(profile.display_name);
        setStripeOnboarded(!!profile?.stripe_onboarded);
        setPaypalOnboarded(!!profile?.paypal_onboarded);
      }
      setCheckingPayment(false);
    }
    load();
  }, []);

  const filteredRubbers = useMemo(() => {
    if (!brand && !productSearch) return [];
    return rubbers
      .filter((r) => {
        const matchBrand = brand ? r.brand === brand : true;
        const matchSearch = productSearch
          ? r.name.toLowerCase().includes(productSearch.toLowerCase())
          : true;
        return matchBrand && matchSearch;
      })
      .slice(0, 12);
  }, [brand, productSearch]);

  const inputClass =
    "w-full border border-gray-200 dark:border-navy-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime bg-white dark:bg-navy-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-navy-100/40";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Lock className="w-10 h-10 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion requise</h1>
        <p className="text-gray-500 mb-6">Pour mettre en vente, connecte-toi en 30 secondes — sans mot de passe.</p>
        <button
          onClick={() => router.push("/auth?redirect=/vendre")}
          className="bg-lime hover:bg-lime-dark text-navy font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Se connecter →
        </button>
      </div>
    );
  }

  if (checkingPayment) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center text-gray-400 dark:text-navy-100/50 text-sm">
        Chargement…
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (photos.length === 0) {
      setError("Ajoute au moins une photo.");
      return;
    }
    if (!pickupAvailable && !shippingHome) {
      setError("Sélectionne au moins un mode d'envoi.");
      return;
    }
    if (pickupAvailable && !location.trim()) {
      setError("Indique ta ville pour la remise en main propre.");
      return;
    }
    setSubmitting(true);
    setError("");
    const supabase = createClient();

    // 1. Insert listing (without photos first to get the ID)
    const listingData = {
      category,
      brand,
      name: selectedRubber?.name ?? productSearch,
      pimple_type: category === "rubber" ? selectedRubber?.pimple_type ?? null : null,
      color: category === "rubber" ? color || null : null,
      condition,
      price: Number(price),
      description,
      seller_id: user.id,
      seller_name: displayName || (user.email?.split("@")[0] ?? "Anonyme"),
      location: location.trim() || null,
      approval_code: selectedRubber?.approval_code ?? null,
      pickup_available: pickupAvailable,
      shipping_home: HOME_SHIPPING_ENABLED && shippingHome,
      photos: [],
    };

    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert(listingData)
      .select()
      .single();

    if (insertError || !listing) {
      setError(insertError?.message ?? "Erreur lors de la publication.");
      setSubmitting(false);
      return;
    }

    // 2. Upload photos and update listing
    if (photos.length > 0) {
      const photoUrls = await uploadPhotos(photos, listing.id, user.id);
      await supabase.from("listings").update({ photos: photoUrls }).eq("id", listing.id);
    }

    // 3. Notify matching alerts + confirm to seller (fire and forget)
    fetch("/api/notify-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id }),
    }).catch((err) => console.error("notify-alerts failed", err));
    fetch("/api/notify-listing-published", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id }),
    }).catch((err) => console.error("notify-listing-published failed", err));

    router.push(`/annonces/${listing.id}?published=1`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Mettre en vente</h1>
        <p className="text-sm text-gray-500 dark:text-navy-100/60">Remplis le formulaire — ça prend moins d&apos;une minute.</p>
      </div>

      {!stripeOnboarded && !paypalOnboarded && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Aucun moyen de paiement connecté</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">
              Tu peux publier ton annonce dès maintenant, mais les acheteurs ne pourront pas encore te payer. Connecte Stripe ou PayPal depuis ton profil avant la première vente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/profil")}
            className="shrink-0 text-xs font-bold text-amber-800 dark:text-amber-300 underline whitespace-nowrap"
          >
            Mon profil →
          </button>
        </div>
      )}

      <form
        className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-6 flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        {/* Category */}
        <div>
          <label className={labelClass}>Type d&apos;article</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [ItemCategory, { label: string }][]).map(([cat, { label }]) => (
              <button
                key={cat}
                type="button"
                onClick={() => { setCategory(cat); setSelectedRubber(null); setBrand(""); setProductSearch(""); }}
                className={`border-2 rounded-xl py-2.5 text-xs font-bold transition-colors flex flex-col items-center gap-1 ${
                  category === cat
                    ? "border-lime bg-lime-50 text-navy"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <CategoryIcon category={cat} className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div>
          <label className={labelClass}>Marque</label>
          {category === "rubber" ? (
            <select
              value={brand}
              onChange={(e) => { setBrand(e.target.value); setSelectedRubber(null); setProductSearch(""); }}
              className={inputClass}
              required
            >
              <option value="">Sélectionne une marque…</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          ) : (
            <input
              type="text"
              placeholder="ex : Butterfly, Donic, Stiga…"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className={inputClass}
            />
          )}
        </div>

        {/* Rubber search */}
        {category === "rubber" && (
          <div>
            <label className={labelClass}>Revêtement</label>
            {selectedRubber ? (
              <div className="flex items-center justify-between bg-lime-50 border-2 border-lime/60 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selectedRubber.brand} {selectedRubber.name}</p>
                  <p className="text-xs text-gray-500">{PIMPLE_LABELS[selectedRubber.pimple_type]} · Code ITTF : {selectedRubber.approval_code ?? "—"}</p>
                </div>
                <button type="button" onClick={() => setSelectedRubber(null)} className="text-gray-400 hover:text-gray-600 text-xs underline">
                  Changer
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder={brand ? `Recherche dans ${brand}…` : "Tape le nom du revêtement…"}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={inputClass}
                  disabled={!brand}
                />
                {filteredRubbers.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {filteredRubbers.map((r) => (
                      <button
                        key={`${r.brand}-${r.name}`}
                        type="button"
                        onClick={() => { setSelectedRubber(r); setProductSearch(r.name); setColor(""); }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-lime-50 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900">{r.name}</span>
                        <span className="text-xs text-gray-400">{PIMPLE_LABELS[r.pimple_type]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Generic name (blade / racket / tshirt / case) */}
        {category !== "rubber" && (
          <div>
            <label className={labelClass}>
              {category === "blade" ? "Modèle de bois" :
               category === "racket" ? "Modèle de raquette" :
               category === "tshirt" ? "Modèle / taille" :
               "Modèle de housse"}
            </label>
            <input
              type="text"
              placeholder={
                category === "blade" ? "ex : Timo Boll ALC, Waldner Senso Carbon…" :
                category === "racket" ? "ex : Butterfly Primorac, Donic Waldner…" :
                category === "tshirt" ? "ex : Butterfly M, Tibhar L…" :
                "ex : Butterfly, Donic, standard..."
              }
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        )}

        {/* Color */}
        {category === "rubber" && selectedRubber && (
          <div>
            <label className={labelClass}>Couleur</label>
            <div className="flex flex-wrap gap-2">
              {selectedRubber.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                    color === c ? "border-lime bg-lime-50 text-navy" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {c === "Red" ? "Rouge" : c === "Black" ? "Noir" : c === "Blue" ? "Bleu" : c === "Green" ? "Vert" : c === "Pink" ? "Rose" : c === "Violet" ? "Violet" : c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Condition */}
        <div>
          <label className={labelClass}>État</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(CONDITION_LABELS) as [Condition, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCondition(key)}
                className={`border-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  condition === key
                    ? "border-lime bg-lime-50 text-navy"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className={labelClass}>Prix demandé (€)</label>
          <div className="relative mb-2">
            <input
              type="number"
              min="1"
              placeholder="ex : 25"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`${inputClass} pr-10`}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</span>
          </div>
          {category === "rubber" && selectedRubber && (
            <PriceSuggestion
              brand={selectedRubber.brand}
              name={selectedRubber.name}
              condition={condition}
              currentPrice={price}
            />
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description <span className="font-normal text-gray-400">(optionnel)</span></label>
          <textarea
            rows={3}
            placeholder="Durée d'utilisation, épaisseur d'éponge, raisons de la vente…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Localisation */}
        <div>
          <label className={labelClass}>Ta ville <span className="font-normal text-gray-400">(optionnel)</span></label>
          <input
            type="text"
            placeholder="ex : Paris 11e, Lyon, Bordeaux…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Envoi */}
        <div>
          <label className={labelClass}>Mode d&apos;envoi</label>
          <p className="text-xs text-gray-400 dark:text-navy-100/50 -mt-1 mb-3">
            Version bêta : seule la remise en main propre est disponible pour l&apos;instant.
          </p>
          <div className="flex flex-col gap-2">
            {!HOME_SHIPPING_ENABLED && (
              <div className="flex items-center gap-3 p-3.5 border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-xl opacity-60">
                <ShippingIcon method="home" className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-500 dark:text-navy-100/60">Envoi par La Poste</p>
                  <p className="text-xs text-gray-400 dark:text-navy-100/50">On y travaille — arrive très bientôt !</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-navy-100/50 border border-gray-300 dark:border-navy-600 rounded-full px-2 py-0.5 shrink-0">
                  Bientôt
                </span>
              </div>
            )}
            {[
              ...(HOME_SHIPPING_ENABLED
                ? [{ method: "home" as const, label: "Envoi par La Poste", sub: `Colissimo · ${SHIPPING_PRICES.home} €`, value: shippingHome, set: setShippingHome }]
                : []),
              { method: "pickup" as const, label: "Remise en main propre", sub: "Rencontre convenue avec l'acheteur · gratuit", value: pickupAvailable, set: setPickupAvailable },
            ].map(({ method, label, sub, value, set }) => (
              <button
                key={label}
                type="button"
                onClick={() => set(!value)}
                className={`flex items-center gap-3 p-3.5 border-2 rounded-xl text-left transition-colors w-full ${
                  value
                    ? "border-lime bg-lime-50 dark:bg-lime/10"
                    : "border-gray-200 dark:border-navy-700 hover:border-gray-300"
                }`}
              >
                <ShippingIcon method={method} className="w-5 h-5 text-navy dark:text-white" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-gray-400 dark:text-navy-100/50">{sub}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  value ? "border-lime bg-lime" : "border-gray-300 dark:border-navy-600"
                }`}>
                  {value && <Check className="w-3 h-3 text-navy" strokeWidth={3} />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className={labelClass}>
            Photos <span className="font-normal text-gray-400">(min 1 · max 5)</span>
          </label>
          <PhotoUpload photos={photos} onChange={setPhotos} max={5} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-lime hover:bg-lime-dark disabled:opacity-50 text-navy font-bold py-4 rounded-xl text-base transition-colors mt-1"
        >
          {submitting ? "Publication en cours…" : "Publier l'annonce →"}
        </button>
      </form>
    </div>
  );
}
