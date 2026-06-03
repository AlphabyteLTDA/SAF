import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavBar } from "@/components/BottomNavBar";
import { TopNavBar } from "@/components/TopNavBar";
import { Providers } from "@/providers";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#d946ef",
};

export const metadata: Metadata = {
  title: "SAF Biblioteca",
  description: "Sistema de gestão de biblioteca online para a SAF",
  manifest: "/manifest.json",
  icons: {
    icon: '/saflogobranco.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SAF Biblioteca" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} bg-white text-saf-950 min-h-screen pb-20 md:pb-0 md:pt-16`}>
        <Providers>
          <TopNavBar />
          <div className="w-full h-full min-h-screen bg-saf-50">
            {children}
          </div>
          <BottomNavBar />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
