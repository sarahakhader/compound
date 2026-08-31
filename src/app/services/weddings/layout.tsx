import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Weddings",
  description: "Compound approaches weddings as complete sensory environments, designing the colours, materials, objects, spaces, details, and atmosphere that make the day feel unmistakably yours.",
  openGraph: {
    title:       "Weddings · COMPOUND",
    description: "Compound approaches weddings as complete sensory environments, designing the colours, materials, objects, spaces, details, and atmosphere that make the day feel unmistakably yours.",
    images: [{ url: "/compound-loading-bg.jpg", width: 1920, height: 1080, alt: "Compound Weddings" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Weddings · COMPOUND",
    description: "Compound approaches weddings as complete sensory environments.",
    images:      ["/compound-loading-bg.jpg"],
  },
}

export default function WeddingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
