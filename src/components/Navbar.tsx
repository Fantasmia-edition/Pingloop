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

  const navLinks = [
    { href: "/annonces", label: "Annonces" },
    { href: "/messages", label: "Messages", badge: true },
    { href: "/alertes", label: "Mes alertes" },
    ...(user ? [
      { href: "/mes-annonces", label: "Mes annonces" },
      { href: "/mes-favoris", label: "Favoris" },
      { href: "/profil", label: "Mon profil" },
    ] : []),
  ];

  return (
    <header className="bg-navy sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-0.5">
          <span className="text-xl font-black tracking-tight text-lime">Ping</span>
          <span className="text-xl font-black tracking-tight text-white">Loop</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative text-sm font-semibold transition-colors ${
                pathname.startsWith(l.href)
                  ? "text-lime"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {l.label}
              {l.badge && user && <UnreadBadge />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <button onClick={handleSignOut} className="hidden sm:block text-xs text-white/50 hover:text-white/80 transition-colors">
              Déconnexion
            </button>
          ) : (
            <Link href="/auth" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              Connexion
            </Link>
          )}
          <Link
            href="/vendre"
            className="bg-lime hover:bg-lime-dark text-navy text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            + Vendre
          </Link>
        </div>
      </div>
    </header>
  );
}
