import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import SupportChat from "@/components/SupportChat";
import { PrivatePhaseBar } from "@/components/PrivatePhase";

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
  description: "La plataforma de posadas auténticas de Venezuela. Descubre posadas en Los Roques, Mérida, Mochima, Canaima, Gran Sabana y más, sin comisiones para el viajero.",
  keywords: ["posadas Venezuela", "Los Roques", "Canaima", "Mérida", "Mochima", "Morrocoy", "reservar posada", "turismo Venezuela"],
  openGraph: {
    title: "RESER-VE | Posadas auténticas de Venezuela",
    description: "La plataforma de posadas auténticas de Venezuela: Los Roques, Mérida, Mochima, Canaima y más.",
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
          {/* Datos estructurados para Google: nombre del sitio, logo y buscador interno. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify([
              {
                '@context': 'https://schema.org', '@type': 'Organization',
                name: 'RESER-VE', url: 'https://reser-ve.com', logo: 'https://reser-ve.com/logo-512.png',
                email: 'hola@reser-ve.com', sameAs: ['https://www.instagram.com/doslocosdeviaje/'],
              },
              {
                '@context': 'https://schema.org', '@type': 'WebSite',
                name: 'RESER-VE', alternateName: 'RESER-VE Posadas de Venezuela', url: 'https://reser-ve.com',
                potentialAction: { '@type': 'SearchAction', target: 'https://reser-ve.com/buscar?q={search_term_string}', 'query-input': 'required name=search_term_string' },
              },
            ]) }}
          />
          <SessionProviderWrapper>
            <PrivatePhaseBar />
            {children}
            <SupportChat />
          </SessionProviderWrapper>
        </body>
    </html>
  );
}
