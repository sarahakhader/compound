"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const stories = [
  { id: "glacier",    name: "Glacier",        code: "Cool 01", hex: "#2ECBC8", bg: "#070f10", tagline: "Where stillness begins.",          body: "Ancient ice, mineral water, and suspended light. Glacier is a cooling force. Made for clarity, breath, and stillness." },
  { id: "cobalt",     name: "Cobalt Electric", code: "Cool 02", hex: "#2B4FD4", bg: "#040918", tagline: "The charge before the storm.",      body: "Deep and volatile. A blue that hums with something held back — pressure building before release. Oceanic in depth, electric in feeling." },
  { id: "plum",       name: "Smoked Plum",     code: "Cool 03", hex: "#6B3A5C", bg: "#0d0710", tagline: "Memory held in shadow.",            body: "Dark and layered, like something half-remembered at the edge of sleep. A purple that asks nothing of you except your attention." },
  { id: "chrome",     name: "Chrome",          code: "Cool 04", hex: "#C0C5C8", bg: "#0a0c0d", tagline: "The surface that holds everything.", body: "Soft metal, concrete fog, and architectural restraint. Chrome turns the industrial into something intimate." },
  { id: "jungle",     name: "Deep Jungle",     code: "Cool 05", hex: "#4A5A3A", bg: "#060605", tagline: "Ancient and unhurried.",            body: "A living black inspired by wet bark, volcanic soil, and dense canopies after dark. Protective, primal, and atmospheric." },
  { id: "terracotta", name: "Terracotta",      code: "Warm 01", hex: "#D45A1A", bg: "#110600", tagline: "The earth's own record.",           body: "Fired clay, ancient walls, and sun-warmed earth. Terracotta is the first material transformed into comfort." },
  { id: "crimson",    name: "Crimson",         code: "Warm 02", hex: "#C2003A", bg: "#0f0006", tagline: "The pulse beneath everything.",     body: "Blood, iron, devotion, and sacred heat. Crimson is softness with a heartbeat." },
  { id: "acid",       name: "Acid Canopy",     code: "Warm 03", hex: "#8FD44A", bg: "#060c00", tagline: "Alive and overflowing.",            body: "An electric green drawn from glowing leaves, alien botanicals, and creative mutation. Nature at its most surreal." },
  { id: "violet",     name: "Deep Violet",     code: "Warm 04", hex: "#7B3FA0", bg: "#08000f", tagline: "The space between stars.",          body: "Night flowers, incense smoke, and dream states. Deep Violet belongs to ritual, intuition, and the unseen." },
]

// ─── COMPOUND logo structure ─────────────────────────────────────────────────
// Concentric ring radii matching the brand mark proportions, scaled for 800×800 SVG
const RINGS = [370, 278, 193, 113, 42]

interface Variant {
  staggerDir: "out" | "in"   // rings appear center→edge or edge→center
  ringDuration: number
  ringStagger: number
  orbitSpeeds: number[]      // seconds per revolution; negative = counter-clockwise
  orbitOpacity: number
  orbitDash?: string
}

// Each variant tells the story through orbit speed, direction, ring timing
const VARIANTS: Record<string, Variant> = {
  glacier:    { staggerDir: "out", ringDuration: 1.0,  ringStagger: 0.22, orbitSpeeds: [10],       orbitOpacity: 0.60 },
  cobalt:     { staggerDir: "out", ringDuration: 0.35, ringStagger: 0.07, orbitSpeeds: [2],        orbitOpacity: 0.88 },
  plum:       { staggerDir: "out", ringDuration: 1.5,  ringStagger: 0.30, orbitSpeeds: [18],       orbitOpacity: 0.35, orbitDash: "14 10" },
  chrome:     { staggerDir: "out", ringDuration: 0.5,  ringStagger: 0.06, orbitSpeeds: [-10, 15],  orbitOpacity: 0.55 },
  jungle:     { staggerDir: "out", ringDuration: 2.2,  ringStagger: 0.55, orbitSpeeds: [28],       orbitOpacity: 0.28 },
  terracotta: { staggerDir: "in",  ringDuration: 0.85, ringStagger: 0.16, orbitSpeeds: [9],        orbitOpacity: 0.65 },
  crimson:    { staggerDir: "out", ringDuration: 0.45, ringStagger: 0.10, orbitSpeeds: [4],        orbitOpacity: 0.88 },
  acid:       { staggerDir: "out", ringDuration: 0.28, ringStagger: 0.06, orbitSpeeds: [5, -3],    orbitOpacity: 0.82 },
  violet:     { staggerDir: "out", ringDuration: 1.9,  ringStagger: 0.42, orbitSpeeds: [-22],      orbitOpacity: 0.42 },
}

interface AnimProps {
  active: boolean
  color: string
  id: string
}

function LogoAnim({ active, color, id }: AnimProps) {
  const v = VARIANTS[id]
  if (!v) return null

  return (
    <svg className="st-anim-svg" viewBox="0 0 800 800" style={{ opacity: 0.65 }}>
      {RINGS.map((r, i) => {
        const delay = v.staggerDir === "out"
          ? i * v.ringStagger
          : (RINGS.length - 1 - i) * v.ringStagger
        const isCenter = i === RINGS.length - 1
        return (
          <motion.circle
            key={r}
            cx={400} cy={400} r={r}
            fill={isCenter ? color : "none"}
            stroke={color}
            strokeWidth={17}
            style={{ transformOrigin: "400px 400px", cursor: "pointer" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={active
              ? { scale: 1, opacity: 1 - i * 0.17 }
              : { scale: 0, opacity: 0 }
            }
            whileHover={{
              scale: 1.07,
              stroke: "#8FD44A",
              ...(isCenter ? { fill: "#8FD44A" } : {}),
              transition: { duration: 0.18, ease: "easeOut" },
            }}
            transition={{ duration: v.ringDuration, delay, ease: [0.4, 0, 0.2, 1] }}
          />
        )
      })}

      {v.orbitSpeeds.map((speed, oi) => (
        <motion.g
          key={oi}
          style={{ transformOrigin: "400px 400px" }}
          animate={active ? { rotate: speed > 0 ? 360 : -360 } : { rotate: 0 }}
          transition={active
            ? { duration: Math.abs(speed), repeat: Infinity, ease: "linear" }
            : { duration: 0.5 }
          }
        >
          <line
            x1={30} y1={400} x2={770} y2={400}
            stroke={color}
            strokeWidth={11}
            strokeOpacity={v.orbitOpacity - oi * 0.14}
            strokeDasharray={v.orbitDash}
          />
        </motion.g>
      ))}
    </svg>
  )
}

interface Story {
  id: string; name: string; code: string
  hex: string; bg: string; tagline: string; body: string
}

function StorySection({ story, index, total }: { story: Story; index: number; total: number }) {
  const ref = useRef<HTMLElement>(null)
  const isActive = useInView(ref, { amount: 0.5, once: false })

  return (
    <section ref={ref} className="st-section" style={{ background: story.bg }}>
      <LogoAnim active={isActive} color={story.hex} id={story.id} />
      <div className="st-content">
        <motion.span
          className="st-code"
          initial={{ opacity: 0, y: 12 }}
          animate={isActive ? { opacity: 0.3, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {story.code}
        </motion.span>
        <motion.h2
          className="st-name"
          style={{ color: story.hex }}
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        >
          {story.name}
        </motion.h2>
        <motion.p
          className="st-tagline"
          initial={{ opacity: 0, y: 16 }}
          animate={isActive ? { opacity: 0.6, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          {story.tagline}
        </motion.p>
        <motion.p
          className="st-body"
          initial={{ opacity: 0 }}
          animate={isActive ? { opacity: 0.38 } : { opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        >
          {story.body}
        </motion.p>
      </div>
      <div className="st-index">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
    </section>
  )
}

export default function StoryPage() {
  return (
    <div className="story-page">
      <header className="st-nav">
        <Link href="/" className="st-back">
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span>C O M P O U N D</span>
        </Link>
        <span className="st-nav-title" style={{ color: "var(--acid)" }}>Colour Story</span>
      </header>

      {stories.map((s, i) => (
        <StorySection key={s.id} story={s} index={i} total={stories.length} />
      ))}

      <footer className="st-footer">
        <span>© COMPOUND 2026</span>
        <span>Earth, Remembered Through Design.</span>
        <a href="https://instagram.com/whoiscompound" target="_blank" rel="noopener noreferrer">
          @whoiscompound
        </a>
      </footer>
    </div>
  )
}
