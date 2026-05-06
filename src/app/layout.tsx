import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne", weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "PingLoop — Le marché des pongistes",
  description: "Achète et revends tes bois et revêtements de tennis de table. Matériel de qualité, prix mini.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} h-full`}>
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
          © {new Date().getFullYear()} PingLoop — Fait avec ❤️ par des pongistes, pour des pongistes
        </footer>
      </body>
    </html>
  );
}
