"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import TextCursorProximity from "@/components/ui/text-cursor-proximity"
import { motion, AnimatePresence } from "motion/react"
import { WORK } from "@/data/work"

const HELLOS = [
  "Hello", "Bonjour", "Hola", "Ciao", "Hallo", "Olá",
  "Merhaba", "Salut", "Hei", "こんにちは", "안녕하세요",
  "你好", "مرحبا", "नमस्ते", "Sawubona", "Привет",
]

/* Homepage shows a short preview; the full set lives at /work */
const SELECTED_WORK = WORK.slice(0, 4)

function CyclingHello() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % HELLOS.length), 3200)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", height: "1.2em", position: "relative", minWidth: "6ch" }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={index}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "inline-block", position: "absolute", left: 0 }}
        >
          {HELLOS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function HoverPopText({ text }: { text: string }) {
  return (
    <span>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          whileHover={{ scale: 1.18 }}
          transition={{ type: "spring", stiffness: 500, damping: 18 }}
          style={{ marginRight: "0.28em", cursor: "default" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

gsap.registerPlugin(ScrollTrigger)

const RINGS = [
  { r: 92,  fill: "#3A1A08" },
  { r: 79,  fill: "#8B3A1E" },
  { r: 64,  fill: "#CC4A12" },
  { r: 50,  fill: "#5C2510" },
  { r: 37,  fill: "#3D2645" },
  { r: 23,  fill: "#6ECECE" },
  { r: 9.5, fill: "#050403" },
]

function InteractiveLogoCircles() {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <>
      {RINGS.map((ring, i) => (
        <circle
          key={i}
          cx="100" cy="100"
          r={ring.r}
          fill={hovered === i ? "#B5CC45" : ring.fill}
          style={{
            transition: "fill 0.18s ease, transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transformBox: "fill-box",
            transformOrigin: "center",
            transform: hovered === i ? "scale(1.2)" : "scale(1)",
            cursor: "pointer",
          }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}
    </>
  )
}

const LogoCircles = () => (
  <>
    <circle cx="100" cy="100" r="92"  fill="#3A1A08"/>
    <circle cx="100" cy="100" r="79"  fill="#8B3A1E"/>
    <circle cx="100" cy="100" r="64"  fill="#CC4A12"/>
    <circle cx="100" cy="100" r="50"  fill="#5C2510"/>
    <circle cx="100" cy="100" r="37"  fill="#3D2645"/>
    <circle cx="100" cy="100" r="23"  fill="#6ECECE"/>
    <circle cx="100" cy="100" r="9.5" fill="#050403"/>
  </>
)

export default function Home() {
  const [submitLabel, setSubmitLabel] = useState("SUBMIT ↗")
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [cyberpunk, setCyberpunk] = useState(false)

  useEffect(() => {
    const check = () => setCyberpunk(document.documentElement.classList.contains("cyberpunk-mode"))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])
  const heroBottomRef = useRef<HTMLDivElement>(null)
const plLogoRef = useRef<SVGSVGElement>(null)
  const preloaderRef = useRef<HTMLDivElement>(null)
  const logoMarkRef = useRef<SVGSVGElement>(null)

  /* ── Preloader + Hero Intro ──────────────────── */
  useEffect(() => {
    const plLogo = plLogoRef.current
    const preloader = preloaderRef.current
    const logoMark = logoMarkRef.current
    if (!plLogo || !preloader || !logoMark) return

    requestAnimationFrame(() => plLogo.classList.add("run"))
    setTimeout(() => plLogo.classList.add("colored"), 900)
    setTimeout(() => preloader.classList.add("gone"), 1800)

    setTimeout(() => {
      const tl = gsap.timeline()
      tl.to(logoMark, { opacity: 1, scale: 1, rotate: 0, duration: 1.8, ease: "power4.out" }, 0)
        .to(".hero-top-word", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 }, 0.3)
        .to([".hero-bl", ".hero-br"], { opacity: 0.7, duration: 0.9, ease: "power3.out", stagger: 0.08 }, 0.7)
        .to("#hero-bc", { clipPath: "inset(0 0% 0 0)", duration: 1.3, ease: "power4.out" }, 0.85)
    }, 2850)

    setTimeout(() => {
      gsap.to(logoMark, { rotate: 360, duration: 100, repeat: -1, ease: "none", transformOrigin: "50% 50%" })
    }, 2500)
  }, [])

  /* ── Scroll Animations ───────────────────────── */
  useEffect(() => {
    gsap.from(".at-intro, .at-pullquote, .at-definitions, .at-philosophy, .at-body, .at-closing p", {
      scrollTrigger: { trigger: "#manifesto", start: "top 85%", end: "bottom 15%", scrub: 0.5 },
      opacity: 0, y: 40, stagger: { each: 0.1 }, ease: "power2.out",
    })

    /* What We Do */
    gsap.from(".wwd-descriptor, .wwd-services-line", {
      scrollTrigger: { trigger: "#what-we-do", start: "top 85%" },
      opacity: 0, y: 20, duration: 0.8, ease: "power3.out", stagger: 0.1,
    })
    gsap.from(".wwd-headline, .wwd-body", {
      scrollTrigger: { trigger: ".wwd-headline", start: "top 88%" },
      opacity: 0, y: 30, duration: 0.9, ease: "power3.out", stagger: 0.12,
    })
    gsap.from(".wwd-disciplines .pillar", {
      scrollTrigger: { trigger: ".wwd-disciplines", start: "top 85%" },
      opacity: 0, y: 30, duration: 0.75, ease: "power3.out", stagger: 0.1,
    })

    /* Weddings */
    gsap.from(".wed-eyebrow, .wed-body", {
      scrollTrigger: { trigger: "#weddings", start: "top 82%" },
      opacity: 0, y: 24, duration: 0.85, ease: "power3.out", stagger: 0.1,
    })
    gsap.from(".wed-list li", {
      scrollTrigger: { trigger: ".wed-list", start: "top 85%" },
      opacity: 0, y: 14, duration: 0.6, ease: "power3.out", stagger: 0.05,
    })

    /* Five Senses */
    gsap.from(".fs-headline, .fs-intro", {
      scrollTrigger: { trigger: "#five-senses", start: "top 82%" },
      opacity: 0, y: 24, duration: 0.85, ease: "power3.out", stagger: 0.1,
    })
    gsap.from(".fs-item", {
      scrollTrigger: { trigger: ".fs-grid", start: "top 85%" },
      opacity: 0, y: 24, duration: 0.7, ease: "power3.out", stagger: 0.08,
    })

    /* Selected Work */
    gsap.from(".sw-tag, .sw-sub", {
      scrollTrigger: { trigger: "#selected-work", start: "top 85%" },
      opacity: 0, y: 18, duration: 0.7, ease: "power3.out", stagger: 0.08,
    })
    gsap.from(".sw-card", {
      scrollTrigger: { trigger: ".sw-grid", start: "top 85%" },
      opacity: 0, y: 34, duration: 0.8, ease: "power3.out", stagger: 0.1,
    })

    /* Final CTA */
    gsap.from(".fcta-headline, .fcta-sub", {
      scrollTrigger: { trigger: "#final-cta", start: "top 85%" },
      opacity: 0, y: 24, duration: 0.85, ease: "power3.out", stagger: 0.1,
    })

    /* Big arrow-link CTAs — clip-path reveal, one instance per link */
    document.querySelectorAll<HTMLElement>(".cta-link").forEach(link => {
      const parts = link.querySelectorAll(".cta-word, .cta-arrow")
      ScrollTrigger.create({
        trigger: link, start: "top 88%", once: true,
        onEnter: () => gsap.to(parts, { clipPath: "inset(0 0% 0 0)", duration: 1.2, ease: "power4.out", stagger: 0.1 }),
      })
    })

    gsap.from(".about-top", {
      scrollTrigger: { trigger: "#about", start: "top 80%" },
      opacity: 0, x: -30, duration: 0.9, ease: "power3.out",
    })

    gsap.fromTo("#about-logo",
      { opacity: 0, scale: 0.7, rotate: -80 },
      {
        scrollTrigger: { trigger: "#about", start: "top 60%", end: "bottom bottom", scrub: 1.2 },
        opacity: 0.18, scale: 1, rotate: 60, ease: "none",
      }
    )
    document.querySelectorAll<HTMLElement>(".img-block").forEach(el => {
      gsap.fromTo(el, { y: 25 }, {
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
        y: -25, ease: "none",
      })
    })
    gsap.from(".cb-block", {
      scrollTrigger: { trigger: "#swatches", start: "top 88%" },
      scaleY: 0, transformOrigin: "bottom", duration: 1.0, ease: "power3.out", stagger: 0.08,
    })
    ScrollTrigger.create({
      trigger: "#inquire", start: "top 85%",
      onEnter: () => gsap.to("#inquire", { clipPath: "inset(0 0% 0 0)", duration: 1.4, ease: "power4.out" }),
    })
    gsap.from(".c-entry", {
      scrollTrigger: { trigger: ".c-body", start: "top 80%" },
      opacity: 0, y: 25, duration: 0.85, ease: "power3.out", stagger: 0.12,
    })
    gsap.from(".field", {
      scrollTrigger: { trigger: ".c-form", start: "top 82%" },
      opacity: 0, y: 20, duration: 0.7, ease: "power3.out", stagger: 0.09,
    })
    gsap.from("footer", {
      scrollTrigger: { trigger: "footer", start: "top 95%" },
      opacity: 0, y: 16, duration: 0.8, ease: "power3.out",
    })

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()) }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitState === "sending" || submitState === "sent") return

    const form = e.currentTarget
    const data = new FormData(form)

    setSubmitState("sending")
    setSubmitLabel("SENDING…")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName:  data.get("lastName"),
          company:   data.get("company"),
          email:     data.get("email"),
          message:   data.get("message"),
        }),
      })

      if (res.ok) {
        setSubmitState("sent")
        setSubmitLabel("SENT ✓")
        gsap.to(".f-submit", { color: "#6ECECE", duration: 0.4 })
        form.reset()
      } else {
        const { error } = await res.json().catch(() => ({ error: "Something went wrong." }))
        setSubmitState("error")
        setSubmitLabel("RETRY ↗")
        console.error("[contact form]", error)
        gsap.to(".f-submit", { color: "#CC4A12", duration: 0.4 })
      }
    } catch {
      setSubmitState("error")
      setSubmitLabel("RETRY ↗")
      gsap.to(".f-submit", { color: "#CC4A12", duration: 0.4 })
    }
  }

  return (
    <>


      {/* PRELOADER */}
      <div id="preloader" ref={preloaderRef}>
        <svg id="pl-logo" ref={plLogoRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <LogoCircles />
        </svg>
      </div>

      {/* ══ HERO ══════════════════════════════════ */}
      <section id="hero">
        <div className="hero-top">
          <span className="hero-top-word">Archive</span>
          <span className="hero-top-word">Material</span>
          <span className="hero-top-word">Form</span>
          <span className="hero-top-word">Studio</span>
        </div>

        <div className="hero-center">
          <svg id="logo-mark" ref={logoMarkRef} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <InteractiveLogoCircles />
          </svg>
        </div>

        <div className="hero-bottom" ref={heroBottomRef}>
          <p className="hero-bl">Design Studio<br />Toronto 2026</p>

          <div className="hero-bc" id="hero-bc">
            <div className="hero-bc-inner">
              <TextCursorProximity
                label="Earth, Remembered"
                containerRef={heroBottomRef}
                radius={120}
                falloff="gaussian"
                styles={cyberpunk ? {
                  color:      { from: "#00f0ff", to: "#FF003C" },
                  textShadow: { from: "0 0 0px rgba(255,0,60,0)", to: "0 0 24px rgba(255,0,60,0.95), 0 0 48px rgba(255,0,60,0.45)" },
                  transform:  { from: "scale(1)", to: "scale(1.07)" },
                } : {
                  color:      { from: "#3D2645", to: "#ffff02" },
                  textShadow: { from: "0 0 0px rgba(0,0,0,0)", to: "0 0 0px rgba(0,0,0,0)" },
                  transform:  { from: "scale(1)", to: "scale(1.08)" },
                }}
              />
              <TextCursorProximity
                label="Through Design."
                containerRef={heroBottomRef}
                radius={120}
                falloff="gaussian"
                styles={cyberpunk ? {
                  color:      { from: "#00f0ff", to: "#FF003C" },
                  textShadow: { from: "0 0 0px rgba(255,0,60,0)", to: "0 0 24px rgba(255,0,60,0.95), 0 0 48px rgba(255,0,60,0.45)" },
                  transform:  { from: "scale(1)", to: "scale(1.07)" },
                } : {
                  color:      { from: "#3D2645", to: "#ffff02" },
                  textShadow: { from: "0 0 0px rgba(0,0,0,0)", to: "0 0 0px rgba(0,0,0,0)" },
                  transform:  { from: "scale(1)", to: "scale(1.08)" },
                }}
              />
            </div>
          </div>

          <p className="hero-br">thecompoundlabs@gmail.com<br />@whoiscompound</p>
        </div>
      </section>

      {/* ══ MARQUEE ════════════════════════════════ */}
      <div className="marquee-strip">
        <div className="marquee-inner">
          <span>FOR THE CURIOUS</span><span className="dot">★</span>
          <span>FOR THE COLLECTORS</span><span className="dot">★</span>
          <span>FOR THE CULTIVATORS OF TASTE</span><span className="dot">★</span>
          <span>FOR THE KEEPERS OF OBJECTS</span><span className="dot">★</span>
          <span>FOR THE DESIGN OBSESSED</span><span className="dot">★</span>
          <span>FOR THOSE WHO NOTICE</span><span className="dot">★</span>
          <span>FOR THE CURIOUS</span><span className="dot">★</span>
          <span>FOR THE COLLECTORS</span><span className="dot">★</span>
          <span>FOR THE CULTIVATORS OF TASTE</span><span className="dot">★</span>
          <span>FOR THE KEEPERS OF OBJECTS</span><span className="dot">★</span>
          <span>FOR THE DESIGN OBSESSED</span><span className="dot">★</span>
          <span>FOR THOSE WHO NOTICE</span><span className="dot">★</span>
        </div>
      </div>

      {/* ══ WHAT WE DO ═══════════════════════════════ */}
      <section id="what-we-do" className="wwd-section">
        <p className="wwd-descriptor">Creative direction &amp; spatial design for brands, gatherings, and experiences.</p>
        <p className="wwd-services-line">Weddings · Events · Pop-ups · Brand Experiences · Spatial Worlds</p>
        <Link href="/studio" className="cta-link wwd-cta">
          <span className="cta-word">Explore</span>
          <span className="cta-word">the studio</span>
          <span className="cta-arrow">↗</span>
        </Link>

        <h2 className="wwd-headline">We create worlds, not just things.</h2>
        <p className="wwd-body">
          Compound is an independent creative direction and spatial design studio working across
          objects, spaces, brands, gatherings, and experiences.
        </p>

        <div className="pillars wwd-disciplines">
          <div className="pillar">
            <h3>Creative Direction</h3>
            <p>Concept development, art direction, visual identity, mood and material direction, creative strategy.</p>
          </div>
          <div className="pillar">
            <h3>Events &amp; Experiences</h3>
            <p>Weddings, private dinners, pop-ups, brand activations, launches, installations.</p>
          </div>
          <div className="pillar">
            <h3>Spatial Design</h3>
            <p>Tablescapes, florals and materiality, signage, spatial styling, guest experience, environmental details.</p>
          </div>
          <div className="pillar">
            <h3>Brand Worlds</h3>
            <p>Small business launches, retail environments, product launches, campaign concepts, content direction.</p>
          </div>
        </div>
      </section>

      {/* ══ WEDDINGS ═════════════════════════════════ */}
      <section id="weddings" className="wed-section">
        <p className="wed-eyebrow">Wedding Creative Direction</p>
        <p className="wed-body">
          We design the world around the occasion, from the first visual idea to the smallest material detail.
        </p>
        <ul className="wed-list">
          <li>Concept</li>
          <li>Colour</li>
          <li>Materials</li>
          <li>Florals</li>
          <li>Tablescapes</li>
          <li>Stationery</li>
          <li>Signage</li>
          <li>Spatial moments</li>
          <li>Lighting direction</li>
          <li>Guest experience</li>
        </ul>
        <Link href="/services/weddings" className="cta-link wed-cta">
          <span className="cta-word">Design your</span>
          <span className="cta-word">wedding</span>
          <span className="cta-arrow">↗</span>
        </Link>
      </section>

      {/* ══ FIVE SENSES ══════════════════════════════ */}
      <section id="five-senses" className="fs-section">
        <h2 className="fs-headline">Designing the five senses.</h2>
        <p className="fs-intro">Compound doesn&apos;t only design how something looks.</p>
        <div className="fs-grid">
          <div className="fs-item"><span className="fs-word">Sight</span><span className="fs-desc">Colour, form, composition.</span></div>
          <div className="fs-item"><span className="fs-word">Touch</span><span className="fs-desc">Material, texture, tactility.</span></div>
          <div className="fs-item"><span className="fs-word">Sound</span><span className="fs-desc">Music, acoustics, atmosphere.</span></div>
          <div className="fs-item"><span className="fs-word">Scent</span><span className="fs-desc">Floral, environmental, sensory memory.</span></div>
          <div className="fs-item"><span className="fs-word">Taste</span><span className="fs-desc">Food, drink, presentation.</span></div>
        </div>
      </section>

      {/* ══ ABOUT ══════════════════════════════════ */}
      <section id="about">

        {/* Scroll-animated logo */}
        <div className="about-logo-float" id="about-logo">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="92"  fill="#3A1A08"/>
            <circle cx="100" cy="100" r="79"  fill="#8B3A1E"/>
            <circle cx="100" cy="100" r="64"  fill="#CC4A12"/>
            <circle cx="100" cy="100" r="50"  fill="#5C2510"/>
            <circle cx="100" cy="100" r="37"  fill="#3D2645"/>
            <circle cx="100" cy="100" r="23"  fill="#6ECECE"/>
            <circle cx="100" cy="100" r="9.5" fill="#050403"/>
          </svg>
        </div>

        <div className="about-top">
          <span className="about-label"><CyclingHello /></span>
          <span className="about-est">Est. 2026</span>
        </div>
        <div className="about-body-text" id="manifesto">

          {/* Stanza 0 — welcome headline */}
          <h2 className="at-welcome">Welcome to Compound.</h2>

          {/* Stanza 1 — wide intro */}
          <p className="at-intro">
            A living archive of objects, materials, and ideas. A world composed by design, grounded in the memory of the Earth. Each piece that enters Compound takes its place within a larger narrative: a continuing record of form, texture, and material culture.
          </p>

          {/* Stanza 2 — centred pull quote */}
          <div className="at-pullquote">
            <span className="at-rule" />
            <span className="at-pq-cloud">The name holds more than one truth.</span>
            <span className="at-rule" />
          </div>

          {/* Stanza 3 — large interactive definitions */}
          <div className="at-definitions">
            <div className="at-def-cloud">
              <svg className="at-def-cloud-svg" viewBox="0 0 500 260" preserveAspectRatio="none" aria-hidden>
                <rect x="6" y="130" width="488" height="126" rx="32" fill="white"/>
                <ellipse cx="62"  cy="140" rx="62"  ry="78"  fill="white"/>
                <ellipse cx="160" cy="122" rx="74"  ry="86"  fill="white"/>
                <ellipse cx="268" cy="116" rx="82"  ry="86"  fill="white"/>
                <ellipse cx="370" cy="121" rx="74"  ry="86"  fill="white"/>
                <ellipse cx="455" cy="142" rx="60"  ry="76"  fill="white"/>
              </svg>
              <div className="at-def-line"><HoverPopText text="Compound, as elemental composition." /></div>
              <div className="at-def-line"><HoverPopText text="Compound, as a place of gathering." /></div>
              <div className="at-def-line"><HoverPopText text="Compound, as value deepening across time." /></div>
            </div>
          </div>

          {/* Stanza 4 — uppercase spaced philosophy */}
          <p className="at-philosophy" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 600, letterSpacing: '-0.02em', textTransform: 'none', lineHeight: 1.2 }}>
            From these meanings, a philosophy: beauty is layered. Interconnected. Made to endure.
          </p>

          {/* Stanza 5 — body */}
          <p className="at-body">
            Here, the familiar becomes strange. Nature appears as if imagined. Objects emerge as though excavated, from a past beyond memory, or a future not yet arrived.
          </p>

          {/* Stanza 6 — large closing lines */}
          <div className="at-closing">
            <p>A landscape of material memory.</p>
            <p>A future remembered through design.</p>
          </div>

        </div>
        <div className="colour-blocks" id="swatches">
          {[
            { name: "Molten",      hex: "#CC4A12", pantone: "7526 C" },
            { name: "Deep Jungle", hex: "#1B3A2D", pantone: "560 C"  },
            { name: "Smoked Plum", hex: "#3D2645", pantone: "2627 C" },
            { name: "Glacier",     hex: "#6ECECE", pantone: "3262 C" },
            { name: "Linen",       hex: "#EDE4D8", pantone: "9183 C" },
            { name: "Bedrock",     hex: "#8B3A1E", pantone: "1615 C" },
            { name: "Acid",        hex: "#B5CC45", pantone: "375 C"  },
          ].map((s, i) => (
            <div key={s.name} className="cb-block" style={{ background: s.hex }} />
          ))}
        </div>
      </section>

      {/* ══ SELECTED WORK ════════════════════════════ */}
      <section id="selected-work" className="sw-section">
        <div className="sw-top">
          <p className="sw-tag">Selected Work</p>
          <p className="sw-sub">Worlds composed by Compound: commissioned and conceptual.</p>
        </div>
        <div className="sw-grid">
          {SELECTED_WORK.map(p => (
            <Link key={p.slug} href={`/work/${p.slug}`} className="sw-card" style={{ background: p.hex }}>
              <span className="sw-card-badge">{p.status}</span>
              <div className="sw-card-text">
                <h3 className="sw-card-title">{p.title}</h3>
                <p className="sw-card-meta">{p.category} · {p.location} · {p.year}</p>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/work" className="cta-link sw-cta">
          <span className="cta-word">View all</span>
          <span className="cta-word">work</span>
          <span className="cta-arrow">↗</span>
        </Link>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════ */}
      <section id="final-cta" className="fcta-section">
        <h2 className="fcta-headline">Have something worth designing?</h2>
        <p className="fcta-sub">Weddings. Gatherings. Spaces. Brands. Objects. Experiences.</p>
        <a href="#contact" className="cta-link fcta-cta">
          <span className="cta-word">Let&apos;s</span>
          <span className="cta-word">compound it</span>
          <span className="cta-arrow">↗</span>
        </a>
      </section>

      {/* ══ CONTACT ════════════════════════════════ */}
      <section id="contact">
        <div className="c-top">
          <p className="c-tag">Get in touch</p>
          <div className="inquire" id="inquire">INQUIRE <span className="inquire-arrow">↗</span></div>
        </div>
        <div className="c-body">
          <div className="c-info">
            <h3>Contact</h3>
            <div className="c-entry"><div className="etype">General</div><div className="edet"><a href="mailto:thecompoundlabs@gmail.com">thecompoundlabs@gmail.com</a></div></div>
            <div className="c-entry"><div className="etype">Instagram</div><div className="edet"><a href="https://instagram.com/whoiscompound" target="_blank" rel="noopener noreferrer">@whoiscompound</a></div></div>
          </div>
          <form className="c-form" onSubmit={handleSubmit}>
            {/* Honeypot — hidden from humans, bots fill this in */}
            <input type="text" name="_hp" aria-hidden="true" tabIndex={-1} style={{ display: "none" }} autoComplete="off" />
            <div className="field"><label>First Name *</label><input name="firstName" type="text" required autoComplete="given-name" /><div className="field-line" /></div>
            <div className="field"><label>Last Name *</label><input name="lastName" type="text" required autoComplete="family-name" /><div className="field-line" /></div>
            <div className="field"><label>Company</label><input name="company" type="text" autoComplete="organization" /><div className="field-line" /></div>
            <div className="field"><label>Email *</label><input name="email" type="email" required autoComplete="email" /><div className="field-line" /></div>
            <div className="field"><label>Message</label><textarea name="message" rows={1} autoComplete="off" /><div className="field-line" /></div>
            <button className="f-submit" type="submit" disabled={submitState === "sending" || submitState === "sent"}>{submitLabel}</button>
          </form>
        </div>
        <footer>
          <span className="f-brand">C O M P O U N D</span>
          <span className="f-tagline">Taste, redefined</span>
          <span className="f-brand">© 2026</span>
        </footer>
      </section>
    </>
  )
}
