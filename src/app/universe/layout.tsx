import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compound World",
  description: "A real time 3D city with six districts, each with its own material identity. Enter the Compound universe.",
  openGraph: {
    title:       "Compound World · COMPOUND",
    description: "A real time 3D city with six districts, each with its own material identity.",
    images: [{ url: "/compound-loading-bg.jpg", width: 1920, height: 1080, alt: "Compound World · Cyberpunk City" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Compound World · COMPOUND",
    description: "A real time 3D city with six districts, each with its own material identity.",
    images:      ["/compound-loading-bg.jpg"],
  },
}

export default function UniverseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
