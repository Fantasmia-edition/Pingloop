import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CONDITION_LABELS, CONDITION_COLORS, PIMPLE_LABELS, CATEGORY_CONFIG, Listing } from "@/types";
import ContactButton from "@/components/ContactButton";
import MarkSoldButton from "@/components/MarkSoldButton";
import PaymentOptions from "@/components/PaymentOptions";
import OffersSection from "@/components/OffersSection";
import FavoriteButton from "@/components/FavoriteButton";
import PhotoGallery from "@/components/PhotoGallery";
import ListingCard from "@/components/ListingCard";

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

  const [{ data: { user } }, { data: sellerProfile }, { data: similarRaw }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("stripe_onboarded, paypal_onboarded").eq("id", l.seller_id).single(),
    supabase
      .from("listings")
      .select("*")
      .eq("category", l.category)
      .neq("id", id)
      .is("sold_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const similar = (similarRaw as Listing[]) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {published && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-semibold">
          🎉 Annonce publiée avec succès ! Elle est maintenant visible par tous les pongistes.
        </div>
      )}

      <Link
        href="/annonces"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-navy-100 mb-6 inline-flex items-center gap-1 transition-colors"
      >
        ← Retour aux annonces
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 mt-4">
        {/* Photos — swipeable gallery */}
        <PhotoGallery
          photos={l.photos ?? []}
          alt={`${l.brand} ${l.name}`}
          emoji={CATEGORY_CONFIG[l.category]?.emoji ?? "📦"}
        />

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold text-navy dark:text-lime uppercase tracking-wide">
              {CATEGORY_CONFIG[l.category]?.label ?? l.category}
            </span>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
              {l.brand} {l.name}
            </h1>
          </div>

          <p className="text-4xl font-black text-gray-900 dark:text-lime">{l.price} €</p>

          <div className="flex flex-wrap gap-2">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${CONDITION_COLORS[l.condition]}`}>
              {CONDITION_LABELS[l.condition]}
            </span>
            {l.pimple_type && (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-navy-100">
                {PIMPLE_LABELS[l.pimple_type]}
              </span>
            )}
            {l.color && (
              <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-navy-100">
                <span className={`w-3 h-3 rounded-full ${COLOR_DOT[l.color] ?? "bg-gray-400"}`} />
                {COLOR_FR[l.color] ?? l.color}
              </span>
            )}
            {l.approval_code && (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-navy-700 text-gray-500 dark:text-navy-100/60">
                ITTF {l.approval_code}
              </span>
            )}
          </div>

          {l.description && (
            <div className="bg-gray-50 dark:bg-navy-800 rounded-xl p-4 border border-gray-100 dark:border-navy-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-navy-100 mb-1">Description</p>
              <p className="text-sm text-gray-600 dark:text-navy-100/70 leading-relaxed">{l.description}</p>
            </div>
          )}

          <div className="border border-gray-200 dark:border-navy-700 rounded-xl p-4 flex items-center justify-between bg-white dark:bg-navy-800">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{l.seller_name}</p>
              <p className="text-xs text-gray-400 dark:text-navy-100/50">
                {new Date(l.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-navy-700 flex items-center justify-center text-navy font-black text-sm">
              {l.seller_name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Buyer actions */}
          {user?.id !== l.seller_id && !l.sold_at && (
            <div className="flex flex-col gap-3">
              {sellerProfile && (sellerProfile.stripe_onboarded || sellerProfile.paypal_onboarded) ? (
                <PaymentOptions listingId={l.id} price={l.price} sellerProfile={sellerProfile} onPurchased={() => {}} />
              ) : (
                <ContactButton listingId={l.id} sellerId={l.seller_id} sellerName={l.seller_name} listingTitle={`${l.brand} ${l.name}`} listingPrice={l.price} />
              )}
              {user && (
                <OffersSection listingId={l.id} sellerId={l.seller_id} listingPrice={l.price} currentUserId={user.id} />
              )}
              <FavoriteButton listingId={l.id} currentUserId={user?.id ?? null} />
            </div>
          )}

          {/* Seller actions */}
          {user?.id === l.seller_id && (
            <div className="flex flex-col gap-3">
              {!l.sold_at ? (
                <>
                  <div className="bg-lime-50 dark:bg-lime/10 border border-lime/30 rounded-xl px-4 py-3 text-sm text-navy dark:text-lime font-semibold text-center">
                    C&apos;est ton annonce
                  </div>
                  <OffersSection listingId={l.id} sellerId={l.seller_id} listingPrice={l.price} currentUserId={user.id} />
                  <MarkSoldButton listingId={l.id} />
                </>
              ) : (
                <div className="bg-gray-100 dark:bg-navy-700 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-navy-100/60 font-semibold text-center">
                  ✓ Vendu le {new Date(l.sold_at).toLocaleDateString("fr-FR")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Similar listings */}
      {similar.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Annonces similaires
            </h2>
            <Link
              href={`/annonces?cat=${l.category}`}
              className="text-sm font-bold text-navy dark:text-lime hover:underline underline-offset-2"
            >
              Tout voir →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similar.map((s) => (
              <ListingCard key={s.id} listing={s as Listing & { photos: string[]; seller_name: string }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
