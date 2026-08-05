import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-black text-lime mb-4">404</p>
      <h1 className="text-2xl font-black text-navy dark:text-white mb-3">
        Page introuvable
      </h1>
      <p className="text-gray-500 dark:text-navy-100/60 mb-8">
        Cette page n&apos;existe pas ou plus. L&apos;annonce a peut-être été vendue ou supprimée.
      </p>
      <Link
        href="/annonces"
        className="inline-block bg-navy dark:bg-lime text-white dark:text-navy font-black py-3 px-6 rounded-xl text-sm transition-colors hover:opacity-90"
      >
        Voir les annonces →
      </Link>
    </div>
  );
}
