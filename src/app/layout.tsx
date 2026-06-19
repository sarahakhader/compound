import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Space_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Cursor } from "@/components/cursor";
import Script from "next/script";
import { CompoundUniverseProvider } from "@/components/CompoundUniverseProvider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});


const BASE_URL = "https://www.whatiscompound.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  "COMPOUND — Earth, Remembered Through Design.",
    template: "%s — COMPOUND",
  },
  description: "A living archive of objects, materials, and ideas. Toronto-based design studio rooted in material culture, colour, and form.",
  keywords:    ["compound", "design studio", "toronto", "blankets", "material culture", "objects", "archive"],
  authors:     [{ name: "COMPOUND" }],
  creator:     "COMPOUND",
  openGraph: {
    type:        "website",
    locale:      "en_CA",
    url:         BASE_URL,
    siteName:    "COMPOUND",
    title:       "COMPOUND — Earth, Remembered Through Design.",
    description: "A living archive of objects, materials, and ideas. Toronto-based design studio rooted in material culture, colour, and form.",
    images: [{
      url:    "/compound-loading-bg.jpg",
      width:  1920,
      height: 1080,
      alt:    "COMPOUND — Toronto Design Studio",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "COMPOUND — Earth, Remembered Through Design.",
    description: "A living archive of objects, materials, and ideas. Toronto-based design studio.",
    images:      ["/compound-loading-bg.jpg"],
    creator:     "@whoiscompound",
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:            true,
      follow:           true,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${cormorant.variable} ${spaceGrotesk.variable}`}>
        <Cursor />
        {children}
        <CompoundUniverseProvider />
        <Script src="/cyberpunk-toggle.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
