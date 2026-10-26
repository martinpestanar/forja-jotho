import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
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

const loraSerif = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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
  themeColor: "#FAF9F5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${loraSerif.variable} h-full`}
    >
      <body className="min-h-full bg-[#FAF9F5] text-[#1F1E1B] font-sans antialiased flex flex-col selection:bg-[#D97043] selection:text-white">
        <PwaRegister />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
