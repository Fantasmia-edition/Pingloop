"use client";
import { useState } from "react";

interface Props {
  listingId: string;
  sellerName: string;
}

export default function ReviewForm({ listingId, sellerName }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function submit() {
    if (!rating) return;
    setState("submitting");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId, rating, comment }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
        <p className="text-sm font-semibold text-green-700 dark:text-green-400">Avis publié, merci !</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-sm font-bold text-navy dark:text-white">Laisser un avis à {sellerName}</p>

      <div className="flex gap-1">
        {[1,2,3,4,5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <span className={(hovered || rating) >= star ? "text-yellow-400" : "text-gray-200 dark:text-navy-600"}>★</span>
          </button>
        ))}
      </div>

      <textarea
        rows={2}
        placeholder="Un commentaire ? (optionnel)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border border-gray-200 dark:border-navy-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-navy-900 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-lime"
      />

      {state === "error" && <p className="text-xs text-red-500">Erreur — tu as peut-être déjà laissé un avis.</p>}

      <button
        onClick={submit}
        disabled={!rating || state === "submitting"}
        className="bg-lime hover:bg-lime-dark disabled:opacity-40 text-navy font-bold py-2 rounded-lg text-sm transition-colors"
      >
        {state === "submitting" ? "Envoi…" : "Publier l'avis"}
      </button>
    </div>
  );
}
