"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import UnreadBadge from "@/components/UnreadBadge";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "/annonces", label: "Annonces" },
    { href: "/messages", label: "Messages", badge: true },
    { href: "/alertes", label: "Alertes" },
    ...(user ? [
      { href: "/mes-annonces", label: "Mes annonces" },
      { href: "/mes-favoris", label: "Favoris" },
      { href: "/profil", label: "Profil" },
    ] : []),
  ];

  return (
    <header className="bg-navy sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-0.5">
          <span className="text-xl font-black tracking-tight text-lime">Ping</span>
          <span className="text-xl font-black tracking-tight text-white">Loop</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-5">
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

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          <ThemeToggle />
          {user ? (
            <button
              onClick={handleSignOut}
              className="hidden sm:block text-xs text-white/50 hover:text-white/80 transition-colors px-2"
            >
              Déco
            </button>
          ) : (
            <Link href="/auth" className="hidden sm:block text-sm font-semibold text-white/70 hover:text-white transition-colors">
              Connexion
            </Link>
          )}
          <Link
            href="/vendre"
            className="bg-lime hover:bg-lime-dark text-navy text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            + Vendre
          </Link>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col gap-1 p-1.5 text-white/70 hover:text-white"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`block w-5 h-0.5 bg-current transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-navy-800 border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative flex items-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                pathname.startsWith(l.href) ? "text-lime" : "text-white/70"
              }`}
            >
              {l.label}
              {l.badge && user && <UnreadBadge />}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-left py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Déconnexion
            </button>
          ) : (
            <Link href="/auth" className="py-2.5 text-sm font-semibold text-white/70">
              Connexion
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
