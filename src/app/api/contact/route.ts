import { NextRequest, NextResponse } from "next/server"

/* ── In-memory rate limiter (per function instance) ──────────────────────────
   Limits each IP to LIMIT submissions per WINDOW.
   For multi-instance deployments, swap hitMap for a Redis/KV store.          */
const hitMap = new Map<string, { n: number; reset: number }>()
const LIMIT  = 3            // max 3 form submissions
const WINDOW = 3_600_000    // per hour in ms

function checkRate(ip: string): boolean {
  const now  = Date.now()
  const slot = hitMap.get(ip)
  if (!slot || now > slot.reset) {
    hitMap.set(ip, { n: 1, reset: now + WINDOW })
    return true
  }
  if (slot.n >= LIMIT) return false
  slot.n++
  return true
}

/* ── Strip HTML and enforce max length ────────────────────────────────────── */
function sanitise(val: unknown, max: number): string {
  if (typeof val !== "string") return ""
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim()
    .slice(0, max)
}

/* ── POST /api/contact ────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {

  /* ── Reject cross-origin requests ── */
  const origin = req.headers.get("origin") ?? ""
  const host   = req.headers.get("host")   ?? ""
  if (origin && !origin.includes(host)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  /* ── Rate limit ── */
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"

  if (!checkRate(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "3600" } }
    )
  }

  /* ── Parse body ── */
  let raw: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object")
    }
    raw = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  /* ── Validate & sanitise fields ── */
  const firstName = sanitise(raw.firstName, 80)
  const lastName  = sanitise(raw.lastName,  80)
  const email     = sanitise(raw.email,     254)
  const company   = sanitise(raw.company,   120)
  const message   = sanitise(raw.message,   2000)

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 })
  }

  /* ── Honeypot — bots fill in hidden fields, humans don't ── */
  if (raw._hp) {
    return NextResponse.json({ ok: true })
  }

  /* ── Deliver via Resend (optional — set RESEND_API_KEY in .env.local) ── */
  const resendKey    = process.env.RESEND_API_KEY
  const toEmail      = process.env.CONTACT_EMAIL ?? "thecompoundlabs@gmail.com"
  const fromAddress  = process.env.EMAIL_FROM    ?? "Compound Contact <onboarding@resend.dev>"

  if (resendKey) {
    const body = [
      `Name:    ${firstName} ${lastName}`,
      company ? `Company: ${company}` : null,
      `Email:   ${email}`,
      message  ? `\nMessage:\n${message}` : "",
    ].filter(Boolean).join("\n")

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:     fromAddress,
          to:       [toEmail],
          reply_to: email,
          subject:  `Compound inquiry — ${firstName} ${lastName}`,
          text:     body,
        }),
      })

      if (!r.ok) {
        console.error("[contact] Resend error:", r.status, await r.text())
        return NextResponse.json({ error: "Could not send message." }, { status: 502 })
      }
    } catch (err) {
      console.error("[contact] Resend network error:", err)
      return NextResponse.json({ error: "Could not send message." }, { status: 502 })
    }
  } else {
    /* Dev / no email service: log locally so submissions aren't silently lost */
    console.log("[contact] New inquiry (configure RESEND_API_KEY to deliver):", {
      firstName, lastName, company, email,
      message: message.slice(0, 120) + (message.length > 120 ? "…" : ""),
    })
  }

  return NextResponse.json({ ok: true })
}

/* Block all other HTTP methods */
export async function GET()    { return NextResponse.json({ error: "Method not allowed" }, { status: 405 }) }
export async function PUT()    { return NextResponse.json({ error: "Method not allowed" }, { status: 405 }) }
export async function DELETE() { return NextResponse.json({ error: "Method not allowed" }, { status: 405 }) }
export async function PATCH()  { return NextResponse.json({ error: "Method not allowed" }, { status: 405 }) }
