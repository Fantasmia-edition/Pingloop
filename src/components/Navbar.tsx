"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import UnreadBadge from "@/components/UnreadBadge";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-0.5">
          <span className="text-xl font-black tracking-tight text-orange-500">Ping</span>
          <span className="text-xl font-black tracking-tight text-gray-900">Loop</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          {[
            { href: "/annonces", label: "Annonces" },
            { href: "/messages", label: "Messages", badge: true },
            { href: "/alertes", label: "Mes alertes" },
            ...(user ? [
              { href: "/mes-annonces", label: "Mes annonces" },
              { href: "/profil", label: "Mon profil" },
            ] : []),
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? "text-orange-500"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {l.label}
              {l.badge && user && <UnreadBadge />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-gray-400 max-w-[120px] truncate">
                {user.email?.split("@")[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/auth" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Connexion
            </Link>
          )}
          <Link
            href="/vendre"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Vendre
          </Link>
        </div>
      </div>
    </header>
  );
}
