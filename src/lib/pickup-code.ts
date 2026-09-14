/**
 * Code à 4 chiffres donné par l'acheteur au vendeur lors d'une remise en main
 * propre, pour que le vendeur confirme sur la plateforme que l'échange a bien
 * eu lieu. Généré côté serveur au paiement, jamais posté dans la messagerie
 * partagée (sinon le vendeur le verrait avant même la remise). 10 000
 * combinaisons — associé à une limite de tentatives côté confirmation, c'est
 * largement assez pour ce niveau de risque (pas un code bancaire).
 */
export function generatePickupCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
