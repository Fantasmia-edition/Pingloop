import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import { Listing } from "@/types";
import { PackagePlus, ArrowRight } from "lucide-react";
import { LoopMark, LoopTrajectory } from "@/components/LoopTrajectory";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .is("sold_at", null)
    .order("created_at", { ascending: false })
    .limit(6);

  const recent = (data as Listing[]) ?? [];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-navy text-white overflow-hidden">
        <LoopTrajectory className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-lime/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-lime text-sm font-semibold px-3 py-1.5 rounded-full mb-8">
            <LoopMark className="w-4 h-4" />
            Le marché des pongistes · Version bêta
          </div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6">
            Du matos<br />de qualité,<br />
            <span className="text-lime">sans te ruiner.</span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
            Bois, revêtements, raquettes complètes — d&apos;occasion, entre pongistes qui savent de quoi ils parlent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/annonces" className="group bg-lime hover:bg-lime-dark text-navy font-bold px-8 py-3.5 rounded-xl transition-colors text-base inline-flex items-center gap-2">
              Voir les annonces
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>
            <Link href="/vendre" className="text-white/70 hover:text-white font-semibold px-8 py-3.5 transition-colors text-base underline-offset-4 hover:underline">
              Mettre en vente
            </Link>
          </div>
        </div>
      </section>

      {/* Stats — scoreboard */}
      <section className="bg-navy-800 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 divide-x divide-white/10 text-center text-white">
          {[
            { value: "1 616", label: "revêtements ITTF" },
            { value: "142", label: "marques référencées" },
            { value: "60 sec", label: "pour mettre en vente" },
          ].map((s) => (
            <div key={s.label} className="py-8 px-2">
              <p className="text-3xl sm:text-5xl font-black text-lime tabular-nums tracking-tight">{s.value}</p>
              <p className="text-[11px] sm:text-xs font-semibold text-white/40 mt-1.5 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      <section className="py-14 bg-white dark:bg-navy-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-navy">Dernières annonces</h2>
              <p className="text-sm text-gray-400 mt-0.5">Fraîchement publiées par la communauté</p>
            </div>
            <Link href="/annonces" className="text-sm font-bold text-navy hover:text-navy-700 underline underline-offset-2">
              Tout voir →
            </Link>
          </div>
          {recent.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <PackagePlus className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
              <p className="font-bold text-navy text-lg">Sois le premier à vendre !</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">La communauté t&apos;attend.</p>
              <Link href="/vendre" className="bg-lime hover:bg-lime-dark text-navy font-bold px-6 py-2.5 rounded-xl transition-colors text-sm inline-block">
                Mettre en vente →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why PingLoop */}
      <section className="py-16 bg-navy-50 dark:bg-navy">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-12 sm:gap-20 items-start">
            <div className="sm:sticky sm:top-8 shrink-0">
              <p className="text-xs font-bold tracking-widest uppercase text-lime mb-3">Pourquoi PingLoop</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-navy dark:text-white leading-tight">
                Un marché fait<br />par des joueurs.
              </h2>
            </div>
            <div className="flex flex-col divide-y divide-navy-100 dark:divide-navy-700 flex-1">
              {[
                { n: "01", title: "Un Tenergy à 30 €, c'est possible.", desc: "Arrête de claquer 60 € dans un revêtement neuf. Teste via l'occasion, décide ensuite." },
                { n: "02", title: "Revends ce qui dort dans ton sac.", desc: "Ce bois abandonné depuis 6 mois ? Quelqu'un en rêve. Mise en vente en moins d'une minute." },
                { n: "03", title: "Alerte sur ce que tu cherches.", desc: "MX-P rouge, bon état, sous 25 € — on te prévient dès que ça apparaît." },
              ].map((item) => (
                <div key={item.n} className="flex gap-6 py-7 group">
                  <span className="text-xs font-bold text-lime/60 tabular-nums pt-1 w-6 shrink-0">{item.n}</span>
                  <div>
                    <h3 className="font-bold text-navy dark:text-white text-base mb-1.5 group-hover:text-lime transition-colors">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-navy-100/50 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <RecentlyViewed />

      {/* CTA */}
      <section className="relative py-20 bg-navy text-white text-center overflow-hidden">
        <LoopTrajectory className="absolute inset-0 w-full h-full opacity-20 pointer-events-none scale-x-[-1]" />
        <div className="relative max-w-xl mx-auto px-4">
          <p className="text-3xl sm:text-4xl font-black mb-3">T&apos;as du matos qui dort ?</p>
          <p className="text-white/50 mb-8">Mets-le en vente en moins d&apos;une minute. On s&apos;occupe de trouver l&apos;acheteur.</p>
          <Link href="/vendre" className="group bg-lime hover:bg-lime-dark text-navy font-bold px-8 py-3.5 rounded-xl transition-colors inline-flex items-center gap-2">
            Vendre maintenant
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}
