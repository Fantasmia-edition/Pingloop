import Link from "next/link";
import { Listing, CONDITION_LABELS, CONDITION_COLORS, PIMPLE_LABELS, CATEGORY_CONFIG, SHIPPING_PRICES } from "@/types";
import { HOME_SHIPPING_ENABLED } from "@/lib/config";
import Badge from "@/components/Badge";
import { CategoryIcon, ShippingIcon } from "@/components/icons";

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
  const isNew = !isSold && (Date.now() - new Date(listing.created_at).getTime()) < 48 * 60 * 60 * 1000;

  return (
    <Link
      href={`/annonces/${listing.id}`}
      className={`bg-white dark:bg-navy-800 rounded-2xl border transition-all flex flex-col overflow-hidden group ${
        isSold
          ? "opacity-60 border-gray-200 dark:border-navy-700"
          : "border-gray-200 dark:border-navy-700 hover:border-lime dark:hover:border-lime hover:shadow-lg hover:-translate-y-0.5"
      }`}
    >
      {/* Photo */}
      <div className="aspect-video w-full bg-gray-100 dark:bg-navy-700 flex items-center justify-center relative overflow-hidden">
        {mainPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainPhoto}
            alt={`${listing.brand} ${listing.name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-gray-300 dark:text-navy-600">
            <CategoryIcon category={listing.category} className="w-10 h-10" />
          </span>
        )}
        {isSold && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">VENDU</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant="tag" icon={<CategoryIcon category={listing.category} className="w-3 h-3" />}>
            {CATEGORY_CONFIG[listing.category]?.label ?? listing.category}
          </Badge>
          {isNew && <Badge variant="solid">NOUVEAU</Badge>}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-navy dark:text-white text-base leading-tight">
            {listing.brand} {listing.name}
          </h3>
          <p className="text-xl font-black text-navy dark:text-lime whitespace-nowrap">{listing.price} €</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
            {CONDITION_LABELS[listing.condition]}
          </span>
          {listing.pimple_type && (
            <Badge>{PIMPLE_LABELS[listing.pimple_type]}</Badge>
          )}
          {listing.color && (
            <Badge icon={<span className={`w-2.5 h-2.5 rounded-full ${colorDot[listing.color] ?? "bg-gray-400"}`} />}>
              {listing.color === "Red" ? "Rouge" : listing.color === "Black" ? "Noir" : listing.color}
            </Badge>
          )}
        </div>

        {/* Shipping pills */}
        {((HOME_SHIPPING_ENABLED && listing.shipping_home) || listing.pickup_available) && (
          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-gray-500 dark:text-navy-100/50">
            {HOME_SHIPPING_ENABLED && listing.shipping_home && (
              <Badge variant="outline" icon={<ShippingIcon method="home" className="w-3 h-3" />}>
                La Poste {SHIPPING_PRICES.home} €
              </Badge>
            )}
            {listing.pickup_available && (
              <Badge variant="outline" icon={<ShippingIcon method="pickup" className="w-3 h-3" />}>
                Main propre
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-navy-100/50 mt-auto pt-2 border-t border-gray-100 dark:border-navy-700">
          <span className="font-medium text-gray-500 dark:text-navy-100/70">{sellerDisplay}</span>
          <span>{new Date(listing.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </Link>
  );
}
