"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full border border-gray-200 dark:border-navy-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-navy-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-navy-100/40 focus:outline-none focus:ring-2 focus:ring-lime";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <span className="text-4xl">🔑</span>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-3 mb-1">Nouveau mot de passe</h1>
        <p className="text-sm text-gray-500">Choisis un nouveau mot de passe pour ton compte.</p>
      </div>
      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              required
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-lime hover:bg-lime-dark disabled:opacity-50 text-navy font-black py-3.5 rounded-xl transition-colors"
          >
            {loading ? "…" : "Enregistrer →"}
          </button>
        </form>
      </div>
    </div>
  );
}
