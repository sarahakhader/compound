import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Cursor } from "@/components/cursor";

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

export const metadata: Metadata = {
  title: "COMPOUND — Earth, Remembered Through Design.",
  description: "Toronto-based design studio and archive.",
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
      </body>
    </html>
  );
}
