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
  { n: "06", name: "Launch visuals and campaign direction" },
  { n: "07", name: "Sourcing and maker guidance" },
  { n: "08", name: "Brand world-building" },
]

const FOR_LIST = [
  "Boutique retail and hospitality spaces",
  "Product and collection launches",
  "Creative studios and agencies",
  "Founders building a brand from scratch",
  "Interiors seeking a stronger visual identity",
  "Campaign and editorial projects",
  "Brands in need of a sharper visual world",
]

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Discovery",
    body: "We begin with an immersive brief — your brand history, spatial context, existing references, and the feeling you're reaching for. This is where we learn what you are, and what you're building toward.",
  },
  {
    n: "02",
    title: "Direction",
    body: "We compose a complete visual and material language: colour systems, texture palettes, atmosphere references, and creative direction tailored to your specific project and audience.",
  },
  {
    n: "03",
    title: "Delivery",
    body: "Final direction documents, curated reference systems, and assets delivered in a format your team, photographer, contractor, or maker can execute from immediately.",
  },
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
    gsap.from(".stt-services-note", {
      scrollTrigger: { trigger: ".stt-services-note", start: "top 88%" },
      opacity: 0, y: 14, duration: 0.8, ease: "power3.out",
    })

    /* Process steps */
    gsap.from(".stt-process-step", {
      scrollTrigger: { trigger: ".stt-process-steps", start: "top 80%" },
      opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.18,
    })

    /* CTA */
    ScrollTrigger.create({
      trigger: ".stt-cta-word",
      start: "top 88%",
      once: true,
      onEnter: () => gsap.to(".stt-cta-word", { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power4.out", stagger: 0.12 }),
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
        <span className="stt-nav-tag">STUDIO · CONSULTING</span>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="stt-hero">
        <div className="stt-eyebrow">
          <span>Design Consulting</span>
          <span className="stt-dot">·</span>
          <span>Toronto</span>
          <span className="stt-dot">·</span>
          <span>Available for new projects</span>
        </div>

        <h1 className="stt-headline">
          <span className="stt-hl-line">The Architecture</span>
          <span className="stt-hl-line stt-hl-italic">of Atmosphere.</span>
        </h1>

        <div className="stt-hero-bottom">
          <p className="stt-hero-sub">
            A consulting studio that shapes the visual and<br />
            material identity of spaces, brands, and objects.
          </p>
          <span className="stt-scroll-hint">↓</span>
        </div>
      </section>

      {/* ── INTRO ───────────────────────────────────────────────────── */}
      <section className="stt-intro-section">
        <p className="stt-lead">
          Compound Studio partners with founders, creative directors,
          and space-makers to translate feeling into a tangible visual language.
        </p>
        <div className="stt-intro-body">
          <p className="stt-para">
            We function as an embedded creative partner — directing the visual
            and material language of your project from concept through to execution.
            Our work spans interiors, brand identities, campaigns, and product launches.
          </p>
          <p className="stt-para">
            We take on a limited number of engagements each season, working closely
            with each client to ensure the direction is singular, considered,
            and entirely built around who they are.
          </p>
          <p className="stt-para stt-para-em">
            This is not decoration for decoration&apos;s sake.<br />
            It is the architecture of atmosphere.
          </p>
        </div>
      </section>

      {/* ── FOR WHOM ────────────────────────────────────────────────── */}
      <section className="stt-for-section">
        <div className="stt-for-eyebrow">We work with</div>
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
        <p className="stt-services-note">
          All engagements include a written creative brief, a curated direction
          document, and a reference system your team — photographer, contractor,
          or maker — can execute from immediately.
        </p>
      </section>

      {/* ── PROCESS ─────────────────────────────────────────────────── */}
      <section className="stt-process-section">
        <div className="stt-process-body">
          <p className="stt-process-intro">How a project works.</p>
          <div className="stt-process-steps">
            {PROCESS_STEPS.map(s => (
              <div key={s.n} className="stt-process-step">
                <span className="stt-process-step-num">{s.n}</span>
                <div className="stt-process-step-content">
                  <p className="stt-process-step-title">{s.title}</p>
                  <p className="stt-process-step-body">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="stt-cta-section">
        <p className="stt-cta-tag">Ready to begin?</p>
        <Link href="/#contact" className="stt-cta-link">
          <span className="stt-cta-word">Start a</span>
          <span className="stt-cta-word">project.</span>
          <span className="stt-cta-arrow">↗</span>
        </Link>
        <p className="stt-cta-sub">
          We take on a limited number of engagements per season.<br />
          Send us your brief — we respond within 48 hours.
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
