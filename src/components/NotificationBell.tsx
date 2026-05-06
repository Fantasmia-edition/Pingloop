"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count: c } = await supabase
        .from("offers")
        .select("*", { count: "exact", head: true })
        .eq("to_id", user.id)
        .eq("status", "pending");
      setCount(c ?? 0);
    }

    refresh();

    const channel = supabase
      .channel("bell-offers")
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, refresh)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (count === 0) return null;

  return (
    <Link
      href="/mes-annonces"
      className="relative flex items-center justify-center text-white/70 hover:text-white transition-colors"
      title={`${count} offre${count > 1 ? "s" : ""} en attente`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-lime text-navy text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
        {count > 9 ? "9+" : count}
      </span>
    </Link>
  );
}
