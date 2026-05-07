"use client";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UnreadBadge() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const fetchUnread = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    if (!convs?.length) { setCount(0); return; }

    const convIds = convs.map((c) => c.id);
    const { count: unread } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .neq("from_id", user.id)
      .is("read_at", null);

    setCount(unread ?? 0);
  }, []);

  // Re-fetch when navigating — with a short delay so the conversation page
  // has time to mark messages as read before we query.
  useEffect(() => {
    fetchUnread(); // immediate (shows current count while navigating)
    const delayed = setTimeout(fetchUnread, 600); // re-check after read_at is set
    return () => clearTimeout(delayed);
  }, [pathname, fetchUnread]);

  // Also react to realtime inserts/updates (requires REPLICA IDENTITY FULL on messages table)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("unread-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchUnread)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, fetchUnread)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUnread]);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-lime text-navy text-[10px] font-black rounded-full flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}
