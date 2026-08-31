import type { NextConfig } from "next"

const CSP = [
  "default-src 'self'",
  // unsafe-eval: Three.js GLSL shader compilation + Next.js HMR in dev
  // unsafe-inline: Next.js hydration scripts + React inline event handlers
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // data: for THREE.CanvasTexture; blob: for WebGL buffers / audio
  "img-src 'self' data: blob:",
  // Next.js self-hosts Google Fonts as data URIs
  "font-src 'self' data:",
  // Only same-origin fetches (contact form → /api/contact)
  "connect-src 'self'",
  // Web workers (Three.js, potential future use)
  "worker-src 'self' blob:",
  // Audio for the game
  "media-src 'self' blob:",
  // Block all framing
  "frame-ancestors 'none'",
  // No plugins (Flash, PDF, etc.)
  "object-src 'none'",
  // No base tag overrides
  "base-uri 'self'",
  // All form submissions stay on-site
  "form-action 'self'",
  // WebGL / canvas
  "manifest-src 'self'",
].join("; ")

const PERMISSIONS_POLICY = [
  "accelerometer=()",
  "ambient-light-sensor=()",
  "autoplay=()",
  "battery=()",
  "camera=()",
  "display-capture=()",
  "document-domain=()",
  "encrypted-media=()",
  "execution-while-not-rendered=()",
  "execution-while-out-of-viewport=()",
  "fullscreen=(self)",    // allow game to go fullscreen on this origin
  "geolocation=()",
  "gyroscope=()",
  "keyboard-map=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "navigation-override=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "serial=()",
  "sync-xhr=()",
  "usb=()",
  "web-share=()",
  "xr-spatial-tracking=()",
].join(", ")

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/blankets", destination: "/objects", permanent: true },
    ]
  },
  async headers() {
    return [
      /* ── All routes ───────────────────────────────────────────────────── */
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options",              value: "DENY" },
          // Prevent MIME-type sniffing attacks
          { key: "X-Content-Type-Options",       value: "nosniff" },
          // Disable DNS prefetching
          { key: "X-DNS-Prefetch-Control",       value: "off" },
          // Minimal referrer leakage
          { key: "Referrer-Policy",              value: "strict-origin-when-cross-origin" },
          // Restrict browser feature access
          { key: "Permissions-Policy",           value: PERMISSIONS_POLICY },
          // Force HTTPS for 1 year (production)
          { key: "Strict-Transport-Security",    value: "max-age=31536000; includeSubDomains; preload" },
          // Isolate browsing context (prevents cross-origin attacks via window.opener)
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
          // Prevent other sites from loading our resources
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          // No cross-domain Flash / PDF policies
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          // Full content security policy
          { key: "Content-Security-Policy",      value: CSP },
        ],
      },

      /* ── API routes — never cache, never expose internals ─────────────── */
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma",        value: "no-cache" },
          { key: "Expires",       value: "0" },
        ],
      },
    ]
  },
}

export default nextConfig
