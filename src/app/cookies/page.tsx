import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de cookies — PingLoop",
  description: "Quels cookies utilise PingLoop et pourquoi.",
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-navy dark:text-white mb-8">Politique de cookies</h1>

      <div className="flex flex-col gap-8 text-sm text-gray-600 dark:text-navy-100/70 leading-relaxed">
        <section>
          <p>
            PingLoop n&apos;utilise aucun cookie publicitaire ni traceur tiers à des fins
            statistiques ou marketing. Les seuls cookies et stockages utilisés sont
            strictement nécessaires au fonctionnement du site, et ne requièrent donc pas de
            consentement préalable au titre de la réglementation ePrivacy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Cookies déposés</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-navy-700">
                  <th className="py-2 pr-4 font-bold text-navy dark:text-white">Nom</th>
                  <th className="py-2 pr-4 font-bold text-navy dark:text-white">Finalité</th>
                  <th className="py-2 font-bold text-navy dark:text-white">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-navy-800">
                  <td className="py-2 pr-4">sb-*-auth-token</td>
                  <td className="py-2 pr-4">Maintient ta session connectée (géré par Supabase)</td>
                  <td className="py-2">Jusqu&apos;à déconnexion / expiration</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Stockage local (localStorage)</h2>
          <p>
            Ton choix de thème (clair / sombre) est enregistré localement dans ton
            navigateur (localStorage), sans être transmis à nos serveurs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Gérer les cookies</h2>
          <p>
            Tu peux à tout moment supprimer ces cookies depuis les paramètres de ton
            navigateur. Cela te déconnectera du site.
          </p>
        </section>
      </div>
    </div>
  );
}
