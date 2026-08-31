import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Space_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Cursor } from "@/components/cursor";
import Script from "next/script";
import { CompoundUniverseProvider } from "@/components/CompoundUniverseProvider";
import { SiteNav } from "@/components/SiteNav";

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
    default:  "Compound · Creative Direction & Spatial Design Studio",
    template: "%s · COMPOUND",
  },
  description: "Compound is an independent creative direction and spatial design studio designing weddings, events, pop-ups, brand experiences, spaces, objects, and sensory worlds.",
  keywords:    ["compound", "creative direction", "spatial design", "design studio", "toronto", "wedding design", "event design", "brand experience", "material culture", "objects"],
  authors:     [{ name: "COMPOUND" }],
  creator:     "COMPOUND",
  openGraph: {
    type:        "website",
    locale:      "en_CA",
    url:         BASE_URL,
    siteName:    "COMPOUND",
    title:       "Compound · Creative Direction & Spatial Design Studio",
    description: "Compound is an independent creative direction and spatial design studio designing weddings, events, pop-ups, brand experiences, spaces, objects, and sensory worlds.",
    images: [{
      url:    "/compound-loading-bg.jpg",
      width:  1920,
      height: 1080,
      alt:    "COMPOUND · Toronto Design Studio",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Compound · Creative Direction & Spatial Design Studio",
    description: "An independent creative direction and spatial design studio designing weddings, events, pop-ups, brand experiences, and spaces.",
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
  viewportFit: "cover",
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
        <SiteNav />
        {children}
        <CompoundUniverseProvider />
        <Script src="/cyberpunk-toggle.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
