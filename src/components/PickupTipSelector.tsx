"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { PICKUP_TIP_AMOUNTS } from "@/lib/config";

const TipCheckoutModal = dynamic(() => import("./TipCheckoutModal"), { ssr: false });

interface Props {
  listingId: string;
  sellerClub?: string | null;
}

export default function PickupTipSelector({ listingId, sellerClub }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-xs text-center text-green-600 dark:text-green-400 font-semibold py-1">
        🙏 Merci pour ton soutien !
      </p>
    );
  }

  if (dismissed) return null;

  return (
    <div className="border border-gray-200 dark:border-navy-700 rounded-xl p-3.5 flex flex-col gap-2.5 bg-gray-50 dark:bg-navy-800/60">
      <div>
        <p className="text-sm font-bold text-gray-800 dark:text-white">
          Soutenir PingLoop{sellerClub ? ` et ${sellerClub}` : ""} ?
        </p>
        <p className="text-xs text-gray-500 dark:text-navy-100/60 mt-1 leading-relaxed">
          Complètement optionnel. Le vendeur reçoit le prix de l&apos;article directement de toi lors
          de la remise en main propre — PingLoop ne prend aucune commission dessus. Si tu veux
          soutenir la plateforme, la moitié de ce petit geste va à PingLoop, l&apos;autre moitié{" "}
          {sellerClub ? `au club du vendeur (${sellerClub})` : "aux clubs des vendeurs"}.
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {PICKUP_TIP_AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => setSelectedAmount(a)}
            className="px-3.5 py-2 rounded-lg border-2 border-gray-200 dark:border-navy-600 text-sm font-bold text-gray-700 dark:text-white hover:border-lime transition-colors"
          >
            {a.toString().replace(".", ",")} €
          </button>
        ))}
        <button
          onClick={() => setDismissed(true)}
          className="px-3.5 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600 dark:hover:text-navy-100 transition-colors"
        >
          Non merci
        </button>
      </div>

      {selectedAmount !== null && (
        <TipCheckoutModal
          listingId={listingId}
          amount={selectedAmount}
          onClose={() => setSelectedAmount(null)}
          onSuccess={() => { setSelectedAmount(null); setDone(true); }}
        />
      )}
    </div>
  );
}
