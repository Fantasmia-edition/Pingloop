"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { SHIPPING_PRICES } from "@/types";
import { HOME_SHIPPING_ENABLED } from "@/lib/config";
import ContactButton from "@/components/ContactButton";
import OffersSection from "@/components/OffersSection";
import FavoriteButton from "@/components/FavoriteButton";
import PickupTipSelector from "@/components/PickupTipSelector";
import { ShippingIcon } from "@/components/icons";
import { Check, ShieldCheck, ChevronDown } from "lucide-react";

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
  sellerPaypalOnboarded: boolean;
  sellerClub?: string | null;
}

function defaultMethod(home: boolean): ShippingMethod {
  if (HOME_SHIPPING_ENABLED && home) return "home";
  return "pickup";
}

export default function BuyerActions({
  listingId, itemPrice, sellerId, sellerName, listingTitle,
  shippingHome, pickupAvailable,
  currentUserId,
  sellerPaypalOnboarded,
  sellerClub,
}: Props) {
  const hasOptions = (HOME_SHIPPING_ENABLED && shippingHome) || pickupAvailable;

  const [method, setMethod] = useState<ShippingMethod>(
    defaultMethod(shippingHome)
  );
  const [showDirectContact, setShowDirectContact] = useState(false);

  const shippingCost = method === "home" ? SHIPPING_PRICES.home : 0;

  const total = itemPrice + shippingCost;

  const options: { key: ShippingMethod; label: string; sub: string; price: number }[] = [
    ...(HOME_SHIPPING_ENABLED && shippingHome ? [{ key: "home"   as const, label: "Envoi par La Poste",    sub: "Colissimo · livré chez vous",    price: SHIPPING_PRICES.home }] : []),
    ...(pickupAvailable ? [{ key: "pickup" as const, label: "Remise en main propre", sub: "À convenir avec le vendeur",     price: 0                    }] : []),
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
            {!HOME_SHIPPING_ENABLED && (
              <div className="flex items-center gap-3 px-4 py-3 opacity-50">
                <ShippingIcon method="home" className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">Envoi par La Poste</p>
                  <p className="text-xs text-gray-400 dark:text-navy-100/50 truncate">On y travaille — arrive très bientôt !</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-navy-100/50 border border-gray-300 dark:border-navy-600 rounded-full px-2 py-0.5 shrink-0">
                  Bientôt
                </span>
              </div>
            )}
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
                <ShippingIcon method={o.key} className="w-4 h-4 shrink-0" />
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
                  {method === o.key && <Check className="w-2.5 h-2.5 text-navy" strokeWidth={3} />}
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

      {/* Paiement via PingLoop — option prioritaire, y compris en main propre */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 flex gap-2.5 items-start">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
        <p>
          <strong>Paie via PingLoop</strong> — tes coordonnées bancaires ne sont jamais transmises au vendeur, et si l&apos;objet ne
          correspond pas à l&apos;annonce, on te rembourse. Une partie de chaque vente soutient aussi les clubs de tennis de table.
        </p>
      </div>
      <PaymentOptions
        listingId={listingId}
        itemPrice={itemPrice}
        shippingMethod={method}
        onPurchased={() => {}}
        sellerPaypalOnboarded={sellerPaypalOnboarded}
      />

      {/* Option secondaire, repliée — s'arranger directement avec le vendeur */}
      {method === "pickup" && (
        <div className="flex flex-col gap-3">
          {!showDirectContact ? (
            <button
              type="button"
              onClick={() => setShowDirectContact(true)}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-navy-100 font-medium flex items-center justify-center gap-1 py-1"
            >
              Tu préfères t&apos;arranger directement avec le vendeur ?
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          ) : (
            <>
              <ContactButton
                listingId={listingId}
                sellerId={sellerId}
                sellerName={sellerName}
                listingTitle={listingTitle}
                listingPrice={itemPrice}
              />
              {currentUserId && <PickupTipSelector listingId={listingId} sellerClub={sellerClub} />}
            </>
          )}
        </div>
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
          sellerPaypalOnboarded={sellerPaypalOnboarded}
        />
      )}

      {/* Favoris */}
      <FavoriteButton listingId={listingId} currentUserId={currentUserId} />
    </div>
  );
}
