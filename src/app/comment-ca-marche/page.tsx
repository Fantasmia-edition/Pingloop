import type { Metadata } from "next";
import Link from "next/link";
import { Construction, ShieldCheck, PackageX, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Comment ça marche — PingLoop",
  description: "Achète et vends ton matériel de tennis de table en toute sécurité. Guide complet pour acheteurs et vendeurs sur PingLoop.",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pingloop.fr";

export default function CommentCaMarchePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      <div className="mb-10">
        <p className="text-xs font-bold tracking-widest uppercase text-lime mb-3">Guide</p>
        <h1 className="text-4xl font-bold text-navy dark:text-white leading-tight mb-4">
          Comment ça marche ?
        </h1>
        <p className="text-gray-500 dark:text-navy-100/60 text-lg leading-relaxed">
          PingLoop est un marché entre pongistes. Pas d&apos;intermédiaire commercial, pas de stock — des joueurs qui échangent du matos entre eux.
        </p>
        <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
          <Construction className="w-5 h-5 shrink-0 text-amber-700 dark:text-amber-300" strokeWidth={2} />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>PingLoop est en version bêta.</strong> Seule la remise en main propre est disponible pour l&apos;instant — la livraison à domicile arrive très bientôt. Un bug, une idée ? Écris-nous à support@pingloop.fr.
          </p>
        </div>
      </div>

      {/* Acheteurs */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-6 pb-3 border-b border-gray-100 dark:border-navy-700">
          Pour les acheteurs
        </h2>
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-navy-700">
          {[
            {
              n: "01",
              title: "Parcours les annonces",
              desc: "Filtre par type (bois, revêtement, raquette), état, prix maximum. Toutes les annonces sont postées par de vrais joueurs qui ont utilisé le matos.",
            },
            {
              n: "02",
              title: "Contacte le vendeur",
              desc: "Envoie un message directement depuis l'annonce. Tu peux aussi faire une contre-offre si le prix ne te convient pas — le vendeur peut accepter, décliner, ou contre-proposer.",
            },
            {
              n: "03",
              title: "Paye en sécurité",
              desc: "Le paiement passe par Stripe ou PayPal — tes coordonnées bancaires ne sont jamais transmises au vendeur. Pour l'instant, seule la remise en main propre est disponible ; la livraison à domicile (La Poste) arrive très bientôt.",
            },
            {
              n: "04",
              title: "Reçois ton matos",
              desc: "Le vendeur expédie dès le paiement confirmé. En cas de problème (article non conforme, non reçu), contacte-nous à support@pingloop.fr — on intervient.",
            },
          ].map((s) => (
            <div key={s.n} className="flex gap-6 py-6">
              <span className="text-xs font-bold text-lime/60 tabular-nums pt-1 w-6 shrink-0">{s.n}</span>
              <div>
                <h3 className="font-bold text-navy dark:text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-navy-100/60 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vendeurs */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-6 pb-3 border-b border-gray-100 dark:border-navy-700">
          Pour les vendeurs
        </h2>
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-navy-700">
          {[
            {
              n: "01",
              title: "Publie ton annonce en moins d'une minute",
              desc: "Sélectionne ton matériel dans la base ITTF (1 616 revêtements référencés), ajoute des photos et un prix. L'annonce est en ligne immédiatement.",
            },
            {
              n: "02",
              title: "Gère tes offres et messages",
              desc: "Tu reçois une notification (et un email) dès qu'un acheteur te contacte. Tu peux accepter, refuser ou faire une contre-offre directement depuis l'annonce.",
            },
            {
              n: "03",
              title: "Expédie ou remets en main propre",
              desc: "Pour l'instant, toutes les ventes se font en remise en main propre : une fois le paiement confirmé, convenez d'un lieu et d'un horaire via la messagerie. La livraison à domicile (La Poste) arrive très bientôt.",
            },
            {
              n: "04",
              title: "Marque l'annonce comme vendue",
              desc: "L'annonce disparaît automatiquement après le paiement. Si tu as vendu en dehors de PingLoop, marque-la manuellement dans 'Mes annonces'.",
            },
          ].map((s) => (
            <div key={s.n} className="flex gap-6 py-6">
              <span className="text-xs font-bold text-lime/60 tabular-nums pt-1 w-6 shrink-0">{s.n}</span>
              <div>
                <h3 className="font-bold text-navy dark:text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-navy-100/60 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Protection */}
      <section className="mb-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-navy dark:text-white mb-4">Protection des acheteurs</h2>
        <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-navy-100/70 leading-relaxed">
          <p className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
            <span><strong>Paiement sécurisé</strong> — tous les paiements passent par Stripe. Tes coordonnées bancaires ne sont jamais transmises au vendeur.</span>
          </p>
          <p className="flex items-start gap-2">
            <PackageX className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
            <span><strong>Article non conforme</strong> — si l&apos;article reçu ne correspond pas à la description, contacte-nous à <a href="mailto:support@pingloop.fr" className="text-navy dark:text-lime font-semibold">support@pingloop.fr</a> dans les 48h suivant la réception.</span>
          </p>
          <p className="flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
            <span><strong>Article non reçu</strong> — en cas de non-livraison, on ouvre une investigation et tu es remboursé.</span>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-6 pb-3 border-b border-gray-100 dark:border-navy-700">
          Questions fréquentes
        </h2>
        <div className="flex flex-col gap-5">
          {[
            {
              q: "PingLoop prend-il une commission ?",
              a: "Oui, une petite commission de service est incluse dans le prix affiché — tu ne paies rien de plus que ce que tu vois.",
            },
            {
              q: "Comment sont vérifiées les annonces ?",
              a: "Les revêtements sont issus de la base officielle ITTF. Les bois et raquettes sont saisis librement — on compte sur la communauté pour signaler les annonces frauduleuses.",
            },
            {
              q: "Que faire si je ne suis pas satisfait du matos reçu ?",
              a: "Contacte-nous dans les 48h à support@pingloop.fr avec des photos. On arbitre et rembourse si l'article ne correspond pas à l'annonce.",
            },
            {
              q: "Puis-je vendre sans créer de compte ?",
              a: "Non, un compte est nécessaire pour mettre en vente — ça permet d'identifier les vendeurs et de garantir la traçabilité des transactions.",
            },
            {
              q: "La remise en main propre est-elle sûre ?",
              a: "Elle n'est pas couverte par la protection acheteur de PingLoop car le paiement se fait hors plateforme. On recommande de se retrouver dans un lieu public.",
            },
          ].map((faq) => (
            <div key={faq.q} className="border-b border-gray-100 dark:border-navy-700 pb-5 last:border-0">
              <p className="font-bold text-navy dark:text-white text-sm mb-1.5">{faq.q}</p>
              <p className="text-sm text-gray-500 dark:text-navy-100/60 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/annonces" className="flex-1 bg-navy dark:bg-lime text-white dark:text-navy font-bold py-3.5 rounded-xl text-center text-sm transition-colors hover:opacity-90">
          Voir les annonces →
        </Link>
        <Link href="/vendre" className="flex-1 border-2 border-navy dark:border-lime text-navy dark:text-lime font-bold py-3.5 rounded-xl text-center text-sm hover:bg-navy/5 dark:hover:bg-lime/10 transition-colors">
          Mettre en vente
        </Link>
      </div>

    </div>
  );
}
