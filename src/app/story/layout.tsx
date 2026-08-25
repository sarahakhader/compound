import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Colour Stories",
  description: "Nine colour stories drawn from the natural to the surreal: mineral blues, heated oranges, botanical plums, and acidic greens. Each one a world.",
  openGraph: {
    title:       "Colour Stories · COMPOUND",
    description: "Nine colour stories drawn from the natural to the surreal. Each one a world.",
    images: [{ url: "/compound-loading-bg.jpg", width: 1920, height: 1080, alt: "COMPOUND Colour Stories" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Colour Stories · COMPOUND",
    description: "Nine colour stories drawn from the natural to the surreal.",
    images:      ["/compound-loading-bg.jpg"],
  },
}

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
