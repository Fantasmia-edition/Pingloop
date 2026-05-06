"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Si l'user a déjà un pseudo, on le redirige
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (profile?.display_name) {
        router.push("/annonces");
      } else {
        setChecking(false);
      }
    }
    check();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = pseudo.trim();
    if (trimmed.length < 2) {
      setError("Le pseudo doit faire au moins 2 caractères.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: trimmed });

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }
    router.push("/annonces");
  }

  if (checking) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <div className="text-gray-400 text-sm">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <span className="text-4xl">🏓</span>
        <h1 className="text-2xl font-black text-gray-900 mt-3 mb-1">Bienvenue sur PingLoop !</h1>
        <p className="text-sm text-gray-500">Choisis un pseudo — il sera affiché sur tes annonces.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ton pseudo</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="ex : PingMaster42"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-colors"
          >
            {loading ? "…" : "C'est parti →"}
          </button>
        </form>
      </div>
    </div>
  );
}
