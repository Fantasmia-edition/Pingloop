"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { SHIPPING_PRICES } from "@/types";
import ContactButton from "@/components/ContactButton";
import OffersSection from "@/components/OffersSection";
import FavoriteButton from "@/components/FavoriteButton";

const PaymentOptions = dynamic(() => import("./PaymentOptions"), { ssr: false });

type ShippingMethod = "home" | "pickup";

interface Props {
  listingId: string;
  itemPrice: number;
  sellerId: string;
  sellerName: string;
  listingTitle: string;
  shippingHome: boolean;
  pickupAvailable: boolean;
  currentUserId: string | null;
}

function defaultMethod(home: boolean): ShippingMethod {
  if (home) return "home";
  return "pickup";
}

export default function BuyerActions({
  listingId, itemPrice, sellerId, sellerName, listingTitle,
  shippingHome, pickupAvailable,
  currentUserId,
}: Props) {
  const hasOptions = shippingHome || pickupAvailable;

  const [method, setMethod] = useState<ShippingMethod>(
    defaultMethod(shippingHome)
  );

  const shippingCost = method === "home" ? SHIPPING_PRICES.home : 0;

  const total = itemPrice + shippingCost;

  const options: { key: ShippingMethod; icon: string; label: string; sub: string; price: number }[] = [
    ...(shippingHome    ? [{ key: "home"   as const, icon: "🏠", label: "Envoi par La Poste",    sub: "Colissimo · livré chez vous",    price: SHIPPING_PRICES.home }] : []),
    ...(pickupAvailable ? [{ key: "pickup" as const, icon: "🤝", label: "Remise en main propre", sub: "À convenir avec le vendeur",     price: 0                    }] : []),
  ];

  return (
    <div className="flex flex-col gap-3">

      {/* Shipping selector */}
      {hasOptions && options.length > 0 && (
        <div className="border border-gray-200 dark:border-navy-700 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-navy-800 border-b border-gray-200 dark:border-navy-700">
            <p className="text-xs font-bold text-gray-600 dark:text-navy-100/70 uppercase tracking-wide">Mode d&apos;envoi</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-navy-700">
            {options.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setMethod(o.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  method === o.key
                    ? "bg-lime-50 dark:bg-lime/10"
                    : "bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-700"
                }`}
              >
                <span className="text-base w-5 text-center">{o.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{o.label}</p>
                  <p className="text-xs text-gray-400 dark:text-navy-100/50 truncate">{o.sub}</p>
                </div>
                <p className={`text-sm font-black shrink-0 ${method === o.key ? "text-navy dark:text-lime" : "text-gray-700 dark:text-white"}`}>
                  {o.price === 0 ? "Offert" : `${o.price} €`}
                </p>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  method === o.key ? "border-lime bg-lime" : "border-gray-300 dark:border-navy-600"
                }`}>
                  {method === o.key && <span className="text-navy text-[8px] font-black leading-none">✓</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Total avec port */}
          {method !== "pickup" && shippingCost > 0 && (
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-navy-700/60 border-t border-gray-200 dark:border-navy-700 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-navy-100/60 font-medium">
                {itemPrice} € + {shippingCost} € de port
              </span>
              <span className="text-base font-black text-gray-900 dark:text-lime">{total} €</span>
            </div>
          )}
        </div>
      )}

      {/* Paiement par carte — toujours disponible */}
      {method !== "pickup" ? (
        <PaymentOptions
          listingId={listingId}
          itemPrice={itemPrice}
          shippingMethod={method}
          onPurchased={() => {}}
        />
      ) : (
        /* Main propre → contacter le vendeur pour convenir */
        <ContactButton
          listingId={listingId}
          sellerId={sellerId}
          sellerName={sellerName}
          listingTitle={listingTitle}
          listingPrice={itemPrice}
        />
      )}

      {/* Offres — si connecté */}
      {currentUserId && (
        <OffersSection
          listingId={listingId}
          sellerId={sellerId}
          sellerName={sellerName}
          listingTitle={listingTitle}
          listingPrice={itemPrice}
          currentUserId={currentUserId}
          shippingHome={shippingHome}
          pickupAvailable={pickupAvailable}
        />
      )}

      {/* Favoris */}
      <FavoriteButton listingId={listingId} currentUserId={currentUserId} />
    </div>
  );
}
