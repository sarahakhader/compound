"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { WORK, type WorkCategory } from "@/data/work"

gsap.registerPlugin(ScrollTrigger)

const FILTERS: { key: WorkCategory | "all" | "conceptual"; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "weddings",   label: "Weddings" },
  { key: "events",     label: "Events" },
  { key: "brands",     label: "Brands" },
  { key: "spaces",     label: "Spaces" },
  { key: "conceptual", label: "Conceptual" },
]

export default function WorkPage() {
  const [filter, setFilter] = useState<WorkCategory | "all" | "conceptual">("all")

  const projects = WORK.filter(p => {
    if (filter === "all") return true
    if (filter === "conceptual") return p.status === "Conceptual"
    return p.filterCategory === filter
  })

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".wk-eyebrow, .wk-headline",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.2 },
      )
      gsap.fromTo(".wk-filter",
        { opacity: 0, y: 12 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.04, delay: 0.5,
          onComplete: () => gsap.set(".wk-filter", { clearProps: "opacity,transform" }),
        },
      )
    })
    return () => { ctx.revert(); ScrollTrigger.getAll().forEach(t => t.kill()) }
  }, [])

  useEffect(() => {
    gsap.fromTo(".sw-card",
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 },
    )
  }, [filter])

  return (
    <div className="studio-page">

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav className="stt-nav">
        <Link href="/" className="stt-back">← COMPOUND</Link>
        <span className="stt-nav-tag">WORK · SELECTED PROJECTS</span>
      </nav>

      {/* ── INTRO ───────────────────────────────────────────────────── */}
      <section className="wk-hero">
        <p className="wk-eyebrow">Selected Work</p>
        <h1 className="wk-headline">Selected worlds, composed by Compound.</h1>
      </section>

      {/* ── FILTERS + GRID ──────────────────────────────────────────── */}
      <section className="wk-section">
        <div className="wk-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`wk-filter${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="sw-grid wk-grid">
          {projects.map(p => (
            <Link key={p.slug} href={`/work/${p.slug}`} className="sw-card" style={{ background: p.hex }}>
              <span className="sw-card-badge">{p.status}</span>
              <div className="sw-card-text">
                <h3 className="sw-card-title">{p.title}</h3>
                <p className="sw-card-meta">{p.category} · {p.location} · {p.year}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="stt-footer">
        <span className="stt-footer-brand">C O M P O U N D</span>
        <span className="stt-footer-tag">Work · Toronto 2026</span>
      </footer>

    </div>
  )
}
