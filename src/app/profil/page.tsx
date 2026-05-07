"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ProfilContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/profil"); return; }
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name, location")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name ?? "");
        setLocation(data.location ?? "");
      }
    }
    load();
  }, [router]);

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, display_name: displayName, location });
    setToast("✅ Profil sauvegardé !");
    setSaving(false);
    setTimeout(() => setToast(""), 3000);
  }

  const inputClass = "w-full border border-gray-200 dark:border-navy-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime bg-white dark:bg-navy-800 text-gray-900 dark:text-white placeholder:text-gray-400";
  const labelClass = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">Mon profil</h1>

      {toast && (
        <div className="bg-lime-50 dark:bg-lime/10 border border-lime/30 rounded-xl px-4 py-3 text-sm font-semibold text-navy dark:text-lime">
          {toast}
        </div>
      )}

      <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="font-black text-gray-900 dark:text-white">Informations</h2>

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
          className="w-full bg-lime hover:bg-lime-dark disabled:opacity-50 text-navy font-black py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  return <Suspense><ProfilContent /></Suspense>;
}
