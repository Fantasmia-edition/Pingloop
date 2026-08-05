import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Clubs — PingLoop",
  description: "Le montant reversé aux clubs de tennis de table grâce aux ventes sur PingLoop.",
};

export default async function ClubsPage() {
  const supabase = await createClient();
  const [{ data: sales }, { data: tips }] = await Promise.all([
    supabase.from("club_contributions").select("club, amount"),
    supabase.from("pickup_tips").select("club, club_share").not("club", "is", null),
  ]);

  const totals = new Map<string, { amount: number; count: number }>();
  for (const row of sales ?? []) {
    const entry = totals.get(row.club) ?? { amount: 0, count: 0 };
    entry.amount += Number(row.amount);
    entry.count += 1;
    totals.set(row.club, entry);
  }
  for (const row of tips ?? []) {
    if (!row.club || row.club_share == null) continue;
    const entry = totals.get(row.club) ?? { amount: 0, count: 0 };
    entry.amount += Number(row.club_share);
    entry.count += 1;
    totals.set(row.club, entry);
  }

  const ranked = [...totals.entries()]
    .map(([club, v]) => ({ club, ...v }))
    .sort((a, b) => b.amount - a.amount);

  const grandTotal = ranked.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-xs font-bold tracking-widest uppercase text-lime mb-3">Clubs</p>
        <h1 className="text-4xl font-black text-navy dark:text-white leading-tight mb-4">
          On reverse aux clubs
        </h1>
        <p className="text-gray-500 dark:text-navy-100/60 text-lg leading-relaxed">
          À chaque vente, 1 % du prix est reversé au club du vendeur, et lors d&apos;une remise en main
          propre, la moitié d&apos;un éventuel pourboire de soutien y va aussi — sans surcoût pour
          l&apos;acheteur, sans rien changer à ce que touche le vendeur.
          {grandTotal > 0 && ` Déjà ${grandTotal.toFixed(2)} € reversés au total.`}
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="border border-dashed border-gray-200 dark:border-navy-700 rounded-xl p-8 text-center text-sm text-gray-400 dark:text-navy-100/50">
          Aucun reversement pour l&apos;instant — les premières ventes arrivent bientôt !
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-navy-700">
          {ranked.map((r, i) => (
            <div key={r.club} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-300 dark:text-navy-100/30 tabular-nums w-5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-bold text-navy dark:text-white">{r.club}</p>
                  <p className="text-xs text-gray-400 dark:text-navy-100/50">
                    {r.count} contribution{r.count > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <p className="text-lg font-black text-navy dark:text-lime">{r.amount.toFixed(2)} €</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-navy-100/40 mt-10 text-center">
        Ton club n&apos;est pas dans la liste ? Ajoute-le dans{" "}
        <a href="/profil" className="underline">ton profil</a> pour qu&apos;il touche sa part sur tes prochaines ventes.
      </p>
    </div>
  );
}
