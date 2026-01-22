import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import MiniPlayer from "@/components/MiniPlayer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/legal/CookieConsent";
import PremiumModal from "@/components/PremiumModal";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { Headphones } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Softale",
  description: "Sleep stories, meditations, and immersive audio experiences",
  keywords: ["sleep stories", "meditation", "audio", "relaxation", "ASMR"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Softale",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased bg-slate-50 text-slate-900 min-h-screen`} style={{ '--font-serif': 'Playfair Display, serif' } as React.CSSProperties}>
        <Providers><div className="flex flex-col min-h-screen">
          <Suspense fallback={<div className="h-16 bg-slate-900/50 backdrop-blur-md" />}>
            <Navbar />
          </Suspense>
          <div className="flex-grow">
            {children}
          </div>
          <div className="hidden md:block relative z-10 bg-slate-50">
            <Footer />
          </div>
        </div>
          <CookieConsent />
          <MiniPlayer />
          <PremiumModal />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

