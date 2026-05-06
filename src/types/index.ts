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
  In: "Lisse (inverted)",
  Out: "Picots courts",
  Long: "Picots longs",
};

export const CONDITION_COLORS: Record<Condition, string> = {
  new: "bg-green-100 text-green-800",
  like_new: "bg-blue-100 text-blue-800",
  good: "bg-yellow-100 text-yellow-800",
  fair: "bg-orange-100 text-orange-800",
};
