import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Work",
  description: "Selected worlds composed by Compound: weddings, events, brand worlds, and spaces, commissioned and conceptual.",
  openGraph: {
    title:       "Work · COMPOUND",
    description: "Selected worlds composed by Compound: weddings, events, brand worlds, and spaces, commissioned and conceptual.",
    images: [{ url: "/compound-loading-bg.jpg", width: 1920, height: 1080, alt: "Compound Work" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Work · COMPOUND",
    description: "Selected worlds composed by Compound.",
    images:      ["/compound-loading-bg.jpg"],
  },
}

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
