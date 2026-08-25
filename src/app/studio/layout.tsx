import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compound Studio",
  description: "Design consulting for atmospheres, objects, interiors, and brand worlds. Compound Studio works with founders, creatives, and space-makers to translate feeling into form.",
  openGraph: {
    title:       "Compound Studio · COMPOUND",
    description: "Design consulting for atmospheres, objects, interiors, and brand worlds.",
    images: [{ url: "/compound-loading-bg.jpg", width: 1920, height: 1080, alt: "Compound Studio" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Compound Studio · COMPOUND",
    description: "Design consulting for atmospheres, objects, interiors, and brand worlds.",
    images:      ["/compound-loading-bg.jpg"],
  },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
