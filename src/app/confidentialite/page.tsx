import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — PingLoop",
  description: "Comment PingLoop collecte, utilise et protège tes données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-navy dark:text-white mb-2">Politique de confidentialité</h1>
      <p className="text-xs text-gray-400 dark:text-navy-100/50 mb-8">
        Dernière mise à jour : [À COMPLÉTER]
      </p>

      <div className="flex flex-col gap-8 text-sm text-gray-600 dark:text-navy-100/70 leading-relaxed">
        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">1. Responsable du traitement</h2>
          <p>
            [À COMPLÉTER : nom / raison sociale], éditeur du site PingLoop (voir{" "}
            <a href="/mentions-legales" className="text-navy dark:text-lime font-semibold">mentions légales</a>),
            est responsable du traitement des données décrites ci-dessous.
            Contact : <a href="mailto:support@pingloop.fr" className="text-navy dark:text-lime font-semibold">support@pingloop.fr</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">2. Données collectées</h2>
          <p className="mb-3">Selon ton usage du site, nous collectons :</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Données de compte : email, mot de passe (chiffré), nom affiché, localisation</li>
            <li>Données d&apos;annonce : photos, description, prix, catégorie du matériel</li>
            <li>Messages échangés avec d&apos;autres utilisateurs via la messagerie interne</li>
            <li>Alertes de recherche enregistrées (email, critères de recherche)</li>
            <li>Avis laissés après une transaction (note, commentaire)</li>
            <li>
              Identifiants de compte marchand Stripe Connect / PayPal Commerce pour les
              vendeurs (aucune donnée bancaire n&apos;est stockée par PingLoop — ces prestataires
              gèrent directement les paiements)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">3. Finalités</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Créer et gérer ton compte utilisateur</li>
            <li>Publier et afficher les annonces</li>
            <li>Permettre la messagerie entre acheteurs et vendeurs</li>
            <li>Traiter les paiements via nos prestataires (Stripe, PayPal)</li>
            <li>Envoyer les emails transactionnels (confirmation de vente, notifications, alertes) et le digest hebdomadaire</li>
            <li>Assurer la sécurité du site et prévenir la fraude</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">4. Destinataires des données</h2>
          <p className="mb-3">
            Tes données ne sont jamais vendues. Elles peuvent être transmises aux
            prestataires suivants, strictement pour l&apos;exécution du service :
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li><strong>Supabase</strong> — hébergement de la base de données et authentification</li>
            <li><strong>Stripe</strong> et <strong>PayPal</strong> — traitement des paiements et versement aux vendeurs</li>
            <li><strong>Resend</strong> — envoi des emails transactionnels</li>
            <li><strong>Vercel</strong> — hébergement du site</li>
          </ul>
          <p className="mt-3">
            Ton nom affiché, ta localisation et tes annonces sont visibles publiquement sur
            le site. Ton email n&apos;est jamais affiché publiquement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">5. Durée de conservation</h2>
          <p>
            Les données de compte sont conservées tant que le compte est actif. En cas de
            suppression de compte, les données sont supprimées ou anonymisées sous
            [À COMPLÉTER, ex. 30 jours], sauf obligation légale de conservation plus longue
            (ex. données de facturation).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">6. Tes droits</h2>
          <p className="mb-3">
            Conformément au RGPD, tu disposes d&apos;un droit d&apos;accès, de rectification,
            d&apos;effacement, de limitation, d&apos;opposition et de portabilité de tes données.
            Pour exercer ces droits, contacte{" "}
            <a href="mailto:support@pingloop.fr" className="text-navy dark:text-lime font-semibold">support@pingloop.fr</a>.
          </p>
          <p>
            Tu peux aussi introduire une réclamation auprès de la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-navy dark:text-lime font-semibold">
              cnil.fr
            </a>
            ).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">7. Cookies</h2>
          <p>
            Voir notre{" "}
            <a href="/cookies" className="text-navy dark:text-lime font-semibold">politique de cookies</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">8. Sécurité</h2>
          <p>
            Les mots de passe sont chiffrés et l&apos;accès aux données est protégé par des
            règles de sécurité au niveau de la base de données (row-level security), limitant
            l&apos;accès de chaque utilisateur à ses propres données privées.
          </p>
        </section>
      </div>
    </div>
  );
}
