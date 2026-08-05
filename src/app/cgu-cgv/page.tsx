import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGU / CGV — PingLoop",
  description: "Conditions générales d'utilisation et de vente de PingLoop.",
};

export default function CguCgvPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-navy dark:text-white mb-2">
        Conditions générales d&apos;utilisation et de vente
      </h1>
      <p className="text-xs text-gray-400 dark:text-navy-100/50 mb-8">
        Dernière mise à jour : [À COMPLÉTER]
      </p>

      <div className="flex flex-col gap-8 text-sm text-gray-600 dark:text-navy-100/70 leading-relaxed">
        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">1. Objet</h2>
          <p>
            PingLoop est une place de marché en ligne permettant à des particuliers
            (« Vendeurs ») de proposer à la vente du matériel de tennis de table à d&apos;autres
            particuliers (« Acheteurs »). Les présentes conditions générales d&apos;utilisation
            et de vente (« CGU/CGV ») régissent l&apos;accès et l&apos;usage du site ainsi que les
            transactions qui y sont réalisées.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">2. Rôle de PingLoop</h2>
          <p>
            PingLoop agit uniquement en tant qu&apos;intermédiaire technique mettant en relation
            Acheteurs et Vendeurs. PingLoop n&apos;est ni acheteur, ni vendeur, ni propriétaire
            des articles mis en vente, et n&apos;est pas partie au contrat de vente conclu entre
            l&apos;Acheteur et le Vendeur.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">3. Inscription et compte</h2>
          <p>
            La création d&apos;un compte est requise pour publier une annonce, contacter un
            vendeur ou effectuer un achat. L&apos;utilisateur s&apos;engage à fournir des informations
            exactes et à ne pas usurper l&apos;identité d&apos;un tiers. Chaque utilisateur est
            responsable de la confidentialité de ses identifiants.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">4. Publication des annonces</h2>
          <p>
            Le Vendeur garantit être propriétaire de l&apos;article mis en vente, que celui-ci est
            conforme à sa description et aux photos publiées, et qu&apos;il n&apos;est pas contrefait,
            volé ou interdit à la vente. PingLoop se réserve le droit de retirer toute annonce
            non conforme aux présentes CGU, sans préavis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">5. Prix et commission</h2>
          <p>
            Le prix affiché sur chaque annonce inclut une commission de service PingLoop
            (7 % du prix de vente), prélevée automatiquement au moment du paiement. Le
            Vendeur reçoit le prix de vente net de cette commission sur son compte
            Stripe Connect ou PayPal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">6. Paiement</h2>
          <p>
            Les paiements sont traités par les prestataires tiers Stripe et PayPal.
            PingLoop ne collecte ni ne stocke aucune donnée bancaire. Le paiement est
            capturé au moment de l&apos;achat ; les fonds sont reversés au Vendeur selon les
            modalités de Stripe Connect / PayPal Commerce Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">7. Livraison</h2>
          <p>
            L&apos;Acheteur choisit entre une livraison à domicile (à la charge du Vendeur, frais
            de port inclus dans le prix affiché) ou une remise en main propre convenue
            directement entre les parties. La remise en main propre s&apos;effectue hors du
            cadre de la protection acheteur décrite à l&apos;article 8.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">8. Protection acheteur et litiges</h2>
          <p>
            En cas d&apos;article non conforme à sa description ou non reçu (livraison à
            domicile uniquement), l&apos;Acheteur dispose de 48h après réception (ou après la
            date de livraison estimée) pour contacter{" "}
            <a href="mailto:support@pingloop.fr" className="text-navy dark:text-lime font-semibold">
              support@pingloop.fr
            </a>
            . PingLoop examine la réclamation et peut procéder à un remboursement si la
            non-conformité est avérée.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">9. Rétractation</h2>
          <p>
            Les transactions ayant lieu entre particuliers, le droit de rétractation prévu
            par le Code de la consommation ne s&apos;applique pas de plein droit, sauf accord
            contraire entre les parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">10. Responsabilité</h2>
          <p>
            PingLoop met en œuvre des moyens raisonnables pour assurer la sécurité et la
            disponibilité du site, sans garantie de continuité absolue. PingLoop n&apos;est pas
            responsable des transactions elles-mêmes, de la qualité des articles vendus, ni
            des échanges entre utilisateurs en dehors des cas prévus à l&apos;article 8.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">11. Modification des CGU/CGV</h2>
          <p>
            PingLoop peut modifier les présentes conditions à tout moment. Les utilisateurs
            seront informés de toute modification substantielle par email ou notification
            sur le site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-navy dark:text-white mb-3">12. Droit applicable</h2>
          <p>
            Les présentes CGU/CGV sont soumises au droit français. Tout litige relève, à
            défaut de résolution amiable, des tribunaux compétents.
          </p>
        </section>
      </div>
    </div>
  );
}
