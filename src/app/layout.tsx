import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import MiniPlayer from "@/components/MiniPlayer";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import PremiumModal from "@/components/PremiumModal";
import BottomNav from "@/components/BottomNav";

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
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
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

