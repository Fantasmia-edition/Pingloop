import { Layers, Rows3, CircleDot, Shirt, Backpack, Truck, Handshake, type LucideIcon } from "lucide-react";
import { ItemCategory } from "@/types";

export const CATEGORY_ICONS: Record<ItemCategory, LucideIcon> = {
  rubber: Layers,
  blade: Rows3,
  racket: CircleDot,
  tshirt: Shirt,
  case: Backpack,
};

export function CategoryIcon({ category, className = "w-5 h-5" }: { category: ItemCategory; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? Layers;
  return <Icon className={className} strokeWidth={2} />;
}

export const SHIPPING_ICONS: Record<"home" | "pickup", LucideIcon> = {
  home: Truck,
  pickup: Handshake,
};

export function ShippingIcon({ method, className = "w-4 h-4" }: { method: "home" | "pickup"; className?: string }) {
  const Icon = SHIPPING_ICONS[method];
  return <Icon className={className} strokeWidth={2} />;
}
