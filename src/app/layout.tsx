import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavBar } from "@/components/BottomNavBar";
import { TopNavBar } from "@/components/TopNavBar";
import { Providers } from "@/providers";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#d946ef",
};

export const metadata: Metadata = {
  title: "SAF Biblioteca",
  description: "Sistema de gestão de biblioteca online para a SAF",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-saf-50 text-saf-950 min-h-screen pb-20 md:pb-0 md:pt-16`}>
        <Providers>
          <TopNavBar />
          <div className="w-full h-full min-h-screen">
            {children}
          </div>
          <BottomNavBar />
        </Providers>
      </body>
    </html>
  );
}
