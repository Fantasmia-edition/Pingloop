"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASONS = [
  "Contrefaçon ou matériel non conforme",
  "Annonce trompeuse",
  "Prix suspect / arnaque",
  "Contenu inapproprié",
  "Autre",
];

export default function ReportListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<"ok" | "error" | null>(null);

  async function openModal() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push(`/auth?redirect=/annonces/${listingId}`); return; }
    setOpen(true);
  }

  async function submit() {
    setSending(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, reason, comment: comment.trim() || undefined }),
    });
    setSending(false);
    setResult(res.ok ? "ok" : "error");
  }

  if (!open) {
    return (
      <button
        onClick={openModal}
        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-navy-100 underline underline-offset-2 self-center"
      >
        🚩 Signaler cette annonce
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div
        className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {result === "ok" ? (
          <>
            <p className="font-black text-gray-900 dark:text-white text-lg">Merci, c&apos;est signalé</p>
            <p className="text-sm text-gray-500 dark:text-navy-100/60">On va regarder ça rapidement.</p>
            <button
              onClick={() => setOpen(false)}
              className="bg-navy dark:bg-lime text-white dark:text-navy font-bold py-2.5 rounded-xl text-sm"
            >
              Fermer
            </button>
          </>
        ) : (
          <>
            <h2 className="font-black text-gray-900 dark:text-white text-lg">Signaler cette annonce</h2>
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-gray-700 dark:text-navy-100 cursor-pointer">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="Détails (optionnel)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-200 dark:border-navy-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime resize-none bg-white dark:bg-navy-700 text-gray-900 dark:text-white"
            />
            {result === "error" && (
              <p className="text-xs text-red-500">Une erreur est survenue, réessaie.</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-200 dark:border-navy-600 text-gray-600 dark:text-navy-100 font-semibold py-3 rounded-xl text-sm"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={sending}
                className="flex-1 bg-navy dark:bg-lime text-white dark:text-navy font-black py-3 rounded-xl text-sm disabled:opacity-50"
              >
                {sending ? "Envoi…" : "Signaler"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
