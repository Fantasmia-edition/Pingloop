import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — PingLoop",
  description: "Mentions légales du site PingLoop.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-navy dark:text-white mb-8">Mentions légales</h1>

      <div className="flex flex-col gap-8 text-sm text-gray-600 dark:text-navy-100/70 leading-relaxed">
        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Éditeur du site</h2>
          <p>
            Le site PingLoop est édité par [À COMPLÉTER : nom et prénom ou raison sociale],
            [À COMPLÉTER : statut juridique — ex. entreprise individuelle / SASU / SAS],
            immatriculé·e sous le numéro SIRET [À COMPLÉTER],
            dont le siège est situé [À COMPLÉTER : adresse complète].
          </p>
          <p className="mt-2">
            Numéro de TVA intracommunautaire : [À COMPLÉTER si applicable]
          </p>
          <p className="mt-2">
            Contact : <a href="mailto:support@pingloop.fr" className="text-navy dark:text-lime font-semibold">support@pingloop.fr</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Directeur de la publication</h2>
          <p>[À COMPLÉTER : nom et prénom]</p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Hébergement</h2>
          <p>
            Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
          </p>
          <p className="mt-2">
            Les données (comptes, annonces, messages) sont hébergées par Supabase Inc.,
            970 Toa Payoh North #07-04, Singapour.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Activité</h2>
          <p>
            PingLoop est une place de marché en ligne mettant en relation des particuliers
            souhaitant acheter et vendre du matériel de tennis de table d&apos;occasion ou neuf.
            PingLoop n&apos;est pas partie aux transactions conclues entre acheteurs et vendeurs
            et agit uniquement en tant qu&apos;intermédiaire technique.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des éléments du site (charte graphique, textes, logo, base de données)
            est protégé par le droit de la propriété intellectuelle. Toute reproduction non
            autorisée est interdite. Le contenu des annonces (photos, descriptions) reste la
            propriété de leurs auteurs respectifs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">Médiation de la consommation</h2>
          <p>
            Conformément à l&apos;article L.616-1 du Code de la consommation, en cas de litige,
            l&apos;utilisateur peut recourir gratuitement à un médiateur de la consommation.
            [À COMPLÉTER : nom et coordonnées du médiateur choisi].
          </p>
        </section>
      </div>
    </div>
  );
}
