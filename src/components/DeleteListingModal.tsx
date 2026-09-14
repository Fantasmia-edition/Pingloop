"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { OFF_PLATFORM_SUPPORT_AMOUNTS } from "@/lib/config";
import { HeartHandshake, X } from "lucide-react";

const OffPlatformSupportModal = dynamic(() => import("./OffPlatformSupportModal"), { ssr: false });

interface Props {
  listingId: string;
  brand: string;
  name: string;
  price: number;
  onClose: () => void;
  onDeleted: () => void;
}

type Step = "ask" | "support" | "deleting";

export default function DeleteListingModal({ listingId, brand, name, price, onClose, onDeleted }: Props) {
  const [step, setStep] = useState<Step>("ask");
  const [soldElsewhere, setSoldElsewhere] = useState(false);
  const [payAmount, setPayAmount] = useState<number | null>(null);

  async function finalize(supportAmount: number) {
    setStep("deleting");
    const supabase = createClient();

    if (soldElsewhere) {
      await supabase.from("off_platform_sales").insert({
        listing_id: listingId,
        brand,
        name,
        price,
        support_amount: supportAmount,
      });
    }

    await supabase.from("listings").delete().eq("id", listingId);
    onDeleted();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-black text-gray-900 dark:text-white text-base">
            Supprimer &laquo;&nbsp;{brand} {name}&nbsp;&raquo;
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-navy-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {step === "ask" && (
          <>
            <p className="text-sm text-gray-600 dark:text-navy-100/70">
              As-tu vendu cette raquette en dehors de PingLoop ?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setSoldElsewhere(true); setStep("support"); }}
                className="w-full bg-navy dark:bg-lime text-white dark:text-navy font-bold py-3 rounded-xl text-sm transition-colors hover:opacity-90"
              >
                Oui, vendue ailleurs
              </button>
              <button
                onClick={() => finalize(0)}
                className="w-full border border-gray-200 dark:border-navy-700 text-gray-600 dark:text-navy-100/70 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
              >
                Non, je supprime juste
              </button>
            </div>
          </>
        )}

        {step === "support" && (
          <>
            <div className="bg-lime-50 dark:bg-lime/10 border border-lime/30 rounded-xl p-3.5 flex gap-2.5 items-start">
              <HeartHandshake className="w-4 h-4 shrink-0 mt-0.5 text-navy dark:text-lime" strokeWidth={2} />
              <p className="text-xs text-navy dark:text-lime leading-relaxed">
                Merci de nous le dire ! PingLoop reste gratuit à utiliser même quand la vente se fait hors plateforme —
                un petit geste optionnel nous aide à continuer à faire tourner le site et à reverser aux clubs.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {OFF_PLATFORM_SUPPORT_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setPayAmount(a)}
                  className="px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-navy-600 text-sm font-bold text-gray-700 dark:text-white hover:border-lime transition-colors"
                >
                  {a} €
                </button>
              ))}
              <button
                onClick={() => finalize(0)}
                className="px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 dark:hover:text-navy-100 transition-colors"
              >
                Non merci
              </button>
            </div>
          </>
        )}

        {step === "deleting" && (
          <p className="py-6 text-center text-gray-400 dark:text-navy-100/50 text-sm">Suppression…</p>
        )}

        {payAmount !== null && (
          <OffPlatformSupportModal
            listingId={listingId}
            amount={payAmount}
            onClose={() => setPayAmount(null)}
            onSuccess={() => finalize(payAmount)}
          />
        )}
      </div>
    </div>
  );
}
