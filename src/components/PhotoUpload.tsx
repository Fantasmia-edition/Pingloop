"use client";
import { useRef, useState, useCallback } from "react";
import { Camera, Loader2 } from "lucide-react";

const MAX_SIZE = 1200; // px côté max
const QUALITY = 0.82;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

export default function PhotoUpload({ photos, onChange, max = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remaining = max - photos.length;
      const toAdd = Array.from(files).slice(0, remaining);
      setCompressing(true);
      const compressed = await Promise.all(toAdd.map(compressImage));
      setCompressing(false);
      onChange([...photos, ...compressed]);
    },
    [photos, onChange, max]
  );

  const remove = (idx: number) => {
    onChange(photos.filter((_, i) => i !== idx));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-3">
      {photos.length < max && (
        <div
          onClick={() => !compressing && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            compressing
              ? "opacity-60 cursor-wait border-gray-200"
              : dragging
                ? "border-lime bg-lime-50 cursor-pointer"
                : "border-gray-200 hover:border-lime/60 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <div className="mb-1 flex justify-center text-gray-400">
            {compressing ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={2} /> : <Camera className="w-6 h-6" strokeWidth={1.75} />}
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {compressing ? "Compression en cours…" : "Clique ou glisse tes photos ici"}
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

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((url, idx) => (
            <div key={idx} className="relative aspect-square group">
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
