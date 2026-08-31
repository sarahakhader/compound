import type { MetadataRoute } from "next"
import { WORK } from "@/data/work"

const BASE = "https://www.whatiscompound.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                          lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/services`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/services/weddings`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/studio`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/work`,                lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    ...WORK.map(p => ({
      url: `${BASE}/work/${p.slug}`,      lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.75,
    })),
    { url: `${BASE}/objects`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/story`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/universe`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ]
}
