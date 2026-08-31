"use client"

import { useEffect } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const DISCIPLINES = [
  {
    name: "Creative Direction",
    items: ["Concept development", "Creative strategy", "Art direction", "Visual direction", "Moodboards", "Material direction", "Colour direction", "Content direction"],
  },
  {
    name: "Events & Experiences",
    items: ["Weddings", "Private dinners", "Pop-ups", "Launches", "Brand activations", "Installations", "Experiential events"],
  },
  {
    name: "Spatial Design",
    items: ["Tablescapes", "Spatial styling", "Floral direction", "Signage", "Environmental details", "Set design", "Guest experience"],
  },
  {
    name: "Brand Worlds",
    items: ["Brand launches", "Retail concepts", "Product launches", "Campaign direction", "Small business creative direction", "Visual identities"],
  },
]

const FOR_LIST = [
  "Boutique retail and hospitality spaces",
  "Couples and hosts composing a wedding or celebration",
  "Product and collection launches",
  "Creative studios and agencies",
  "Founders building a brand from scratch",
  "Interiors seeking a stronger visual identity",
  "Campaign and editorial projects",
  "Brands in need of a sharper visual world",
]

const WEDDING_STANZAS = [
  { n: "01", title: "The Concept", body: "The creative idea behind the celebration." },
  { n: "02", title: "The Palette", body: "Colour, material, texture, and floral language." },
  { n: "03", title: "The Space", body: "Ceremony, reception, tablescapes, and spatial moments." },
]

const SMALL_BIZ_ITEMS = [
  "Store launches", "Pop-ups", "Product launches", "Brand refreshes",
  "Interior styling", "Content direction", "Campaign concepts", "Events", "Installations",
]

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Discovery",
    body: "We begin with an immersive brief: your brand history, spatial context, existing references, and the feeling you're reaching for. This is where we learn what you are, and what you're building toward.",
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

export default function ServicesPage() {

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

    /* Disciplines */
    gsap.from(".stt-discipline", {
      scrollTrigger: { trigger: ".stt-disciplines", start: "top 82%" },
      opacity: 0, y: 24, duration: 0.75, ease: "power3.out", stagger: 0.1,
    })

    /* Weddings */
    gsap.from(".stt-wed-eyebrow, .stt-wed-title, .stt-wed-body", {
      scrollTrigger: { trigger: ".stt-wed-section", start: "top 82%" },
      opacity: 0, y: 24, duration: 0.8, ease: "power3.out", stagger: 0.1,
    })
    gsap.from(".stt-wed-stanza", {
      scrollTrigger: { trigger: ".stt-wed-stanzas", start: "top 85%" },
      opacity: 0, y: 20, duration: 0.7, ease: "power3.out", stagger: 0.1,
    })

    /* Small business */
    gsap.from(".stt-sb-title, .stt-sb-body", {
      scrollTrigger: { trigger: ".stt-sb-section", start: "top 82%" },
      opacity: 0, y: 24, duration: 0.8, ease: "power3.out", stagger: 0.1,
    })
    gsap.from(".stt-sb-list li", {
      scrollTrigger: { trigger: ".stt-sb-list", start: "top 85%" },
      opacity: 0, y: 14, duration: 0.6, ease: "power3.out", stagger: 0.05,
    })

    /* Process steps */
    gsap.from(".stt-process-step", {
      scrollTrigger: { trigger: ".stt-process-steps", start: "top 80%" },
      opacity: 0, y: 30, duration: 0.8, ease: "power3.out", stagger: 0.18,
    })

    /* Big arrow-link CTAs — clip-path reveal, one instance per link */
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
        <span className="stt-nav-tag">SERVICES · CREATIVE DIRECTION</span>
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
          <h1 className="stt-headline" style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontStyle: 'normal' }}>
            <span className="stt-hl-line">We design the world</span>
            <span className="stt-hl-line" style={{ fontStyle: 'normal' }}>around the idea.</span>
          </h1>
        </div>

        <div className="stt-hero-bottom">
          <p className="stt-hero-sub">
            From intimate gatherings to emerging brands, Compound develops the visual,<br />
            spatial, and sensory language that makes an experience feel complete.
          </p>
          <span className="stt-scroll-hint">↓</span>
        </div>
      </section>

      {/* ── INTRO ───────────────────────────────────────────────────── */}
      <section className="stt-intro-section">
        <p className="stt-lead">
          Compound partners with founders, hosts, creative directors,
          and space makers to translate feeling into a tangible visual language.
        </p>
        <div className="stt-intro-body">
          <p className="stt-para">
            We function as an embedded creative partner, directing the visual
            and material language of your project from concept through to execution.
            Our work spans weddings, events, interiors, brand identities, and product launches.
          </p>
          <p className="stt-para">
            We take on a limited number of engagements each season, working closely
            with each client to ensure the direction is singular, considered,
            and entirely built around who they are.
          </p>
          <p className="stt-para stt-para-em" style={{ fontFamily: 'var(--sans)', fontWeight: 900, fontStyle: 'normal' }}>
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

      {/* ── DISCIPLINES ─────────────────────────────────────────────── */}
      <section className="stt-services-section">
        <div className="stt-services-header">
          <span className="stt-services-eyebrow">Services</span>
          <div className="stt-services-divider" />
        </div>
        <div className="stt-disciplines">
          {DISCIPLINES.map(d => (
            <div key={d.name} className="stt-discipline">
              <h3 className="stt-discipline-name">{d.name}</h3>
              <ul className="stt-discipline-list">
                {d.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="stt-services-note">
          All engagements include a written creative brief, a curated direction
          document, and a reference system your team (photographer, contractor,
          or maker) can execute from immediately.
        </p>
      </section>

      {/* ── WEDDINGS ────────────────────────────────────────────────── */}
      <section className="stt-wed-section">
        <p className="stt-wed-eyebrow">Weddings</p>
        <h2 className="stt-wed-title">A wedding, composed.</h2>
        <p className="stt-wed-body">
          Compound approaches weddings as complete sensory environments: designing the colours,
          materials, objects, spaces, details, and atmosphere that make the day feel unmistakably yours.
        </p>
        <div className="stt-wed-stanzas">
          {WEDDING_STANZAS.map(s => (
            <div key={s.n} className="stt-wed-stanza">
              <span className="stt-wed-stanza-num">{s.n}</span>
              <p className="stt-wed-stanza-title">{s.title}</p>
              <p className="stt-wed-stanza-body">{s.body}</p>
            </div>
          ))}
        </div>
        <Link href="/services/weddings" className="stt-cta-link stt-wed-cta">
          <span className="stt-cta-word">Design your</span>
          <span className="stt-cta-word">wedding.</span>
          <span className="stt-cta-arrow">↗</span>
        </Link>
      </section>

      {/* ── SMALL BUSINESSES ────────────────────────────────────────── */}
      <section className="stt-sb-section">
        <p className="stt-sb-tag">For the small &amp; unexpected</p>
        <p className="stt-sb-title">Independent businesses. Founders. Emerging brands.</p>
        <p className="stt-sb-body">
          Compound works with independent businesses, founders, and emerging brands
          to build visual worlds around what they make.
        </p>
        <ul className="stt-sb-list">
          {SMALL_BIZ_ITEMS.map(item => <li key={item}>{item}</li>)}
        </ul>
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
          Send us your brief. We respond within 48 hours.
        </p>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="stt-footer">
        <span className="stt-footer-brand">C O M P O U N D</span>
        <span className="stt-footer-tag">Services · Toronto 2026</span>
      </footer>

    </div>
  )
}
