import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "EcoRDC - Plateforme E-commerce en RDC",
  description: "La plateforme e-commerce de référence en RDC et pensée pour toute l'Afrique. Connectez vendeurs et clients, développez votre activité et achetez en toute confiance.",
  keywords: ["EcoRDC", "e-commerce", "RDC", "Congo", "boutique en ligne", "vendeur", "client"],
  authors: [{ name: "HenoBuild" }],
  icons: {
    icon: "/ecordc-logo.png",
    apple: "/ecordc-logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "EcoRDC - Plateforme E-commerce en RDC",
    description: "La plateforme e-commerce de référence en RDC et pensée pour toute l'Afrique. Connectez vendeurs et clients, développez votre activité et achetez en toute confiance.",
    siteName: "EcoRDC",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EcoRDC",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/ecordc-logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
