"use client"

import { useEffect } from "react"
import { useParams, notFound } from "next/navigation"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { WORK } from "@/data/work"

gsap.registerPlugin(ScrollTrigger)

export default function WorkDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const project = WORK.find(p => p.slug === slug)

  useEffect(() => {
    if (!project) return
    gsap.fromTo(".wk-detail-title, .wk-detail-meta",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.2 },
    )
    gsap.fromTo(".wk-stanza",
      { opacity: 0, y: 24 },
      {
        scrollTrigger: { trigger: ".wk-stanzas", start: "top 82%" },
        opacity: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.1,
      },
    )
    document.querySelectorAll<HTMLElement>(".cta-link").forEach(link => {
      const words = link.querySelectorAll(".cta-word")
      ScrollTrigger.create({
        trigger: link, start: "top 88%", once: true,
        onEnter: () => gsap.to(words, { clipPath: "inset(0 0% 0 0)", duration: 1.2, ease: "power4.out", stagger: 0.1 }),
      })
    })
    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [project])

  if (!project) notFound()

  return (
    <div className="studio-page">

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav className="stt-nav">
        <Link href="/work" className="stt-back">← WORK</Link>
        <span className="stt-nav-tag">{project.status.toUpperCase()}</span>
      </nav>

      {/* ── HERO PANEL ──────────────────────────────────────────────── */}
      <section className="wk-detail-hero" style={{ background: project.hex }}>
        <span className="wk-detail-badge">{project.status}</span>
        <h1 className="wk-detail-title">{project.title}</h1>
        <p className="wk-detail-meta">{project.category} · {project.location} · {project.year}</p>
      </section>

      {/* ── STANZAS ─────────────────────────────────────────────────── */}
      <section className="wk-detail-body">
        <div className="wk-stanzas">
          <div className="wk-stanza">
            <span className="wk-stanza-num">01</span>
            <p className="wk-stanza-title">Concept</p>
            <p className="wk-stanza-body">{project.concept}</p>
          </div>
          <div className="wk-stanza">
            <span className="wk-stanza-num">02</span>
            <p className="wk-stanza-title">Direction</p>
            <p className="wk-stanza-body">{project.direction}</p>
          </div>
          <div className="wk-stanza">
            <span className="wk-stanza-num">03</span>
            <p className="wk-stanza-title">Material Language</p>
            <p className="wk-stanza-body">{project.material}</p>
          </div>
          <div className="wk-stanza">
            <span className="wk-stanza-num">04</span>
            <p className="wk-stanza-title">Experience</p>
            <p className="wk-stanza-body">{project.experience}</p>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="stt-cta-section">
        <p className="stt-cta-tag">Have something worth designing?</p>
        <Link href="/#contact" className="cta-link wk-detail-cta">
          <span className="cta-word">Start a</span>
          <span className="cta-word">project</span>
          <span className="cta-arrow">↗</span>
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="stt-footer">
        <span className="stt-footer-brand">C O M P O U N D</span>
        <span className="stt-footer-tag">Work · Toronto 2026</span>
      </footer>

    </div>
  )
}
