"use client";
import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DbMessage {
  id: string;
  conversation_id: string;
  from_id: string;
  text: string;
  sent_at: string;
  read_at: string | null;
}

interface Conv {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_name: string;
  seller_name: string;
  listings: { brand: string; name: string; price: number } | null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [conv, setConv] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth?redirect=/messages"); return; }
      setUserId(user.id);

      const { data: convData } = await supabase
        .from("conversations")
        .select("*, listings(brand, name, price)")
        .eq("id", id)
        .single();

      if (!convData) { router.push("/messages"); return; }
      setConv(convData as Conv);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("sent_at", { ascending: true });

      setMessages((msgs as DbMessage[]) ?? []);

      // Mark messages from the other person as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", id)
        .neq("from_id", user.id)
        .is("read_at", null);
    }

    load();

    // Realtime subscription
    const channel = supabase
      .channel(`conv-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as DbMessage];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, router]);

  async function send() {
    const text = input.trim();
    if (!text || !userId || !conv || sending) return;
    setSending(true);
    setInput("");

    const supabase = createClient();
    await supabase.from("messages").insert({
      conversation_id: id,
      from_id: userId,
      text,
    });

    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const otherName = conv
    ? (conv.buyer_id === userId ? conv.seller_name : conv.buyer_name)
    : "…";

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/messages" className="text-gray-400 hover:text-gray-600 text-lg leading-none">←</Link>
        <div className="w-9 h-9 rounded-full bg-lime-100 flex items-center justify-center text-navy font-black text-sm shrink-0">
          {otherName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">{otherName}</p>
          {conv?.listings && (
            <p className="text-xs text-gray-400 truncate">
              {conv.listings.brand} {conv.listings.name}
            </p>
          )}
        </div>
        {conv?.listing_id && (
          <Link
            href={`/annonces/${conv.listing_id}`}
            className="shrink-0 bg-lime-50 text-navy text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-lime-100 transition-colors"
          >
            {conv.listings?.price ?? "—"} €
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-gray-50">
        {messages.map((msg, idx) => {
          const isMe = msg.from_id === userId;
          const showTime =
            idx === messages.length - 1 ||
            new Date(messages[idx + 1].sent_at).getTime() - new Date(msg.sent_at).getTime() > 5 * 60 * 1000;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-lime text-navy rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
              {showTime && (
                <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.sent_at)}</span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3 shrink-0">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Écris ton message…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lime resize-none bg-gray-50"
          style={{ maxHeight: "120px" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="bg-lime hover:bg-lime-dark disabled:opacity-40 disabled:cursor-not-allowed text-navy font-bold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
