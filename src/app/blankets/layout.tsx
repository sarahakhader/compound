import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bedrock Blankets",
  description: "100% cotton blankets woven through colour, texture, and form. Designed to comfort the body while altering the atmosphere of any room.",
  openGraph: {
    title:       "Bedrock Blankets — COMPOUND",
    description: "100% cotton blankets woven through colour, texture, and form. Designed to comfort the body while altering the atmosphere of any room.",
    images: [{ url: "/blankets/BB1AF208-8C25-4288-8121-BD95818FAEA7_p1.jpg", width: 1200, height: 1500, alt: "Bedrock Blanket — COMPOUND" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Bedrock Blankets — COMPOUND",
    description: "100% cotton blankets woven through colour, texture, and form.",
    images:      ["/blankets/BB1AF208-8C25-4288-8121-BD95818FAEA7_p1.jpg"],
  },
}

export default function BlanketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
