"use client"

import { useEffect } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const MEANINGS = [
  { n: "01", title: "Composition", body: "Different materials, forms, colours, ideas, and people coming together to create something greater than their individual parts." },
  { n: "02", title: "Gathering", body: "A compound as a place where things, people, and ideas come together." },
  { n: "03", title: "Value", body: "Something becoming more meaningful through combination, accumulation, and time." },
]

export default function StudioPage() {

  useEffect(() => {
    /* Hero entrance */
    gsap.from(".stt-eyebrow", { opacity: 0, y: -14, duration: 0.9, ease: "power3.out", delay: 0.25 })
    gsap.from(".stt-hero-sub",  { opacity: 0, y: 18,  duration: 0.9, ease: "power3.out", delay: 0.55 })
    gsap.from(".stt-scroll-hint", { opacity: 0, duration: 0.8, delay: 1.1 })

    ScrollTrigger.create({
      trigger: ".stt-headline",
      start: "top 95%",
      once: true,
      onEnter: () => gsap.to(".stt-headline", { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "power4.out" }),
    })

    /* Intro */
    gsap.from(".stt-lead", {
      scrollTrigger: { trigger: ".stt-lead", start: "top 84%" },
      opacity: 0, y: 30, duration: 1.1, ease: "power3.out",
    })

    /* Meanings */
    gsap.from(".stt-wed-stanza", {
      scrollTrigger: { trigger: ".stt-meanings-section .stt-wed-stanzas", start: "top 82%" },
      opacity: 0, y: 24, duration: 0.75, ease: "power3.out", stagger: 0.12,
    })

    /* Philosophy */
    gsap.from(".stt-philosophy-line, .stt-philosophy-body, .stt-philosophy-closing p", {
      scrollTrigger: { trigger: ".stt-philosophy-section", start: "top 78%", end: "bottom 20%", scrub: 0.5 },
      opacity: 0, y: 30, stagger: 0.12, ease: "power2.out",
    })

    /* CTA */
    document.querySelectorAll<HTMLElement>(".stt-cta-link").forEach(link => {
      const parts = link.querySelectorAll(".stt-cta-word, .stt-cta-arrow")
      ScrollTrigger.create({
        trigger: link, start: "top 88%", once: true,
        onEnter: () => gsap.to(parts, { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power4.out", stagger: 0.12 }),
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
        <Link href="/" className="stt-back">← COMPOUND</Link>
        <span className="stt-nav-tag">STUDIO · COMPOUND</span>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="stt-hero">
        <div className="stt-eyebrow">
          <span>Creative Direction</span>
          <span className="stt-dot">·</span>
          <span>Spatial Design</span>
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
            <span className="stt-hl-line">The name holds</span>
            <span className="stt-hl-line">more than one truth.</span>
          </h1>
        </div>

        <div className="stt-hero-bottom">
          <p className="stt-hero-sub">
            Compound is an independent creative direction and spatial design studio<br />
            creating worlds around objects, spaces, brands, gatherings, and experiences.
          </p>
          <span className="stt-scroll-hint">↓</span>
        </div>
      </section>

      {/* ── INTRO ───────────────────────────────────────────────────── */}
      <section className="stt-intro-section">
        <p className="stt-lead">
          A living archive of objects, materials, and ideas. A world composed by design,
          grounded in the memory of the Earth.
        </p>
      </section>

      {/* ── THREE MEANINGS ──────────────────────────────────────────── */}
      <section className="stt-meanings-section stt-services-section">
        <div className="stt-services-header">
          <span className="stt-services-eyebrow">Three Meanings</span>
          <div className="stt-services-divider" />
        </div>
        <div className="stt-wed-stanzas">
          {MEANINGS.map(m => (
            <div key={m.n} className="stt-wed-stanza">
              <span className="stt-wed-stanza-num">{m.n}</span>
              <p className="stt-wed-stanza-title">{m.title}</p>
              <p className="stt-wed-stanza-body">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PHILOSOPHY ──────────────────────────────────────────────── */}
      <section className="stt-philosophy-section">
        <p className="stt-philosophy-line">
          From these meanings, a philosophy: beauty is layered. Interconnected. Made to endure.
        </p>
        <p className="stt-philosophy-body">
          Here, the familiar becomes strange. Nature appears as if imagined. Objects emerge
          as though excavated, from a past beyond memory, or a future not yet arrived.
        </p>
        <div className="stt-philosophy-closing">
          <p>A landscape of material memory.</p>
          <p>A future remembered through design.</p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="stt-cta-section">
        <p className="stt-cta-tag">Want to see what we make of it?</p>
        <Link href="/services" className="stt-cta-link">
          <span className="stt-cta-word">Explore</span>
          <span className="stt-cta-word">services.</span>
          <span className="stt-cta-arrow">↗</span>
        </Link>
        <p className="stt-cta-sub">
          Creative direction, events and experiences, spatial design, and brand worlds.
        </p>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="stt-footer">
        <span className="stt-footer-brand">C O M P O U N D</span>
        <span className="stt-footer-tag">Studio · Toronto 2026</span>
      </footer>

    </div>
  )
}
