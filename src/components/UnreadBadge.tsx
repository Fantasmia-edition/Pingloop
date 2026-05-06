"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all conversations where user participates
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (!convs?.length) return;

      const convIds = convs.map((c) => c.id);
      const { count: unread } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .neq("from_id", user.id)
        .is("read_at", null);

      setCount(unread ?? 0);
    }

    fetchUnread();

    // Refresh on new messages via Realtime
    const channel = supabase
      .channel("unread-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchUnread();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-lime text-navy text-[10px] font-black rounded-full flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}
