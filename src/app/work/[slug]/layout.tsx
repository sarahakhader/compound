import type { Metadata } from "next"
import { WORK } from "@/data/work"

export function generateStaticParams() {
  return WORK.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project = WORK.find(p => p.slug === slug)
  if (!project) return { title: "Work" }

  return {
    title: project.title,
    description: project.concept,
    openGraph: {
      title:       `${project.title} · COMPOUND`,
      description: project.concept,
      images: [{ url: "/compound-loading-bg.jpg", width: 1920, height: 1080, alt: project.title }],
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${project.title} · COMPOUND`,
      description: project.concept,
      images:      ["/compound-loading-bg.jpg"],
    },
  }
}

export default function WorkDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
