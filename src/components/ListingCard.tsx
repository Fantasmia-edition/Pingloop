import { Listing, CONDITION_LABELS, CONDITION_COLORS, PIMPLE_LABELS } from "@/types";

interface Props {
  listing: Listing;
}

export default function ListingCard({ listing }: Props) {
  const colorDot: Record<string, string> = {
    Red: "bg-red-500",
    Black: "bg-gray-900",
    Blue: "bg-blue-500",
    Green: "bg-green-500",
    Pink: "bg-pink-400",
    Violet: "bg-violet-500",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
            {listing.category === "rubber" ? "Revêtement" : "Bois"}
          </span>
          <h3 className="font-bold text-gray-900 text-base leading-tight">
            {listing.brand} {listing.name}
          </h3>
        </div>
        <p className="text-xl font-black text-gray-900 whitespace-nowrap">{listing.price} €</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
          {CONDITION_LABELS[listing.condition]}
        </span>
        {listing.pimple_type && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {PIMPLE_LABELS[listing.pimple_type]}
          </span>
        )}
        {listing.color && (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            <span className={`w-2.5 h-2.5 rounded-full ${colorDot[listing.color] ?? "bg-gray-400"}`} />
            {listing.color === "Red" ? "Rouge" : listing.color === "Black" ? "Noir" : listing.color}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 line-clamp-2">{listing.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
        <span>{listing.seller} · {listing.location}</span>
        <span>{new Date(listing.created_at).toLocaleDateString("fr-FR")}</span>
      </div>
    </div>
  );
}
