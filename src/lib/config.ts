export const COMMISSION_RATE = 0.07; // 7%
// Part de la commission reversée au club du vendeur (prélevée sur COMMISSION_RATE,
// n'augmente pas le prix payé par l'acheteur ni ne diminue le montant reçu par le vendeur).
export const CLUB_SHARE_RATE = 0.01; // 1%
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Pourboire optionnel pour une remise en main propre — 50/50 entre PingLoop et le club du vendeur
export const PICKUP_TIP_AMOUNTS = [0.5, 1, 2, 3] as const;
export const PICKUP_TIP_CLUB_SHARE = 0.5;
