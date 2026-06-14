import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import SupportChat from "@/components/SupportChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://reser-ve.com"),
  title: {
    default: "RESER-VE | Posadas auténticas de Venezuela",
    template: "%s | RESER-VE",
  },
  description: "Descubre y reserva las mejores posadas de Venezuela. Los Roques, Mérida, Mochima, Canaima, Gran Sabana y más.",
  keywords: ["posadas Venezuela", "Los Roques", "Canaima", "Mérida", "Mochima", "Morrocoy", "reservar posada", "turismo Venezuela"],
  openGraph: {
    title: "RESER-VE | Posadas auténticas de Venezuela",
    description: "Descubre y reserva las mejores posadas de Venezuela, con pago en Zelle, Pago Móvil o transferencia.",
    url: "/",
    siteName: "RESER-VE",
    locale: "es_VE",
    type: "website",
    images: [{ url: "/images/los-roques-hero.webp", width: 1200, height: 630, alt: "Posadas de Venezuela" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RESER-VE | Posadas auténticas de Venezuela",
    description: "Descubre y reserva las mejores posadas de Venezuela.",
    images: ["/images/los-roques-hero.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <SessionProviderWrapper>
            {children}
            <SupportChat />
          </SessionProviderWrapper>
        </body>
    </html>
  );
}
