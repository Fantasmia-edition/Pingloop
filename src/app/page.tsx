import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ListingCard from "@/components/ListingCard";
import { Listing } from "@/types";

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
      <section className="bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-lime text-sm font-semibold px-3 py-1 rounded-full mb-6">
            🏓 Le marché des pongistes
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-5">
            Du matos de qualité,<br />
            <span className="text-lime">sans te ruiner.</span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
            Bois, revêtements, raquettes complètes — d&apos;occasion, entre pongistes qui savent de quoi ils parlent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/annonces" className="bg-lime hover:bg-lime-dark text-navy font-black px-8 py-3.5 rounded-xl transition-colors text-base">
              Voir les annonces →
            </Link>
            <Link href="/vendre" className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-base">
              Mettre en vente
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-navy-800 py-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 text-center text-white">
          {[
            { value: "1 616", label: "revêtements ITTF" },
            { value: "142", label: "marques référencées" },
            { value: "60 sec", label: "pour mettre en vente" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-black text-lime">{s.value}</p>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      <section className="py-14 bg-white dark:bg-navy-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-navy">Dernières annonces</h2>
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
              <p className="text-4xl mb-3">🏓</p>
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
      <section className="py-14 bg-navy-50 dark:bg-navy">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-black text-navy text-center mb-10">Pourquoi PingLoop ?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: "💸", title: "Un Tenergy à 30€ ? C'est possible.", desc: "Arrête de claquer 60€ dans un revêtement neuf. Teste d'abord via l'occasion, décide ensuite." },
              { emoji: "♻️", title: "Revends ce qui prend la poussière.", desc: "Ce bois qui dort dans ton sac depuis 6 mois ? Quelqu'un en rêve. Mets-le en vente en 60 secondes." },
              { emoji: "🔔", title: "Alerte sur ce que tu cherches.", desc: "Tu veux un MX-P rouge, bon état, sous 25€ ? On te prévient dès que quelqu'un le met en vente." },
            ].map((item) => (
              <div key={item.title} className="bg-white dark:bg-navy-800 rounded-2xl p-6 border border-navy-100 dark:border-navy-700">
                <div className="w-12 h-12 bg-lime-50 rounded-xl flex items-center justify-center text-2xl mb-4">{item.emoji}</div>
                <h3 className="font-black text-navy mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <p className="text-3xl font-black mb-3">T&apos;as du matos qui dort ?</p>
          <p className="text-white/50 mb-8">Mets-le en vente en moins d&apos;une minute. On s&apos;occupe de trouver l&apos;acheteur.</p>
          <Link href="/vendre" className="bg-lime hover:bg-lime-dark text-navy font-black px-8 py-3.5 rounded-xl transition-colors inline-block">
            Vendre maintenant →
          </Link>
        </div>
      </section>
    </div>
  );
}
