"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EarlyAdopterBadge from "@/components/EarlyAdopterBadge";
import { CheckCircle2 } from "lucide-react";

function ProfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [club, setClub] = useState("");
  const [earlyAdopter, setEarlyAdopter] = useState(false);
  const [stripeOnboarded, setStripeOnboarded] = useState(false);
  const [paypalOnboarded, setPaypalOnboarded] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const stripeStatus = searchParams.get("stripe");
  const paypalStatus = searchParams.get("paypal");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/profil"); return; }
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name, location, club, early_adopter, stripe_onboarded, paypal_onboarded")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name ?? "");
        setLocation(data.location ?? "");
        setClub(data.club ?? "");
        setEarlyAdopter(!!data.early_adopter);
        setStripeOnboarded(!!data.stripe_onboarded);
        setPaypalOnboarded(!!data.paypal_onboarded);
      }
    }
    load();
    // Se relance à chaque retour de Stripe/PayPal (les query params changent)
    // pour rafraîchir immédiatement l'état affiché.
  }, [router, stripeStatus, paypalStatus]);

  async function startStripeConnect() {
    setConnectLoading(true);
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setConnectLoading(false);
  }

  async function startPaypalConnect() {
    setPaypalLoading(true);
    const res = await fetch("/api/paypal/onboard", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setPaypalLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, display_name: displayName, location, club: club.trim() || null });
    setToast("Profil sauvegardé !");
    setSaving(false);
    setTimeout(() => setToast(""), 3000);
  }

  const inputClass = "w-full border border-gray-200 dark:border-navy-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime bg-white dark:bg-navy-800 text-gray-900 dark:text-white placeholder:text-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon profil</h1>
        {earlyAdopter && <EarlyAdopterBadge />}
      </div>

      {earlyAdopter && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Tu fais partie des premiers membres de PingLoop. Merci de nous faire confiance dès le début — ce badge sera visible sur ton profil public.
        </div>
      )}

      {toast && (
        <div className="bg-lime-50 dark:bg-lime/10 border border-lime/30 rounded-xl px-4 py-3 text-sm font-semibold text-navy dark:text-lime flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
          {toast}
        </div>
      )}

      {stripeStatus === "success" && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
          Compte Stripe connecté !
        </div>
      )}
      {stripeStatus === "pending" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Ton compte Stripe n&apos;est pas encore complètement validé — termine les informations demandées par Stripe.
        </div>
      )}
      {stripeStatus === "error" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Une erreur est survenue avec Stripe, réessaie.
        </div>
      )}
      {paypalStatus === "success" && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
          Compte PayPal connecté !
        </div>
      )}
      {paypalStatus === "pending" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Ton compte PayPal n&apos;est pas encore complètement validé — termine les informations demandées par PayPal.
        </div>
      )}
      {paypalStatus === "error" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Une erreur est survenue avec PayPal, réessaie.
        </div>
      )}

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Informations</h2>

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
        <div>
          <label className={labelClass}>Club <span className="font-normal text-gray-400">(optionnel)</span></label>
          <input
            type="text"
            placeholder="ex : TT Marseille"
            value={club}
            onChange={(e) => setClub(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            1 % du prix de tes ventes est reversé à ton club — voir <a href="/clubs" className="underline hover:text-gray-600 dark:hover:text-navy-100">la page Clubs</a>.
          </p>
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-lime hover:bg-lime-dark disabled:opacity-50 text-navy font-bold py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>

      {/* Moyens de paiement */}
      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-6 flex flex-col gap-5">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white">Recevoir mes paiements</h2>
          <p className="text-sm text-gray-500 dark:text-navy-100/60 mt-1">
            Connecte au moins un des deux pour pouvoir vendre — Stripe ou PayPal, à toi de choisir (tu peux aussi activer les deux).
          </p>
        </div>

        {!stripeOnboarded && !paypalOnboarded && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            Aucun moyen de paiement connecté pour l&apos;instant — tu peux quand même publier une annonce, les acheteurs pourront déjà te payer par carte. Les fonds seront bloqués jusqu&apos;à ce que tu connectes Stripe ou PayPal, puis débloqués automatiquement.
          </div>
        )}

        <div className="flex flex-col gap-3 pt-1 border-t border-gray-100 dark:border-navy-700 first:border-0 first:pt-0">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Stripe</p>
          {stripeOnboarded ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Compte bancaire connecté — tu recevras tes paiements automatiquement
            </div>
          ) : (
            <button
              onClick={startStripeConnect}
              disabled={connectLoading}
              className="w-full bg-navy hover:bg-navy-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {connectLoading ? "Redirection…" : "Connecter mon compte bancaire →"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-navy-700">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">PayPal</p>
          {paypalOnboarded ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Compte PayPal connecté — tu recevras tes paiements automatiquement
            </div>
          ) : (
            <button
              onClick={startPaypalConnect}
              disabled={paypalLoading}
              className="w-full bg-[#003087] hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {paypalLoading ? "Redirection…" : "Connecter mon compte PayPal →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  return <Suspense><ProfilContent /></Suspense>;
}
