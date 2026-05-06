"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";

function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const redirectTo = params.get("redirect") ?? "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message);
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    }

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Le mot de passe doit faire au moins 8 caractères.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.");
        setMode("login");
      }
    }

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Email envoyé ! Clique sur le lien pour réinitialiser ton mot de passe.");
      }
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Adresse email</label>
        <input
          type="email"
          required
          placeholder="thomas@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      {mode !== "forgot" && (
        <div>
          <label className={labelClass}>Mot de passe</label>
          <input
            type="password"
            required
            placeholder={mode === "signup" ? "8 caractères minimum" : "••••••••"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-colors"
      >
        {loading ? "…" : mode === "login" ? "Se connecter →" : mode === "signup" ? "Créer mon compte →" : "Envoyer le lien →"}
      </button>

      <div className="flex flex-col gap-1.5 text-center text-xs text-gray-400">
        {mode === "login" && (
          <>
            <button type="button" onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} className="hover:text-orange-500 transition-colors">
              Pas encore de compte ? Créer un compte
            </button>
            <button type="button" onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }} className="hover:text-orange-500 transition-colors">
              Mot de passe oublié ?
            </button>
          </>
        )}
        {mode === "signup" && (
          <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="hover:text-orange-500 transition-colors">
            Déjà un compte ? Se connecter
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="hover:text-orange-500 transition-colors">
            ← Retour à la connexion
          </button>
        )}
      </div>
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
