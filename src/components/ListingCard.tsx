import Link from "next/link";
import { Listing, CONDITION_LABELS, CONDITION_COLORS, PIMPLE_LABELS, CATEGORY_CONFIG } from "@/types";

interface Props {
  listing: Listing & { photos?: string[]; seller_name?: string; sold_at?: string | null };
}

export default function ListingCard({ listing }: Props) {
  const colorDot: Record<string, string> = {
    Red: "bg-red-500", Black: "bg-gray-900", Blue: "bg-blue-500",
    Green: "bg-green-500", Pink: "bg-pink-400", Violet: "bg-violet-500",
  };

  const mainPhoto = listing.photos?.[0];
  const isSold = !!listing.sold_at;
  const sellerDisplay = listing.seller_name ?? listing.seller ?? "—";

  return (
    <Link
      href={`/annonces/${listing.id}`}
      className={`bg-white rounded-xl border hover:shadow-md transition-all flex flex-col overflow-hidden ${isSold ? "opacity-60 border-gray-200" : "border-gray-200 hover:border-orange-300"}`}
    >
      {/* Photo ou placeholder */}
      <div className="aspect-video w-full bg-gray-100 flex items-center justify-center relative">
        {mainPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mainPhoto} alt={`${listing.brand} ${listing.name}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">{CATEGORY_CONFIG[listing.category]?.emoji ?? "📦"}</span>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-black px-3 py-1 rounded-full">VENDU</span>
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white/90 text-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {CATEGORY_CONFIG[listing.category]?.label ?? listing.category}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-gray-900 text-base leading-tight">
            {listing.brand} {listing.name}
          </h3>
          <p className="text-xl font-black text-gray-900 whitespace-nowrap">{listing.price} €</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
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

        <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
          <span>{sellerDisplay} · {listing.location}</span>
          <span>{new Date(listing.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </Link>
  );
}
