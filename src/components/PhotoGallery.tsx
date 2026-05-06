"use client";
import { useState, useRef } from "react";

interface Props {
  photos: string[];
  alt: string;
  emoji: string;
}

export default function PhotoGallery({ photos, alt, emoji }: Props) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      if (dx > 0) setCurrent((c) => Math.min(c + 1, photos.length - 1));
      else setCurrent((c) => Math.max(c - 1, 0));
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 dark:bg-navy-800 flex items-center justify-center border border-gray-200 dark:border-navy-700">
        <span className="text-7xl">{emoji}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-navy-700 select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[current]}
          alt={`${alt} — photo ${current + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {photos.length > 1 && (
          <>
            {current > 0 && (
              <button
                onClick={() => setCurrent((c) => c - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-xl leading-none font-bold transition-colors"
                aria-label="Photo précédente"
              >
                ‹
              </button>
            )}
            {current < photos.length - 1 && (
              <button
                onClick={() => setCurrent((c) => c + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-xl leading-none font-bold transition-colors"
                aria-label="Photo suivante"
              >
                ›
              </button>
            )}
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === current ? "bg-white w-5" : "bg-white/50 w-2 hover:bg-white/80"
                  }`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
            {/* Counter badge */}
            <div className="absolute top-3 right-3 bg-black/40 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {current + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Photo ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`w-16 h-16 shrink-0 object-cover rounded-lg border-2 cursor-pointer transition-all ${
                i === current
                  ? "border-lime opacity-100"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
