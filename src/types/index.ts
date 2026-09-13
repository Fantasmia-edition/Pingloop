export type PimpleType = "In" | "Out" | "Long";
export type ItemCategory = "rubber" | "blade" | "racket" | "tshirt" | "case";
export type Condition = "new" | "like_new" | "good" | "fair";

export interface Rubber {
  brand: string;
  name: string;
  approval_code: string | null;
  pimple_type: PimpleType;
  colors: string[];
  expires_on: string | null;
}

export interface Listing {
  id: string;
  category: ItemCategory;
  brand: string;
  name: string;
  pimple_type?: PimpleType;
  color?: string;
  condition: Condition;
  price: number;
  description: string;
  seller: string;
  location: string;
  created_at: string;
  approval_code?: string | null;
  /** Propose la livraison à domicile via La Poste (tarif fixé par la plateforme) */
  shipping_home?: boolean;
  /** Propose la remise en main propre */
  pickup_available?: boolean;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  postal_code: string;
  city: string;
}

export interface SearchAlert {
  id: string;
  brand?: string;
  name?: string;
  category?: ItemCategory;
  pimple_type?: PimpleType;
  max_price?: number;
  email: string;
  created_at: string;
}

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "Neuf",
  like_new: "Comme neuf",
  good: "Bon état",
  fair: "État correct",
};

export const CATEGORY_CONFIG: Record<ItemCategory, { label: string; emoji: string }> = {
  rubber:  { label: "Revêtement",       emoji: "🏓" },
  blade:   { label: "Bois",             emoji: "🪵" },
  racket:  { label: "Raquette complète",emoji: "🎯" },
  tshirt:  { label: "T-Shirt",          emoji: "👕" },
  case:    { label: "Housse",           emoji: "🎒" },
};

export const PIMPLE_LABELS: Record<PimpleType, string> = {
  In: "Backside",
  Out: "Picots courts",
  Long: "Picots longs",
};

/** Tarif de port fixé par PingLoop (en €) */
export const SHIPPING_PRICES = {
  home: 8,
} as const;

export const CONDITION_COLORS: Record<Condition, string> = {
  new: "bg-lime text-navy",
  like_new: "bg-lime-100 text-navy dark:bg-lime/20 dark:text-lime",
  good: "bg-gray-100 text-gray-700 dark:bg-navy-700 dark:text-navy-100",
  fair: "bg-gray-100 text-gray-500 dark:bg-navy-700 dark:text-navy-100/70",
};
