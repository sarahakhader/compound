"use client"

import { useEffect } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const STANZAS = [
  { n: "01", title: "The Concept", body: "The creative idea behind the celebration." },
  { n: "02", title: "The Palette", body: "Colour, material, texture, and floral language." },
  { n: "03", title: "The Space", body: "Ceremony, reception, tablescapes, signage, and spatial moments." },
  { n: "04", title: "The Details", body: "Menus, invitations, place cards, custom objects, and guest experiences." },
  { n: "05", title: "The Atmosphere", body: "Lighting, music direction, scent, photography direction, and sensory details." },
]

export default function WeddingsPage() {

  useEffect(() => {
    gsap.from(".stt-eyebrow", { opacity: 0, y: -14, duration: 0.9, ease: "power3.out", delay: 0.25 })
    gsap.from(".stt-hero-sub",  { opacity: 0, y: 18,  duration: 0.9, ease: "power3.out", delay: 0.55 })
    gsap.from(".stt-scroll-hint", { opacity: 0, duration: 0.8, delay: 1.1 })

    ScrollTrigger.create({
      trigger: ".stt-headline",
      start: "top 95%",
      once: true,
      onEnter: () => gsap.to(".stt-headline", { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "power4.out" }),
    })

    gsap.from(".stt-lead", {
      scrollTrigger: { trigger: ".stt-lead", start: "top 84%" },
      opacity: 0, y: 30, duration: 1.1, ease: "power3.out",
    })

    gsap.from(".stt-wed-stanza", {
      scrollTrigger: { trigger: ".stt-wed-stanzas", start: "top 82%" },
      opacity: 0, y: 24, duration: 0.75, ease: "power3.out", stagger: 0.1,
    })

    document.querySelectorAll<HTMLElement>(".stt-cta-link").forEach(link => {
      const words = link.querySelectorAll(".stt-cta-word")
      ScrollTrigger.create({
        trigger: link, start: "top 88%", once: true,
        onEnter: () => gsap.to(words, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power4.out", stagger: 0.12 }),
      })
    })
    gsap.from(".stt-cta-sub", {
      scrollTrigger: { trigger: ".stt-cta-sub", start: "top 92%" },
      opacity: 0, y: 12, duration: 0.9, ease: "power3.out",
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <div className="studio-page">

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav className="stt-nav">
        <Link href="/services" className="stt-back">← SERVICES</Link>
        <span className="stt-nav-tag">WEDDING CREATIVE DIRECTION</span>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="stt-hero">
        <div className="stt-eyebrow">
          <span>Wedding Creative Direction</span>
          <span className="stt-dot">·</span>
          <span>Toronto</span>
        </div>

        <div className="stt-headline-cloud">
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <span className="stt-cloud-bump" aria-hidden="true" />
          <h1 className="stt-headline" style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontStyle: 'normal' }}>
            <span className="stt-hl-line">A wedding,</span>
            <span className="stt-hl-line">composed.</span>
          </h1>
        </div>

        <div className="stt-hero-bottom">
          <p className="stt-hero-sub">
            Compound approaches weddings as complete sensory environments: designing the colours,<br />
            materials, objects, spaces, details, and atmosphere that make the day feel unmistakably yours.
          </p>
          <span className="stt-scroll-hint">↓</span>
        </div>
      </section>

      {/* ── INTRO ───────────────────────────────────────────────────── */}
      <section className="stt-intro-section">
        <p className="stt-lead">
          We design the world around the occasion, from the first visual idea
          to the smallest material detail.
        </p>
      </section>

      {/* ── STANZAS ─────────────────────────────────────────────────── */}
      <section className="stt-wed-detail-section">
        <div className="stt-wed-stanzas stt-wed-stanzas-5">
          {STANZAS.map(s => (
            <div key={s.n} className="stt-wed-stanza">
              <span className="stt-wed-stanza-num">{s.n}</span>
              <p className="stt-wed-stanza-title">{s.title}</p>
              <p className="stt-wed-stanza-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="stt-cta-section">
        <p className="stt-cta-tag">Ready to begin?</p>
        <Link href="/#contact" className="stt-cta-link">
          <span className="stt-cta-word">Start a</span>
          <span className="stt-cta-word">wedding project.</span>
          <span className="stt-cta-arrow">↗</span>
        </Link>
        <p className="stt-cta-sub">
          We take on a limited number of weddings per season.<br />
          Send us your date and vision. We respond within 48 hours.
        </p>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="stt-footer">
        <span className="stt-footer-brand">C O M P O U N D</span>
        <span className="stt-footer-tag">Weddings · Toronto 2026</span>
      </footer>

    </div>
  )
}
