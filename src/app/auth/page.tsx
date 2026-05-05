"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Vérifie ta boîte mail !</h2>
        <p className="text-gray-500 text-sm">
          On t&apos;a envoyé un lien magique à <strong>{email}</strong>.
          Clique dessus pour te connecter — aucun mot de passe nécessaire.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Ton adresse email
        </label>
        <input
          type="email"
          required
          placeholder="thomas@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-colors"
      >
        {loading ? "Envoi…" : "Recevoir mon lien de connexion →"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        Pas de mot de passe. Un lien unique dans ta boîte, c&apos;est tout.
      </p>
    </form>
  );
}

export default function AuthPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <span className="text-4xl">🏓</span>
        <h1 className="text-2xl font-black text-gray-900 mt-3 mb-1">Connexion à PingLoop</h1>
        <p className="text-sm text-gray-500">
          Connecte-toi pour vendre, acheter ou créer des alertes.
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
