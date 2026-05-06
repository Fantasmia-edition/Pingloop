"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ConvRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  seller_name: string;
  created_at: string;
  listings: { brand: string; name: string; price: number } | null;
  last_message: string;
  last_message_at: string;
  unread: number;
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const router = useRouter();
  const [convs, setConvs] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/messages"); return; }
      setUserId(user.id);

      const { data: conversations } = await supabase
        .from("conversations")
        .select("*, listings(brand, name, price)")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!conversations) { setLoading(false); return; }

      // Enrich with last message
      const enriched = await Promise.all(
        conversations.map(async (c) => {
          const { data: msgs } = await supabase
            .from("messages")
            .select("text, sent_at, read_at, from_id")
            .eq("conversation_id", c.id)
            .order("sent_at", { ascending: false })
            .limit(1);

          const last = msgs?.[0];
          const unread = last && last.from_id !== user.id && !last.read_at ? 1 : 0;

          return {
            ...c,
            last_message: last?.text ?? "Conversation démarrée",
            last_message_at: last?.sent_at ?? c.created_at,
            unread,
          } as ConvRow;
        })
      );

      setConvs(enriched.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Messages</h1>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Messages</h1>

      {convs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-semibold text-gray-600">Aucune conversation</p>
          <p className="text-sm mt-1">Trouve un article qui t&apos;intéresse et contacte le vendeur !</p>
          <Link href="/annonces" className="mt-4 inline-block text-navy font-semibold text-sm hover:underline">
            Voir les annonces →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {convs.map((conv) => {
            const isbuyer = conv.buyer_id === userId;
            const otherName = isbuyer ? conv.seller_name : conv.buyer_name;
            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-lime-100 flex items-center justify-center text-navy font-black text-sm">
                    {otherName.charAt(0).toUpperCase()}
                  </div>
                  {conv.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-lime text-navy text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-sm truncate ${conv.unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                      {otherName}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{formatTime(conv.last_message_at)}</span>
                  </div>
                  {conv.listings && (
                    <p className="text-xs text-navy font-medium truncate">
                      {conv.listings.brand} {conv.listings.name} · {conv.listings.price}€
                    </p>
                  )}
                  <p className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? "text-gray-700 font-semibold" : "text-gray-400"}`}>
                    {conv.last_message}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
