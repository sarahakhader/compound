"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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

function BrandMark() {
  return (
    <div className="bl-slide-logo" aria-hidden>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <clipPath id="bl-logo-clip">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        {/* Concentric rings */}
        <circle cx="50" cy="50" r="48" fill="#D4650E" />
        <circle cx="50" cy="50" r="36" fill="#8B3A1E" />
        <circle cx="50" cy="50" r="25" fill="#3D1E42" />
        <circle cx="50" cy="50" r="15" fill="#2BCCC8" />
        <circle cx="50" cy="50" r="5.5" fill="#090608" />
        {/* Orbiting line — clipped to outer ring */}
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

export default function BlanketsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

          {/* Title — hover colours */}
          <h1 className="bl-title" aria-label="Blankets">
            {"Blankets".split("").map((char, i) => (
              <motion.span
                key={i}
                style={{ display: "inline-block", color: "var(--cobalt)" }}
                whileHover={{ color: LETTER_COLORS[i % LETTER_COLORS.length], y: -10, scale: 1.25 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {char}
              </motion.span>
            ))}
          </h1>

          {/* Body paragraphs — staggered on scroll */}
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

        {/* Right — carousel slides in from right */}
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
                    <BrandMark />
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
          </Carousel>
        </motion.div>
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

      {/* Collection info */}
      <div className="bl-info-strip">
        {[
          { label: "Fibre",      val: "100% Cotton · 200–250 GSM" },
          { label: "Dimensions", val: "180 × 240 cm (71″ × 94.5″)" },
          { label: "Finish",     val: "Stonewashed · Raw Fringe" },
          { label: "Inquire",    val: "thecompoundlabs@gmail.com", href: "mailto:thecompoundlabs@gmail.com" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            className="bl-info-item"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease }}
          >
            <span className="bl-info-label">{item.label}</span>
            {item.href
              ? <a href={item.href} className="bl-info-val bl-link">{item.val}</a>
              : <span className="bl-info-val">{item.val}</span>
            }
          </motion.div>
        ))}
      </div>

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

    </div>
  )
}
