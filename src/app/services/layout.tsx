import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services",
  description: "Creative direction, events and experiences, spatial design, and brand worlds. Compound designs the world around the idea, from weddings to emerging brands.",
  openGraph: {
    title:       "Services · COMPOUND",
    description: "Creative direction, events and experiences, spatial design, and brand worlds.",
    images: [{ url: "/compound-loading-bg.jpg", width: 1920, height: 1080, alt: "Compound Services" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Services · COMPOUND",
    description: "Creative direction, events and experiences, spatial design, and brand worlds.",
    images:      ["/compound-loading-bg.jpg"],
  },
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
