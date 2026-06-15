"use client"

import { useEffect, useRef, useState, useCallback } from "react"

/* ─── District registry ──────────────────────────────────────────────────── */
const DISTRICTS = [
  {
    id:       "bedrock",
    num:      "01",
    name:     "BEDROCK",
    sub:      "Geological District",
    identity: "Carved earth, basalt paving, terracotta towers. The oldest layer of Compound — where material culture began.",
    accent:   "#A74B2A",
    dim:      "#3a1a08",
  },
  {
    id:       "acidCanopy",
    num:      "02",
    name:     "ACID CANOPY",
    sub:      "Biophilic District",
    identity: "Vertical gardens cascade from every cornice. Living walls, growing infrastructure, acid-green canopy light.",
    accent:   "#97D700",
    dim:      "#1a2d04",
  },
  {
    id:       "chrome",
    num:      "03",
    name:     "CHROME WORKS",
    sub:      "Industrial District",
    identity: "Precision fabrication halls, material testing labs, prototype bays. Where objects become real.",
    accent:   "#C8C9C7",
    dim:      "#1c1e24",
  },
  {
    id:       "glacier",
    num:      "04",
    name:     "GLACIER",
    sub:      "Aquatic District",
    identity: "Subterranean water channels, condensation architecture, cool mineral surfaces. Still, cold, deliberate.",
    accent:   "#55D9D2",
    dim:      "#041824",
  },
  {
    id:       "crimson",
    num:      "05",
    name:     "CRIMSON QUARTER",
    sub:      "Cultural District",
    identity: "Gathering halls, archive rooms, residences. The lived quarter of the city. Memory made physical.",
    accent:   "#BA0C2F",
    dim:      "#200408",
  },
  {
    id:       "deepViolet",
    num:      "06",
    name:     "DEEP VIOLET",
    sub:      "Experimental District",
    identity: "Research structures, unknown programmes, prototype space. The edge of what Compound is becoming.",
    accent:   "#2B153F",
    dim:      "#0d0518",
  },
] as const

type District = typeof DISTRICTS[number]

const LOADING_LINES = [
  "Initialising Compound World",
  "Mapping district geometry",
  "Calibrating material library",
  "Loading biophilic systems",
  "Establishing weather state",
]

/* ─── Loading screen ─────────────────────────────────────────────────────── */
function LoadingScreen({ pct, line }: { pct: number; line: string }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#05070B",
      overflow: "hidden",
    }}>
      {/* Loading screen image — full bleed, desaturated */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/loading-screen.png"
        alt=""
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          opacity: 0.28,
          filter: "grayscale(0.4) brightness(0.6)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Gradient vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 60%, transparent 25%, rgba(5,7,11,0.85) 80%)",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center",
        gap: 0,
        textAlign: "center",
        padding: "0 24px",
      }}>
        {/* Wordmark */}
        <div style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(52px, 9vw, 104px)",
          fontWeight: 300,
          letterSpacing: "0.22em",
          color: "#EDE4D8",
          lineHeight: 1,
          marginBottom: 10,
        }}>
          COMPOUND
        </div>
        <div style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "clamp(9px, 1.2vw, 13px)",
          letterSpacing: "0.42em",
          color: "rgba(237,228,216,0.38)",
          textTransform: "uppercase",
          marginBottom: 72,
        }}>
          UNIVERSE OF DESIGN
        </div>

        {/* Progress bar */}
        <div style={{ width: "clamp(220px, 32vw, 420px)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{
            width: "100%", height: 1,
            background: "rgba(237,228,216,0.08)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: `${pct}%`,
              background: "rgba(237,228,216,0.55)",
              transition: "width 0.12s linear",
            }} />
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            letterSpacing: "0.32em",
            color: "rgba(237,228,216,0.25)",
            textAlign: "left",
          }}>
            {line}
          </div>
        </div>
      </div>

      {/* Corner marks */}
      {([
        { top: 28, left: 28, bw: "1px 0 0 1px" },
        { top: 28, right: 28, bw: "1px 1px 0 0" },
        { bottom: 28, left: 28, bw: "0 0 1px 1px" },
        { bottom: 28, right: 28, bw: "0 1px 1px 0" },
      ] as const).map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 20, height: 20,
          borderStyle: "solid",
          borderColor: "rgba(237,228,216,0.14)",
          borderWidth: s.bw,
          top: "top" in s ? s.top : undefined,
          bottom: "bottom" in s ? s.bottom : undefined,
          left: "left" in s ? s.left : undefined,
          right: "right" in s ? s.right : undefined,
        }} />
      ))}
    </div>
  )
}

/* ─── District card ──────────────────────────────────────────────────────── */
function DistrictCard({
  district,
  selected,
  onClick,
}: {
  district: District
  selected: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const active = selected || hovered

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        all: "unset",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        cursor: "pointer",
        padding: "28px 24px 24px",
        border: `1px solid ${active ? district.accent + "55" : "rgba(237,228,216,0.07)"}`,
        background: active
          ? `linear-gradient(160deg, ${district.dim}cc 0%, rgba(5,7,11,0.9) 100%)`
          : "rgba(5,7,11,0.6)",
        backdropFilter: "blur(6px)",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.22s ease, background 0.22s ease",
        textAlign: "left",
        boxSizing: "border-box",
        outline: selected ? `1px solid ${district.accent}33` : "none",
        outlineOffset: 2,
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: district.accent,
        opacity: active ? 0.85 : 0.25,
        transition: "opacity 0.22s ease",
      }} />

      {/* Glow overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 0% 0%, ${district.accent}12 0%, transparent 60%)`,
        opacity: active ? 1 : 0,
        transition: "opacity 0.22s ease",
        pointerEvents: "none",
      }} />

      {/* Number */}
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 9,
        letterSpacing: "0.3em",
        color: active ? district.accent : "rgba(237,228,216,0.22)",
        marginBottom: 20,
        transition: "color 0.22s ease",
        position: "relative",
      }}>
        {district.num}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
        fontSize: "clamp(20px, 2.8vw, 30px)",
        fontWeight: 400,
        letterSpacing: "0.12em",
        color: active ? "#EDE4D8" : "rgba(237,228,216,0.65)",
        lineHeight: 1.1,
        marginBottom: 8,
        transition: "color 0.22s ease",
        position: "relative",
      }}>
        {district.name}
      </div>

      {/* Sub */}
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 9,
        letterSpacing: "0.25em",
        color: active ? district.accent : "rgba(237,228,216,0.28)",
        textTransform: "uppercase",
        marginBottom: 18,
        transition: "color 0.22s ease",
        position: "relative",
      }}>
        {district.sub}
      </div>

      {/* Identity */}
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        lineHeight: 1.7,
        color: active ? "rgba(237,228,216,0.52)" : "rgba(237,228,216,0.2)",
        transition: "color 0.22s ease",
        position: "relative",
        flexGrow: 1,
      }}>
        {district.identity}
      </div>

      {/* Enter indicator */}
      <div style={{
        fontFamily: "'Courier New', monospace",
        fontSize: 8,
        letterSpacing: "0.3em",
        color: district.accent,
        marginTop: 22,
        opacity: selected ? 1 : 0,
        transition: "opacity 0.2s ease",
        position: "relative",
      }}>
        SELECTED — ENTER TO LAUNCH ↗
      </div>
    </button>
  )
}

/* ─── Main hub ───────────────────────────────────────────────────────────── */
export default function UniversePage() {
  const [phase, setPhase]             = useState<"loading" | "hub">("loading")
  const [pct, setPct]                 = useState(0)
  const [lineIdx, setLineIdx]         = useState(0)
  const [selected, setSelected]       = useState<string | null>(null)
  const [entering, setEntering]       = useState(false)

  /* Fake loading progress */
  useEffect(() => {
    if (phase !== "loading") return
    let current = 0
    const id = setInterval(() => {
      current = Math.min(100, current + 1.4 + Math.random() * 1.6)
      setPct(Math.floor(current))
      setLineIdx(Math.floor((current / 100) * (LOADING_LINES.length - 1)))
      if (current >= 100) {
        clearInterval(id)
        setTimeout(() => setPhase("hub"), 480)
      }
    }, 38)
    return () => clearInterval(id)
  }, [phase])

  const launch = useCallback(() => {
    if (entering) return
    setEntering(true)
    const cu = (window as any).CompoundUniverse
    if (cu?.start) cu.start()
  }, [entering])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (phase !== "hub") return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      launch()
    }
    if (e.key === "Escape") setSelected(null)
  }, [phase, launch])

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  if (phase === "loading") {
    return <LoadingScreen pct={pct} line={LOADING_LINES[lineIdx]} />
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#05070B",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Courier New', monospace",
      opacity: entering ? 0 : 1,
      transition: entering ? "opacity 0.6s ease" : "none",
    }}>

      {/* ── NAV ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px",
        borderBottom: "1px solid rgba(237,228,216,0.07)",
        flexShrink: 0,
      }}>
        <a href="/" style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
          fontSize: 18,
          fontWeight: 400,
          letterSpacing: "0.32em",
          color: "rgba(237,228,216,0.85)",
          textDecoration: "none",
          textTransform: "uppercase",
        }}>
          Compound
        </a>
        <div style={{
          fontSize: 9, letterSpacing: "0.28em",
          color: "rgba(237,228,216,0.22)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{
            display: "inline-block", width: 5, height: 5, borderRadius: "50%",
            background: "#55D9D2",
            boxShadow: "0 0 5px #55D9D2",
          }} />
          WORLD ONLINE
        </div>
      </nav>

      {/* ── HEADER ── */}
      <div style={{
        padding: "36px 32px 28px",
        borderBottom: "1px solid rgba(237,228,216,0.05)",
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(36px, 5.5vw, 64px)",
          fontWeight: 300,
          letterSpacing: "0.18em",
          color: "#EDE4D8",
          lineHeight: 1,
          marginBottom: 10,
        }}>
          COMPOUND WORLD
        </div>
        <div style={{
          fontSize: 9, letterSpacing: "0.4em",
          color: "rgba(237,228,216,0.3)",
        }}>
          SELECT A DISTRICT · PRESS ENTER TO LAUNCH
        </div>
      </div>

      {/* ── DISTRICT GRID ── */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridTemplateRows: "repeat(2, 1fr)",
        gap: 1,
        background: "rgba(237,228,216,0.04)",
        overflow: "hidden",
        minHeight: 0,
      }}>
        {DISTRICTS.map(d => (
          <DistrictCard
            key={d.id}
            district={d}
            selected={selected === d.id}
            onClick={() => {
              setSelected(d.id)
            }}
          />
        ))}
      </div>

      {/* ── FOOTER / ENTER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        borderTop: "1px solid rgba(237,228,216,0.06)",
        flexShrink: 0,
        gap: 24,
      }}>
        <div style={{
          fontSize: 9, letterSpacing: "0.24em",
          color: "rgba(237,228,216,0.2)",
        }}>
          COMPOUND · UNIVERSE OF DESIGN · TORONTO 2026
        </div>

        <button
          onClick={launch}
          style={{
            background: entering ? "rgba(237,228,216,0.06)" : "rgba(237,228,216,0.05)",
            border: "1px solid rgba(237,228,216,0.22)",
            color: "#EDE4D8",
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            letterSpacing: "0.36em",
            padding: "11px 32px",
            cursor: "pointer",
            textTransform: "uppercase",
            transition: "background 0.18s ease, border-color 0.18s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(237,228,216,0.1)"
            e.currentTarget.style.borderColor = "rgba(237,228,216,0.45)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(237,228,216,0.05)"
            e.currentTarget.style.borderColor = "rgba(237,228,216,0.22)"
          }}
        >
          {entering ? "LOADING…" : "ENTER COMPOUND WORLD →"}
        </button>
      </div>
    </div>
  )
}
