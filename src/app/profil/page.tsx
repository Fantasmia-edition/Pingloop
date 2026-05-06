"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

interface Profile {
  id: string;
  display_name: string | null;
  location: string | null;
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  paypal_merchant_id: string | null;
  paypal_onboarded: boolean;
}

function ProfilContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/profil"); return; }
      setEmail(user.email ?? "");

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name ?? "");
        setLocation(data.location ?? "");
      }
    }
    load();

    // Toast from payment return
    const stripe = params.get("stripe");
    const paypal = params.get("paypal");
    if (stripe === "success") setToast("✅ Stripe configuré avec succès !");
    if (stripe === "pending") setToast("⏳ Stripe en cours de vérification — reviens dans quelques minutes.");
    if (stripe === "refresh") setToast("⚠️ Session Stripe expirée. Recommence l'activation.");
    if (paypal === "success") setToast("✅ PayPal configuré avec succès !");
  }, [router, params]);

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, display_name: displayName, location });
    setToast("✅ Profil sauvegardé !");
    setSaving(false);
  }

  async function connectStripe() {
    setStripeLoading(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const { url, error } = await res.json();
    if (error) { setToast(`❌ ${error}`); setStripeLoading(false); return; }
    window.location.href = url;
  }

  async function connectPayPal() {
    setPaypalLoading(true);
    const res = await fetch("/api/paypal/onboard", { method: "POST" });
    const { url, error } = await res.json();
    if (error) { setToast(`❌ ${error}`); setPaypalLoading(false); return; }
    window.open(url, "_blank", "width=800,height=700");
    setPaypalLoading(false);
    setToast("⏳ Complète l'activation dans la fenêtre PayPal, puis reviens ici.");
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime bg-white";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-black text-gray-900">Mon profil</h1>

      {toast && (
        <div className="bg-lime-50 border border-lime/30 rounded-xl px-4 py-3 text-sm font-semibold text-navy-800">
          {toast}
        </div>
      )}

      {/* Infos de base */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="font-black text-gray-900">Informations</h2>
        <div>
          <label className={labelClass}>Email</label>
          <input value={email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
        </div>
        <div>
          <label className={labelClass}>Prénom / pseudo</label>
          <input
            type="text"
            placeholder="Thomas"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Ville</label>
          <input
            type="text"
            placeholder="Lyon"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>

      {/* Paiements */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-5">
        <div>
          <h2 className="font-black text-gray-900">Moyens de paiement</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Active les plateformes sur lesquelles tu as déjà un compte.
            Les acheteurs verront uniquement les options que tu as configurées.
          </p>
        </div>

        {/* Stripe */}
        <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">S</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Stripe</p>
              <p className="text-xs text-gray-400">Carte bancaire · paiement sécurisé</p>
            </div>
          </div>
          {profile?.stripe_onboarded ? (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Activé</span>
          ) : (
            <button
              onClick={connectStripe}
              disabled={stripeLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {stripeLoading ? "…" : profile?.stripe_account_id ? "Finaliser" : "Connecter"}
            </button>
          )}
        </div>

        {/* PayPal */}
        <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black text-sm">P</div>
            <div>
              <p className="font-bold text-gray-900 text-sm">PayPal</p>
              <p className="text-xs text-gray-400">Compte PayPal existant</p>
            </div>
          </div>
          {profile?.paypal_onboarded ? (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Activé</span>
          ) : (
            <button
              onClick={connectPayPal}
              disabled={paypalLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {paypalLoading ? "…" : "Connecter"}
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          PingLoop prend une commission de 7% sur chaque transaction.
        </p>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  return <Suspense><ProfilContent /></Suspense>;
}
