"use client";
import { useRef, useState, useCallback } from "react";

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

export default function PhotoUpload({ photos, onChange, max = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = max - photos.length;
      const toAdd = Array.from(files).slice(0, remaining);
      const urls = toAdd.map((f) => URL.createObjectURL(f));
      onChange([...photos, ...urls]);
    },
    [photos, onChange, max]
  );

  const remove = (idx: number) => {
    URL.revokeObjectURL(photos[idx]);
    onChange(photos.filter((_, i) => i !== idx));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone — only show if slots remain */}
      {photos.length < max && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-lime bg-lime-50"
              : "border-gray-200 hover:border-lime/60 hover:bg-gray-50"
          }`}
        >
          <p className="text-2xl mb-1">📷</p>
          <p className="text-sm font-semibold text-gray-700">
            Clique ou glisse tes photos ici
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            JPG, PNG · max {max} photos · {photos.length}/{max} ajoutées
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((url, idx) => (
            <div key={url} className="relative aspect-square group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1 right-1 bg-gray-900/70 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 bg-lime text-navy text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
