export const COMMISSION_RATE = 0.07; // 7%
// Part de la commission reversée au club du vendeur (prélevée sur COMMISSION_RATE,
// n'augmente pas le prix payé par l'acheteur ni ne diminue le montant reçu par le vendeur).
export const CLUB_SHARE_RATE = 0.01; // 1%
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
