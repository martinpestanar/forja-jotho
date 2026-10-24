import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/layout/PwaRegister";
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forja Johto - RPG de Hábitos",
  description: "Plataforma estoica de hábitos reales y contratos inviolables con integración Pokémon Heart & Soul",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Forja Johto",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0B0C0E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#0B0C0E] text-[#E2E8F0] font-sans antialiased flex flex-col">
        <PwaRegister />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
