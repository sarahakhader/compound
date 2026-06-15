import type { NextConfig } from "next"

const CSP = [
  "default-src 'self'",
  // unsafe-eval: Three.js shader compilation + Next.js HMR in dev
  // unsafe-inline: Next.js hydration scripts + React inline event handlers
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // data: for canvas textures (THREE.CanvasTexture); blob: for WebGL buffers
  "img-src 'self' data: blob:",
  // Next.js self-hosts Google Fonts as data URIs
  "font-src 'self' data:",
  // No external API calls
  "connect-src 'self'",
  // Web worker support for potential future use
  "worker-src 'self' blob:",
  // Block all framing
  "frame-ancestors 'none'",
  // No plugins
  "object-src 'none'",
  // No base tag overrides
  "base-uri 'self'",
  // All form submissions stay on-site
  "form-action 'self'",
].join("; ")

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options",          value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options",   value: "nosniff" },
          // Disable DNS prefetching
          { key: "X-DNS-Prefetch-Control",   value: "off" },
          // Minimal referrer leakage
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          // Restrict browser features
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Force HTTPS for 1 year once visited (production)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Full content security policy
          { key: "Content-Security-Policy",  value: CSP },
        ],
      },
    ]
  },
}

export default nextConfig
