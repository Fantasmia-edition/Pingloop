import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CONDITION_LABELS, CONDITION_COLORS, PIMPLE_LABELS, Listing } from "@/types";
import ContactButton from "@/components/ContactButton";
import MarkSoldButton from "@/components/MarkSoldButton";
import PaymentOptions from "@/components/PaymentOptions";

const COLOR_FR: Record<string, string> = {
  Red: "Rouge", Black: "Noir", Blue: "Bleu", Green: "Vert",
  Pink: "Rose", Violet: "Violet", Orange: "Orange",
};
const COLOR_DOT: Record<string, string> = {
  Red: "bg-red-500", Black: "bg-gray-900", Blue: "bg-blue-500",
  Green: "bg-green-500", Pink: "bg-pink-400", Violet: "bg-violet-500",
};

export default async function ListingDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const { id } = await params;
  const { published } = await searchParams;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) notFound();

  const l = listing as Listing & { photos: string[]; seller_name: string; sold_at: string | null; seller_id: string };

  const [{ data: { user } }, { data: sellerProfile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("stripe_onboarded, paypal_onboarded").eq("id", l.seller_id).single(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {published && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-semibold">
          🎉 Annonce publiée avec succès ! Elle est maintenant visible par tous les pongistes.
        </div>
      )}

      <Link href="/annonces" className="text-sm text-gray-400 hover:text-gray-600 mb-6 inline-flex items-center gap-1">
        ← Retour aux annonces
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 mt-4">
        {/* Photos */}
        <div className="flex flex-col gap-3">
          {l.photos && l.photos.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.photos[0]}
                alt={`${l.brand} ${l.name}`}
                className="aspect-square w-full object-cover rounded-2xl border border-gray-200"
              />
              {l.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {l.photos.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className={`w-16 h-16 shrink-0 object-cover rounded-lg border-2 ${i === 0 ? "border-orange-400" : "border-transparent"}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
              <span className="text-7xl">{l.category === "rubber" ? "🏓" : "🪵"}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
              {l.category === "rubber" ? "Revêtement" : "Bois"}
            </span>
            <h1 className="text-3xl font-black text-gray-900 leading-tight">
              {l.brand} {l.name}
            </h1>
          </div>

          <p className="text-4xl font-black text-gray-900">{l.price} €</p>

          <div className="flex flex-wrap gap-2">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${CONDITION_COLORS[l.condition]}`}>
              {CONDITION_LABELS[l.condition]}
            </span>
            {l.pimple_type && (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                {PIMPLE_LABELS[l.pimple_type]}
              </span>
            )}
            {l.color && (
              <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                <span className={`w-3 h-3 rounded-full ${COLOR_DOT[l.color] ?? "bg-gray-400"}`} />
                {COLOR_FR[l.color] ?? l.color}
              </span>
            )}
            {l.approval_code && (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                ITTF {l.approval_code}
              </span>
            )}
          </div>

          {l.description && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed">{l.description}</p>
            </div>
          )}

          <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white">
            <div>
              <p className="text-sm font-semibold text-gray-900">{l.seller_name}</p>
              <p className="text-xs text-gray-400">
                {l.location} · {new Date(l.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-sm">
              {l.seller_name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Only show contact/payment options if not the seller and not already sold */}
          {user?.id !== l.seller_id && !l.sold_at && (
            <div className="flex flex-col gap-3">
              {sellerProfile && (sellerProfile.stripe_onboarded || sellerProfile.paypal_onboarded) ? (
                <PaymentOptions
                  listingId={l.id}
                  price={l.price}
                  sellerProfile={sellerProfile}
                  onPurchased={() => {}}
                />
              ) : (
                <ContactButton listingId={l.id} sellerId={l.seller_id} sellerName={l.seller_name} listingTitle={`${l.brand} ${l.name}`} listingPrice={l.price} />
              )}
            </div>
          )}

          {user?.id === l.seller_id && (
            <div className="flex flex-col gap-2">
              {!l.sold_at ? (
                <>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700 font-semibold text-center">
                    C&apos;est ton annonce
                  </div>
                  <MarkSoldButton listingId={l.id} />
                </>
              ) : (
                <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500 font-semibold text-center">
                  ✓ Vendu le {new Date(l.sold_at).toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
