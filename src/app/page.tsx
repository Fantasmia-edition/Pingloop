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
    .limit(3);

  const recent = (data as Listing[]) ?? [];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 text-sm font-semibold px-3 py-1 rounded-full mb-6">
            🏓 Le marché des pongistes
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-4">
            Du matos de qualité,<br />
            <span className="text-orange-500">sans te ruiner.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Bois et revêtements d&apos;occasion entre pongistes. Revends ce que tu n&apos;utilises plus,
            trouve ce que tu cherches — le tout entre joueurs qui savent de quoi ils parlent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/annonces" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors text-base">
              Voir les annonces
            </Link>
            <Link href="/vendre" className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3 rounded-xl transition-colors text-base">
              Mettre en vente
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-orange-500 py-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 text-center text-white">
          {[
            { value: "1 616", label: "revêtements homologués ITTF" },
            { value: "142", label: "marques référencées" },
            { value: "60 sec", label: "pour mettre en vente" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-black">{s.value}</p>
              <p className="text-xs sm:text-sm opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why PingLoop */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-10">Pourquoi PingLoop ?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: "💸", title: "Un Tenergy à 30€ ? C'est possible.", desc: "Arrête de claquer 60€ dans un revêtement neuf que tu vas peut-être pas aimer. Teste d'abord, décide ensuite." },
              { emoji: "♻️", title: "Revends ce qui prend la poussière.", desc: "Ce bois qui dort dans ton sac depuis 6 mois ? Quelqu'un quelque part en rêve. Mets-le en vente en 60 secondes." },
              { emoji: "🔔", title: "Alerte sur ce que tu cherches.", desc: "Tu veux un MX-P en rouge, bon état, sous 25€ ? On te prévient dès que quelqu'un le met en vente." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent listings */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-gray-900">Dernières annonces</h2>
            <Link href="/annonces" className="text-sm font-semibold text-orange-500 hover:underline">
              Tout voir →
            </Link>
          </div>
          {recent.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {recent.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <p className="text-3xl mb-2">🏓</p>
              <p className="font-semibold text-gray-600">Sois le premier à vendre !</p>
              <Link href="/vendre" className="mt-3 inline-block text-orange-500 font-semibold text-sm hover:underline">
                Mettre en vente →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Vendre */}
      <section className="py-14 bg-gray-900 text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <p className="text-3xl font-black mb-3">T&apos;as du matos qui dort ?</p>
          <p className="text-gray-400 mb-6">Mets-le en vente en moins d&apos;une minute. On s&apos;occupe de trouver l&apos;acheteur.</p>
          <Link href="/vendre" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors inline-block">
            Vendre maintenant →
          </Link>
        </div>
      </section>
    </div>
  );
}
