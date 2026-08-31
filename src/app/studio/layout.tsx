import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Studio",
  description: "Compound is an independent creative direction and spatial design studio creating worlds around objects, spaces, brands, gatherings, and experiences.",
  openGraph: {
    title:       "Studio · COMPOUND",
    description: "Compound is an independent creative direction and spatial design studio creating worlds around objects, spaces, brands, gatherings, and experiences.",
    images: [{ url: "/compound-loading-bg.jpg", width: 1920, height: 1080, alt: "Compound Studio" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Studio · COMPOUND",
    description: "An independent creative direction and spatial design studio.",
    images:      ["/compound-loading-bg.jpg"],
  },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
