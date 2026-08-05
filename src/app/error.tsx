"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-black text-lime mb-4">Oups</p>
      <h1 className="text-2xl font-black text-navy dark:text-white mb-3">
        Une erreur est survenue
      </h1>
      <p className="text-gray-500 dark:text-navy-100/60 mb-8">
        Quelque chose s&apos;est mal passé de notre côté. Réessaie, ou contacte-nous si ça persiste.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={reset}
          className="bg-navy dark:bg-lime text-white dark:text-navy font-black py-3 px-6 rounded-xl text-sm transition-colors hover:opacity-90"
        >
          Réessayer
        </button>
        <a
          href="mailto:support@pingloop.fr"
          className="border-2 border-navy dark:border-lime text-navy dark:text-lime font-bold py-3 px-6 rounded-xl text-sm hover:bg-navy/5 dark:hover:bg-lime/10 transition-colors"
        >
          Contacter le support
        </a>
      </div>
    </div>
  );
}
