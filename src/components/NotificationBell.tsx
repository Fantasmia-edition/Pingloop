"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Bell, MessageCircle, CheckCircle2, XCircle, Mail, type LucideIcon } from "lucide-react";

interface Notif {
  id: string;
  type: "offer_pending" | "offer_accepted" | "offer_declined" | "message";
  label: string;
  href: string;
  at: string;
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result: Notif[] = [];

      // Offres reçues (en attente — vendeur)
      const { data: pendingOffers } = await supabase
        .from("offers")
        .select("id, amount, from_name, listing_id, created_at")
        .eq("to_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      for (const o of pendingOffers ?? []) {
        result.push({
          id: `offer-pending-${o.id}`,
          type: "offer_pending",
          label: `${o.from_name} t'a fait une offre à ${o.amount} €`,
          href: `/annonces/${o.listing_id}`,
          at: o.created_at,
        });
      }

      // Offres acceptées (en attente de paiement — acheteur)
      const { data: acceptedOffers } = await supabase
        .from("offers")
        .select("id, amount, listing_id, created_at")
        .eq("from_id", user.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(3);

      for (const o of acceptedOffers ?? []) {
        result.push({
          id: `offer-accepted-${o.id}`,
          type: "offer_accepted",
          label: `Ton offre de ${o.amount} € a été acceptée — passe au paiement`,
          href: `/annonces/${o.listing_id}`,
          at: o.created_at,
        });
      }

      // Annonces vendues récemment (7 derniers jours — vendeur)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: soldListings } = await supabase
        .from("listings")
        .select("id, brand, name, sold_at")
        .eq("seller_id", user.id)
        .not("sold_at", "is", null)
        .gte("sold_at", sevenDaysAgo)
        .order("sold_at", { ascending: false })
        .limit(3);

      for (const l of soldListings ?? []) {
        result.push({
          id: `sold-${l.id}`,
          type: "offer_accepted" as const,
          label: `Vendu ! ${l.brand} ${l.name} — pense à expédier`,
          href: `/annonces/${l.id}`,
          at: l.sold_at,
        });
      }

      // Messages non lus
      const { data: convos } = await supabase
        .from("conversations")
        .select("id, listing_id, buyer_id, seller_id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .limit(20);

      if (convos?.length) {
        const convoIds = convos.map((c) => c.id);
        const { data: unread } = await supabase
          .from("messages")
          .select("id, conversation_id, text, sent_at")
          .in("conversation_id", convoIds)
          .neq("from_id", user.id)
          .is("read_at", null)
          .order("sent_at", { ascending: false })
          .limit(5);

        for (const m of unread ?? []) {
          result.push({
            id: `msg-${m.id}`,
            type: "message",
            label: `Nouveau message : "${m.text.slice(0, 40)}${m.text.length > 40 ? "…" : ""}"`,
            href: `/messages/${m.conversation_id}`,
            at: m.sent_at,
          });
        }
      }

      // Tri par date décroissante
      result.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setNotifs(result.slice(0, 8));
    }

    refresh();

    const channel = supabase
      .channel("bell-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, refresh)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fermer le dropdown si clic hors
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = notifs.length;

  if (count === 0) return null;

  const iconColor: Record<Notif["type"], string> = {
    offer_pending: "text-lime",
    offer_accepted: "text-green-400",
    offer_declined: "text-red-400",
    message: "text-blue-400",
  };
  const iconComponent: Record<Notif["type"], LucideIcon> = {
    offer_pending: MessageCircle,
    offer_accepted: CheckCircle2,
    offer_declined: XCircle,
    message: Mail,
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center text-white/70 hover:text-white transition-colors"
        title={`${count} notification${count > 1 ? "s" : ""}`}
      >
        <Bell className="w-5 h-5" strokeWidth={2} />
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-lime text-navy text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
          {count > 9 ? "9+" : count}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-navy-700">
            <p className="text-xs font-bold text-gray-500 dark:text-navy-100/60 uppercase tracking-wide">Notifications</p>
          </div>
          <div className="flex flex-col max-h-80 overflow-y-auto">
            {notifs.map((n) => {
              const Icon = iconComponent[n.type];
              return (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors border-b border-gray-50 dark:border-navy-700/50 last:border-0"
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor[n.type]}`} strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-navy-100 leading-snug">{n.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-navy-100/40 mt-0.5">
                    {new Date(n.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </Link>
            );})}
          </div>
        </div>
      )}
    </div>
  );
}
