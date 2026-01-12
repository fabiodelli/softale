import type { Metadata, Viewport } from "next";
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
  title: "Softale - Audio Stories",
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
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased bg-slate-50 text-slate-900 min-h-screen`}>
        <Providers>
          {/* Global Mobile Logo - Fixed position across all pages */}
          <Link
            href="/"
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 md:hidden flex items-center gap-2 group drop-shadow-lg"
          >
            <Headphones className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 block tracking-tight">
              Softale
            </h1>
          </Link>

          <div className="flex flex-col min-h-screen">
            <Navbar />
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

