import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PingLoop — Le marché des pongistes",
  description: "Achète et revends tes bois et revêtements de tennis de table. Matériel de qualité, prix mini.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} h-full`}>
      <head>
        {/* Anti-FOUC: apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased transition-colors duration-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 dark:border-navy-700 py-6 text-center text-sm text-gray-400 dark:text-navy-100/50 dark:bg-navy-900">
          <div className="flex flex-wrap justify-center gap-4 mb-3 text-xs">
            <a href="/comment-ca-marche" className="hover:text-gray-600 dark:hover:text-white transition-colors">Comment ça marche</a>
            <a href="/clubs" className="hover:text-gray-600 dark:hover:text-white transition-colors">Clubs</a>
            <a href="/alertes" className="hover:text-gray-600 dark:hover:text-white transition-colors">Alertes</a>
            <a href="mailto:support@pingloop.fr" className="hover:text-gray-600 dark:hover:text-white transition-colors">Support</a>
            <a href="/mentions-legales" className="hover:text-gray-600 dark:hover:text-white transition-colors">Mentions légales</a>
            <a href="/cgu-cgv" className="hover:text-gray-600 dark:hover:text-white transition-colors">CGU/CGV</a>
            <a href="/confidentialite" className="hover:text-gray-600 dark:hover:text-white transition-colors">Confidentialité</a>
            <a href="/cookies" className="hover:text-gray-600 dark:hover:text-white transition-colors">Cookies</a>
          </div>
          © {new Date().getFullYear()} PingLoop — Fait avec ❤️ par des pongistes, pour des pongistes
        </footer>
      </body>
    </html>
  );
}
