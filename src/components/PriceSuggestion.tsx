"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Condition } from "@/types";

interface Props {
  brand: string;
  name: string;
  condition: Condition;
  currentPrice: string;
}

const CONDITION_DISCOUNT: Record<Condition, [number, number]> = {
  new:      [0.85, 0.95],
  like_new: [0.65, 0.75],
  good:     [0.45, 0.60],
  fair:     [0.25, 0.40],
};

// Retail price references for top rubbers (€)
const RETAIL_PRICES: Record<string, number> = {
  "Tenergy 05": 60, "Tenergy 64": 60, "Tenergy 80": 60, "Tenergy 05 FX": 60,
  "Dignics 05": 70, "Dignics 09C": 70, "Dignics 64": 70, "Dignics 80": 70,
  "Evolution MX-P": 45, "Evolution MX-S": 45, "Evolution FX-P": 45,
  "Rasanter R47": 50, "Rasanter R42": 50, "Rasanter R53": 50,
  "Bluefire M1": 40, "Bluefire M1 Turbo": 42, "Bluefire M2": 40,
  "Vega Europe": 35, "Vega Asia": 40, "Vega Pro": 45,
  "MX-D": 50, "Omega VII Pro": 55, "Omega VII Asia": 55,
  "Fastarc G-1": 42, "Fastarc C-1": 42, "Fastarc P-1": 42,
  "Hexer": 35, "Hexer HD": 40, "Hexer Powergrip": 45,
};

export default function PriceSuggestion({ brand, name, condition, currentPrice }: Props) {
  const [marketMin, setMarketMin] = useState<number | null>(null);
  const [marketMax, setMarketMax] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const retailRef = RETAIL_PRICES[name];
  const [pctMin, pctMax] = CONDITION_DISCOUNT[condition];
  const suggestMin = retailRef ? Math.round(retailRef * pctMin) : null;
  const suggestMax = retailRef ? Math.round(retailRef * pctMax) : null;

  useEffect(() => {
    if (!brand || !name) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("listings")
      .select("price")
      .eq("brand", brand)
      .eq("name", name)
      .eq("condition", condition)
      .is("sold_at", null)
      .limit(20)
      .then(({ data }) => {
        if (data && data.length >= 2) {
          const prices = data.map((d) => d.price as number).sort((a, b) => a - b);
          setMarketMin(prices[0]);
          setMarketMax(prices[prices.length - 1]);
        } else {
          setMarketMin(null);
          setMarketMax(null);
        }
        setLoading(false);
      });
  }, [brand, name, condition]);

  const price = Number(currentPrice);
  const hasMarket = marketMin !== null && marketMax !== null;
  const hasSuggest = suggestMin !== null && suggestMax !== null;

  if (!hasSuggest && !hasMarket) return null;
  if (loading) return null;

  const isTooHigh = price > 0 && hasSuggest && price > suggestMax! * 1.2;
  const isTooLow  = price > 0 && hasSuggest && price < suggestMin! * 0.7;

  return (
    <div className={`rounded-xl px-4 py-3 text-sm border ${isTooHigh ? "bg-red-50 border-red-200" : isTooLow ? "bg-blue-50 border-blue-200" : "bg-lime-50 border-orange-100"}`}>
      <p className="font-semibold text-gray-800 mb-1">
        {isTooHigh ? "⚠️ Prix un peu élevé" : isTooLow ? "💡 Tu peux demander un peu plus" : "💡 Fourchette conseillée"}
      </p>
      {hasSuggest && (
        <p className="text-gray-600 text-xs">
          Sur PingLoop : <strong>{suggestMin}€ – {suggestMax}€</strong> pour cet état
          {retailRef ? ` (prix neuf ~${retailRef}€)` : ""}
        </p>
      )}
      {hasMarket && (
        <p className="text-gray-500 text-xs mt-0.5">
          Annonces actuelles : {marketMin}€ – {marketMax}€
        </p>
      )}
    </div>
  );
}
