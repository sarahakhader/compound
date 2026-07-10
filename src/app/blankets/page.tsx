"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { motion } from "motion/react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNavigation,
  useCarousel,
} from "@/components/ui/carousel"

const images = [
  { id: "1", src: "/blankets/BB1AF208-8C25-4288-8121-BD95818FAEA7_p1.jpg", alt: "Bedrock — Molten · Purple Fringe" },
  { id: "2", src: "/blankets/46374E19-8AEA-44CD-AD06-982C92824D6C_p1.jpg", alt: "Bedrock — Smoked Plum · Acid Fringe" },
  { id: "3", src: "/blankets/5A7262C9-E38E-4FD2-B6EC-82398DA3E229_p1.jpg", alt: "Bedrock — Cobalt · Terracotta Fringe" },
  { id: "4", src: "/blankets/5A7262C9-E38E-4FD2-B6EC-82398DA3E229_p2.jpg", alt: "Bedrock — Smoked Plum · Acid Fringe (detail)" },
  { id: "5", src: "/blankets/5A7262C9-E38E-4FD2-B6EC-82398DA3E229_p3.jpg", alt: "Bedrock — Molten · Purple Fringe (detail)" },
]

const SLIDE_INTERVAL = 5000
const PRICE = 280

const COLOURWAYS = [
  { id: "molten", name: "Molten",      fringe: "Purple",     hex: "#E8720A", fringeHex: "#7B3FA0" },
  { id: "plum",   name: "Smoked Plum", fringe: "Acid",       hex: "#3D2645", fringeHex: "#B5CC45" },
  { id: "cobalt", name: "Cobalt",      fringe: "Terracotta", hex: "#2B4FD4", fringeHex: "#D45A1A" },
]

const subParagraphs = [
  "The architecture of warmth, weight, and atmosphere.",
  "The Compound blanket is woven from 100% cotton and composed through colour, texture, and form. Extremely soft to the touch yet quietly structured, it is designed to comfort the body while altering the atmosphere of a room.",
  "Its tasselled edge adds movement, contrast, and a sense of ritual. Draped across a bed, folded over a sofa, or placed within a quiet interior, it exists as both functional comfort and sensory object. Made not only to cover the skin, but to boldly transform the feeling of any space it's placed in.",
  "Each colourway is drawn from the natural to the surreal: mineral blues, heated oranges, deep botanical plums, and acidic greens. A blanket made with intention, designed for softness, presence, and sensory heaven.",
]

const comingSoon = [
  { name: "Glacier",      hex: "#2ECBC8", pantone: "Pantone 3262 C" },
  { name: "Chrome",       hex: "#C0C5C8", pantone: "Pantone Cool Gray 4 C" },
  { name: "Deep Jungle",  hex: "#1C1A14", pantone: "Pantone Black 6 C" },
  { name: "Crimson",      hex: "#C2003A", pantone: "Pantone 200 C" },
  { name: "Terracotta",   hex: "#D45A1A", pantone: "Pantone 7526 C" },
  { name: "Acid Canopy",  hex: "#8FD44A", pantone: "Pantone 375 C" },
  { name: "Deep Violet",  hex: "#7B3FA0", pantone: "Pantone 2607 C" },
]

const ease = [0.76, 0, 0.24, 1] as [number, number, number, number]

const LETTER_COLORS = [
  "#E8720A", // Molten
  "#2ECBC8", // Glacier
  "#B5CC45", // Acid
  "#2B4FD4", // Cobalt Electric
  "#C2003A", // Crimson
  "#8FD44A", // Acid Canopy
  "#ffff02", // Yellow
  "#7B3FA0", // Deep Violet
]

function BrandMark({ className = "bl-slide-logo", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={style} aria-hidden>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <clipPath id="bl-logo-clip">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        <circle cx="50" cy="50" r="48" fill="#9B5CC4" />
        <circle cx="50" cy="50" r="36" fill="#6B3A9A" />
        <circle cx="50" cy="50" r="25" fill="#3D2645" />
        <circle cx="50" cy="50" r="15" fill="#B5CC45" />
        <circle cx="50" cy="50" r="5.5" fill="#0c0814" />
        <g clipPath="url(#bl-logo-clip)">
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.75)" strokeWidth="0.9" />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="6s"
            repeatCount="indefinite"
          />
        </g>
      </svg>
    </div>
  )
}

type Ann = { id: string; label: string; top: string; side: "left" | "right"; pos: string }

const SLIDE_ANNS: Record<string, Ann[]> = {
  "1": [
    { id: "01", label: "Double-Layered Cotton", top: "30%", side: "left",  pos: "40%" },
    { id: "02", label: "Woven Compound Label",  top: "63%", side: "left",  pos: "40%" },
    { id: "03", label: "Contrast Tassel Edge",  top: "85%", side: "right", pos: "22%" },
  ],
  "2": [
    { id: "01", label: "Stonewashed Cotton",    top: "22%", side: "left",  pos: "36%" },
    { id: "02", label: "Compound Label",        top: "60%", side: "left",  pos: "36%" },
    { id: "03", label: "Acid Fringe Trim",      top: "88%", side: "right", pos: "14%" },
  ],
  "3": [
    { id: "01", label: "100% Cotton Weave",     top: "19%", side: "left",  pos: "34%" },
    { id: "02", label: "Compound Label",        top: "58%", side: "left",  pos: "36%" },
    { id: "03", label: "Terracotta Fringe",     top: "87%", side: "right", pos: "12%" },
  ],
  "4": [
    { id: "01", label: "Double-Layer Weave",    top: "24%", side: "left",  pos: "36%" },
    { id: "02", label: "Woven Mark",            top: "58%", side: "left",  pos: "36%" },
    { id: "03", label: "Hand-Knotted Tassel",   top: "88%", side: "right", pos: "14%" },
  ],
  "5": [
    { id: "01", label: "Brushed Cotton Surface",top: "27%", side: "left",  pos: "40%" },
    { id: "02", label: "Compound Mark",         top: "64%", side: "left",  pos: "38%" },
    { id: "03", label: "Purple Tassel Fringe",  top: "84%", side: "right", pos: "20%" },
  ],
}

function BlanketAnnotations({ imageId }: { imageId: string }) {
  const anns = SLIDE_ANNS[imageId] ?? []
  return (
    <div className="bl-annotations" aria-hidden>
      {anns.map(a => (
        <div
          key={a.id}
          className={`bl-ann ann-${a.side}`}
          style={{ top: a.top, ...(a.side === "right" ? { left: a.pos } : { right: a.pos }) }}
        >
          <div className="bl-ann-dot" />
          <div className="bl-ann-line" />
          <div className="bl-ann-text">
            <span className="bl-ann-num">{a.id}</span>
            <span className="bl-ann-name">{a.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function MossDecor() {
  const lime = "#B5CC45"
  const leaves: [number,number,number,number,number,number][] = [
    [38,  10, 24, 9, -36, .80], [100,  6, 20, 8, -10, .72], [174,  4, 22, 8,   4, .74],
    [258,  3, 21, 8,  -2, .70], [342,  4, 22, 8,   7, .72], [428,  6, 20, 8, -12, .70],
    [508, 10, 22, 9,  22, .74],
    [54, 120, 22, 9,  28, .74], [134, 124, 20, 8,   8, .68], [220, 126, 22, 9,  -4, .72],
    [308, 126, 20, 8,   4, .68], [396, 124, 22, 8, -10, .70], [480, 121, 20, 8, -24, .72],
    [548, 116, 22, 9, -34, .74],
    [10,  40, 20, 8, -62, .72], [7,   72, 18, 7, -75, .66], [11, 100, 20, 8, -55, .70],
    [556, 38, 20, 8,  62, .72], [559, 70, 18, 7,  75, .66], [555, 100, 20, 8, 52, .70],
  ]
  const dots: [number,number,number,number][] = [
    [70,  8, 4.5, .55], [138,  5, 4.0, .50], [300,  3, 4.5, .52], [464,  6, 4.0, .48],
    [164, 122, 4.0, .50], [376, 126, 4.5, .52], [526, 119, 4.0, .48],
  ]
  return (
    <svg
      aria-hidden
      className="bl-moss-svg"
      style={{
        position: "absolute", top: "-24px", left: "-24px",
        width: "calc(100% + 48px)", height: "calc(100% + 48px)",
        overflow: "visible", pointerEvents: "none", zIndex: 0,
      }}
    >
      {leaves.map(([cx,cy,rx,ry,rot,op], i) => (
        <ellipse key={`l${i}`} cx={cx} cy={cy} rx={rx} ry={ry}
          fill={lime} opacity={op} transform={`rotate(${rot},${cx},${cy})`} />
      ))}
      {dots.map(([cx,cy,r,op], i) => (
        <circle key={`d${i}`} cx={cx} cy={cy} r={r} fill={lime} opacity={op} />
      ))}
    </svg>
  )
}

function Counter() {
  const { index, itemsCount } = useCarousel()
  return (
    <div className="bl-counter-wrap">
      <span className="bl-caption">{images[index]?.alt}</span>
      <span className="bl-counter">
        {String(index + 1).padStart(2, "0")} / {String(itemsCount).padStart(2, "0")}
      </span>
    </div>
  )
}

type OrderState = "idle" | "sending" | "sent" | "error"

export default function BlanketsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Order modal state */
  const [orderOpen,  setOrderOpen]  = useState(false)
  const [selColour,  setSelColour]  = useState(COLOURWAYS[0].id)
  const [orderQty,   setOrderQty]   = useState(1)
  const [orderState, setOrderState] = useState<OrderState>("idle")
  const [oFirst,     setOFirst]     = useState("")
  const [oLast,      setOLast]      = useState("")
  const [oEmail,     setOEmail]     = useState("")
  const [oAddress,   setOAddress]   = useState("")
  const [oNotes,     setONotes]     = useState("")

  const scheduleAdvance = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCurrentIndex(i => (i + 1) % images.length)
    }, SLIDE_INTERVAL)
  }, [])

  useEffect(() => {
    scheduleAdvance()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [currentIndex, scheduleAdvance])

  const handleIndexChange = (i: number) => setCurrentIndex(i)

  const openOrder = useCallback((colourId: string) => {
    setSelColour(colourId)
    setOrderState("idle")
    setOrderOpen(true)
    document.body.style.overflow = "hidden"
  }, [])

  const closeOrder = useCallback(() => {
    setOrderOpen(false)
    document.body.style.overflow = ""
  }, [])

  const handleOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setOrderState("sending")
    const cw = COLOURWAYS.find(c => c.id === selColour)!
    const colourLabel = `${cw.name} · ${cw.fringe} Fringe`
    const total = PRICE * orderQty
    const msg = [
      `BLANKET ORDER`,
      ``,
      `Colourway: ${colourLabel}`,
      `Quantity:  ${orderQty}`,
      `Total:     CA $${total}`,
      ``,
      `Shipping address:`,
      oAddress,
      oNotes ? `\nNotes: ${oNotes}` : "",
    ].filter(l => l !== null).join("\n")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: oFirst,
          lastName:  oLast,
          email:     oEmail,
          company:   "BLANKET ORDER",
          message:   msg,
        }),
      })
      setOrderState(res.ok ? "sent" : "error")
    } catch {
      setOrderState("error")
    }
  }, [selColour, orderQty, oFirst, oLast, oEmail, oAddress, oNotes])

  const selectedCw = COLOURWAYS.find(c => c.id === selColour)!

  return (
    <div className="blankets-page">

      {/* Nav */}
      <motion.header
        className="bl-nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <Link href="/" className="bl-back">
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span>C O M P O U N D</span>
        </Link>
        <span className="bl-nav-tag">BEDROCK</span>
      </motion.header>

      {/* Split: text left, carousel right */}
      <div className="bl-main">

        {/* Left */}
        <div className="bl-left">
          <motion.p
            className="bl-eyebrow"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease }}
          >
            Bedrock Collection · 2026
          </motion.p>

          {/* Title */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h1 className="bl-title" style={{
              marginBottom: 0,
              fontFamily: "var(--sans)",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-.02em",
              color: "#B5CC45",
            }} aria-label="Blankets">
              {"Blankets".split("").map((char, i) => (
                <motion.span
                  key={i}
                  style={{ display: "inline-block", color: "inherit" }}
                  whileHover={{ color: LETTER_COLORS[i % LETTER_COLORS.length], scale: 1.1, filter: "brightness(1.5)" }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {char}
                </motion.span>
              ))}
            </h1>
          </div>

          {/* Body paragraphs */}
          <div className="bl-sub">
            {subParagraphs.map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                whileHover={i > 0 ? { y: -6, scale: 1.02, opacity: 1 } : undefined}
                transition={{ duration: 0.65, delay: i * 0.13, ease }}
              >
                {text}
              </motion.p>
            ))}
          </div>
        </div>

        {/* Right — carousel */}
        <motion.div
          className="bl-right"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
        >
          <Carousel
            index={currentIndex}
            onIndexChange={handleIndexChange}
          >
            <CarouselContent className="gap-0" fade>
              {images.map((img) => (
                <CarouselItem key={img.id} className="basis-full" overflowVisible>
                  <div className="bl-slide-wrap">
                    <div className="bl-slide">
                      <img
                        src={img.src}
                        alt={img.alt}
                        draggable={false}
                        className="bl-slide-img"
                      />
                    </div>
                    <BlanketAnnotations imageId={img.id} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="bl-carousel-footer">
              <Counter />
              <CarouselNavigation
                loop
                className="static w-auto translate-y-0 left-auto top-auto flex-row gap-2 pointer-events-auto"
                classNameButton="bg-transparent border border-linen/20 hover:border-acid *:stroke-linen w-9 h-9 flex items-center justify-center"
                alwaysShow
              />
            </div>
            {/* Textile specs */}
            <div className="bl-specs">
              {[
                { num: "01", label: "Material",   val: "100% Cotton · 200–250 GSM" },
                { num: "02", label: "Dimensions", val: "180 × 240 cm · 71″ × 94.5″" },
                { num: "03", label: "Finish",     val: "Stonewashed · Raw Fringe" },
              ].map((s) => (
                <div key={s.label} className="bl-spec-item">
                  <span className="bl-spec-num">{s.num}</span>
                  <span className="bl-spec-label">{s.label}</span>
                  <span className="bl-spec-val">{s.val}</span>
                </div>
              ))}
            </div>
          </Carousel>
        </motion.div>
      </div>

      {/* ── BUY SECTION ─────────────────────────────────────────────── */}
      <div className="bl-buy-section">
        <motion.div
          className="bl-buy-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
        >
          <p className="bl-buy-eyebrow">Available Now · CA ${PRICE}</p>
          <h2 className="bl-buy-title">Order the Bedrock Blanket</h2>
          <p className="bl-buy-sub" style={{ color: '#aaff00' }}>100% Cotton · 180 × 240 cm · Stonewashed · Raw Fringe<br />Select a colourway to place your order inquiry.</p>
        </motion.div>

        <div className="bl-buy-cards">
          {COLOURWAYS.map((c, i) => (
            <motion.button
              key={c.id}
              className="bl-buy-card"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.1, ease }}
              onClick={() => openOrder(c.id)}
              aria-label={`Order ${c.name} · ${c.fringe} Fringe`}
            >
              <div className="bl-buy-swatch-wrap">
                <div className="bl-buy-swatch" style={{ background: c.hex }} />
                <div className="bl-buy-fringe" style={{ background: c.fringeHex }} />
              </div>
              <div className="bl-buy-card-info">
                <p className="bl-buy-card-name">{c.name}</p>
                <p className="bl-buy-card-sub">{c.fringe} Fringe</p>
              </div>
              <span className="bl-buy-card-cta">Order →</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Coming Soon colourways */}
      <div className="bl-coming-soon">
        <motion.p
          className="bl-cs-eyebrow"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
        >
          More Colourways · Dropping Soon
        </motion.p>
        <div className="bl-cs-grid">
          {comingSoon.map((s, i) => (
            <motion.div
              key={s.name}
              className="bl-cs-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease }}
            >
              <div className="bl-cs-swatch" style={{ background: s.hex }} />
              <span className="bl-cs-name">{s.name}</span>
              <span className="bl-cs-pantone">{s.pantone}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Story CTA */}
      <motion.div
        className="bl-story-cta"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease }}
      >
        <Link href="/story" className="bl-story-link">
          <motion.svg
            className="bl-story-star"
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <path d="M12,2 L14.35,8.76 L21.51,8.91 L15.8,13.24 L17.88,20.09 L12,16 L6.12,20.09 L8.2,13.24 L2.49,8.91 L9.65,8.76 Z" fill="currentColor" />
          </motion.svg>
          <span>Explore the Colour Story</span>
          <span className="bl-story-arrow">→</span>
        </Link>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="bl-footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease }}
      >
        <span>© COMPOUND 2026</span>
        <span>Earth, Remembered Through Design.</span>
        <a href="https://instagram.com/whoiscompound" target="_blank" rel="noopener noreferrer">@whoiscompound</a>
      </motion.footer>

      {/* ── ORDER MODAL ──────────────────────────────────────────────── */}
      {orderOpen && (
        <div className="bl-modal-overlay" onClick={closeOrder} role="dialog" aria-modal="true" aria-label="Place an order">
          <motion.div
            className="bl-modal"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 56 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease }}
          >
            <div className="bl-modal-head">
              <div>
                <h3 className="bl-modal-title">Place an Order</h3>
                <p className="bl-modal-subtitle">Bedrock Blanket · CA ${PRICE} each</p>
              </div>
              <button className="bl-modal-close" onClick={closeOrder} aria-label="Close">✕</button>
            </div>

            {orderState === "sent" ? (
              <div className="bl-modal-success">
                <div className="bl-modal-success-icon">✓</div>
                <p className="bl-modal-success-title">Order received.</p>
                <p className="bl-modal-success-body">
                  We&apos;ll confirm your order and send payment details to <strong>{oEmail}</strong> within 24 hours.
                </p>
                <button className="bl-modal-done-btn" onClick={closeOrder}>Close</button>
              </div>
            ) : orderState === "error" ? (
              <div className="bl-modal-error">
                <p>Something went wrong. Email us at <a href="mailto:thecompoundlabs@gmail.com">thecompoundlabs@gmail.com</a></p>
                <button className="bl-modal-retry-btn" onClick={() => setOrderState("idle")}>Try again</button>
              </div>
            ) : (
              <form className="bl-modal-form" onSubmit={handleOrder} noValidate>

                {/* Colourway */}
                <div className="bl-modal-colourways">
                  {COLOURWAYS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`bl-modal-cw-btn${selColour === c.id ? " active" : ""}`}
                      onClick={() => setSelColour(c.id)}
                    >
                      <span className="bl-modal-cw-dot" style={{ background: c.hex, borderColor: c.fringeHex }} />
                      <span className="bl-modal-cw-label">{c.name}</span>
                    </button>
                  ))}
                </div>

                {/* Fringe preview */}
                <div className="bl-modal-cw-preview">
                  <div className="bl-modal-cw-preview-swatch" style={{ background: selectedCw.hex }} />
                  <div className="bl-modal-cw-preview-fringe" style={{ background: selectedCw.fringeHex }} />
                  <div className="bl-modal-cw-preview-info">
                    <span className="bl-modal-cw-preview-name">{selectedCw.name}</span>
                    <span className="bl-modal-cw-preview-sub">{selectedCw.fringe} Fringe</span>
                  </div>
                </div>

                <div className="bl-modal-row">
                  <div className="bl-modal-field">
                    <label className="bl-modal-label">First name</label>
                    <input className="bl-modal-input" type="text" required autoComplete="given-name"
                      placeholder="First" value={oFirst} onChange={e => setOFirst(e.target.value)} />
                  </div>
                  <div className="bl-modal-field">
                    <label className="bl-modal-label">Last name</label>
                    <input className="bl-modal-input" type="text" required autoComplete="family-name"
                      placeholder="Last" value={oLast} onChange={e => setOLast(e.target.value)} />
                  </div>
                </div>

                <div className="bl-modal-field">
                  <label className="bl-modal-label">Email</label>
                  <input className="bl-modal-input" type="email" required autoComplete="email"
                    placeholder="your@email.com" value={oEmail} onChange={e => setOEmail(e.target.value)} />
                </div>

                <div className="bl-modal-field">
                  <label className="bl-modal-label">Quantity</label>
                  <select className="bl-modal-input bl-modal-select" value={orderQty}
                    onChange={e => setOrderQty(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} blanket{n > 1 ? "s" : ""} — CA ${PRICE * n}</option>
                    ))}
                  </select>
                </div>

                <div className="bl-modal-field">
                  <label className="bl-modal-label">Shipping address</label>
                  <textarea className="bl-modal-input bl-modal-textarea" required autoComplete="street-address"
                    placeholder="Street, City, Province/State, Postal Code, Country"
                    value={oAddress} onChange={e => setOAddress(e.target.value)} rows={3} />
                </div>

                <div className="bl-modal-field">
                  <label className="bl-modal-label">Notes <span className="bl-modal-optional">(optional)</span></label>
                  <textarea className="bl-modal-input bl-modal-textarea"
                    placeholder="Gift message, special instructions..."
                    value={oNotes} onChange={e => setONotes(e.target.value)} rows={2} />
                </div>

                <div className="bl-modal-total">
                  <span>Total</span>
                  <span>CA ${PRICE * orderQty}</span>
                </div>

                <button type="submit" className="bl-modal-submit" disabled={orderState === "sending"}>
                  {orderState === "sending" ? "Sending…" : "Place Order"}
                </button>

                <p className="bl-modal-note">
                  We&apos;ll confirm your order and send payment details within 24 hours.
                  No card required to submit.
                </p>

              </form>
            )}
          </motion.div>
        </div>
      )}

    </div>
  )
}
