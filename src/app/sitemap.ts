import type { MetadataRoute } from "next"

const BASE = "https://www.whatiscompound.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                   lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/blankets`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/story`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/universe`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/studio`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  ]
}
