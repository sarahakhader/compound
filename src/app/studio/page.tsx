"use client"

import { useEffect } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const SERVICES = [
  { n: "01", name: "Atmosphere direction" },
  { n: "02", name: "Material and colour palettes" },
  { n: "03", name: "Interior styling concepts" },
  { n: "04", name: "Product and collection storytelling" },
  { n: "05", name: "Website art direction" },
  { n: "06", name: "Launch visuals" },
  { n: "07", name: "Sourcing guidance" },
  { n: "08", name: "Brand world-building" },
]

const FOR_LIST = [
  "Boutique spaces",
  "Product launches",
  "Creative studios",
  "Hospitality concepts",
  "Interiors",
  "Campaigns",
  "Brands in need of a stronger visual world",
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

    /* Intro text */
    gsap.from(".stt-lead", {
      scrollTrigger: { trigger: ".stt-lead", start: "top 84%" },
      opacity: 0, y: 30, duration: 1.1, ease: "power3.out",
    })
    gsap.from(".stt-para", {
      scrollTrigger: { trigger: ".stt-intro-body", start: "top 80%" },
      opacity: 0, y: 28, duration: 0.9, ease: "power3.out", stagger: 0.22,
    })

    /* For list */
    gsap.from(".stt-for-item", {
      scrollTrigger: { trigger: ".stt-for-list", start: "top 82%" },
      opacity: 0, x: -16, duration: 0.65, ease: "power3.out", stagger: 0.09,
    })

    /* Services */
    gsap.from(".stt-service", {
      scrollTrigger: { trigger: ".stt-services-grid", start: "top 82%" },
      opacity: 0, y: 20, duration: 0.7, ease: "power3.out", stagger: 0.07,
    })

    /* Process */
    gsap.from(".stt-process-body", {
      scrollTrigger: { trigger: ".stt-process-section", start: "top 78%" },
      opacity: 0, y: 40, duration: 1.2, ease: "power3.out",
    })

    /* CTA */
    ScrollTrigger.create({
      trigger: ".stt-cta-word",
      start: "top 88%",
      once: true,
      onEnter: () => gsap.to(".stt-cta-word", { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power4.out", stagger: 0.12 }),
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <div className="studio-page">

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav className="stt-nav">
        <Link href="/" className="stt-back">← COMPOUND</Link>
        <span className="stt-nav-tag">STUDIO</span>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="stt-hero">
        <div className="stt-eyebrow">
          <span>Design Consulting</span>
          <span className="stt-dot">·</span>
          <span>Toronto</span>
        </div>

        <h1 className="stt-headline">
          <span className="stt-hl-line">The Architecture</span>
          <span className="stt-hl-line stt-hl-italic">of Atmosphere.</span>
        </h1>

        <div className="stt-hero-bottom">
          <p className="stt-hero-sub">
            Design consulting for atmospheres,<br />
            objects, interiors, and brand worlds.
          </p>
          <span className="stt-scroll-hint">↓</span>
        </div>
      </section>

      {/* ── INTRO ───────────────────────────────────────────────────── */}
      <section className="stt-intro-section">
        <p className="stt-lead">
          Compound Studio works with founders, creatives, and space-makers
          to translate feeling into form.
        </p>
        <div className="stt-intro-body">
          <p className="stt-para">
            Through material direction, colour systems, spatial concepts, product
            storytelling, and visual world-building, we help shape environments and
            brands that feel considered, memorable, and alive.
          </p>
          <p className="stt-para stt-para-em">
            This is not decoration for decoration's sake.<br />
            It is the architecture of atmosphere.
          </p>
        </div>
      </section>

      {/* ── FOR WHOM ────────────────────────────────────────────────── */}
      <section className="stt-for-section">
        <div className="stt-for-eyebrow">Made for</div>
        <ul className="stt-for-list">
          {FOR_LIST.map((item, i) => (
            <li key={i} className="stt-for-item">
              <span className="stt-for-rule" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────────── */}
      <section className="stt-services-section">
        <div className="stt-services-header">
          <span className="stt-services-eyebrow">Services</span>
          <div className="stt-services-divider" />
        </div>
        <div className="stt-services-grid">
          {SERVICES.map(s => (
            <div key={s.n} className="stt-service">
              <span className="stt-service-num">{s.n}</span>
              <span className="stt-service-name">{s.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROCESS ─────────────────────────────────────────────────── */}
      <section className="stt-process-section">
        <div className="stt-process-body">
          <p className="stt-process-text">
            Every project begins with excavation: the mood, the memory, the
            material, the feeling beneath the surface. From there, Compound
            composes a visual language that can be lived in, touched,
            photographed, sold, remembered, and returned to.
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="stt-cta-section">
        <p className="stt-cta-tag">Ready to begin?</p>
        <Link href="/#contact" className="stt-cta-link">
          <span className="stt-cta-word">Inquire</span>
          <span className="stt-cta-word">to build</span>
          <span className="stt-cta-word">a world.</span>
          <span className="stt-cta-arrow">↗</span>
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="stt-footer">
        <span className="stt-footer-brand">C O M P O U N D</span>
        <span className="stt-footer-tag">Studio · Toronto 2026</span>
      </footer>

    </div>
  )
}
