"use client"

import { useEffect, useRef, useState, useCallback } from "react"

/* ─── Zone data ──────────────────────────────────────────────── */
const ZONES = [
  {
    id: "waygate",
    name: "WAYGATE",
    sub: "Transit Hub",
    icon: "⬡",
    color: "#8b00ff",
    lore: "The Waygate binds all sectors. Travelers pass through fractures in the Keep's ancient stone — where neon light bleeds into old magic. Coordinates unknown. Destinations infinite.",
    action: "transit",
  },
  {
    id: "plasma",
    name: "PLASMA CORE",
    sub: "Energy Control V2.1",
    icon: "⚛",
    color: "#ff6b00",
    lore: "The beating heart of Compound. The Plasma Core V2.1 generates enough energy to power all of Sector VII. Touch the glass — feel the warmth of a contained sun. Engineers only. Or brave enough.",
    action: null,
  },
  {
    id: "gearsmith",
    name: "GEARSMITH",
    sub: "Workshop & Forge",
    icon: "⚙",
    color: "#00f5ff",
    lore: "Need something built? Broken? Modified beyond recognition? The Gearsmith doesn't ask questions. She only asks what caliber, what voltage, and how soon. Everything has a price.",
    action: null,
  },
  {
    id: "datashrine",
    name: "DATA SHRINE",
    sub: "Neural Archive",
    icon: "◈",
    color: "#ff00aa",
    lore: "Where the old gods uploaded themselves. The Data Shrine holds every secret Sector VII has ever tried to bury. Access requires a key, a prayer, and a willingness to forget what you learn.",
    action: null,
  },
  {
    id: "questboard",
    name: "QUEST BOARD",
    sub: "Active Contracts",
    icon: "📜",
    color: "#ffd700",
    lore: "Contracts glow amber under the neon light. Some jobs pay in credits. Some pay in secrets. A few pay in things that cannot be named. Read carefully. Commit fully. The Board doesn't take refusals.",
    action: null,
  },
  {
    id: "compound",
    name: "COMPOUND",
    sub: "Central Hub — Night City Sector VII",
    icon: "⬡",
    color: "#00f5ff",
    lore: "This is Compound. The nexus where old stone and new light collide — a fortress remade as a city, a city that remembers being a fortress. Every path in Sector VII leads here eventually. The Keep remembers. Legends are forged here.",
    action: "launch",
    hero: true,
  },
  {
    id: "market",
    name: "MARKET",
    sub: "Black & Silver Exchange",
    icon: "◆",
    color: "#ff00aa",
    lore: "Everything has a seller in Compound Market. Relics from before the Surge sit beside fresh chrome implants. Haggling is tradition. Theft is a confession. The Market never closes.",
    action: null,
  },
  {
    id: "tavern",
    name: "TAVERN",
    sub: "Rest & Intel",
    icon: "⚗",
    color: "#00f5ff",
    lore: "Byte Brew on tap. The Tavern is the only place in Sector VII where enemies share a table without incident. Old rule of the Keep: no blood on the bar floor. The ceiling is another story.",
    action: null,
  },
  {
    id: "arena",
    name: "ARENA",
    sub: "Combat Trials",
    icon: "⚔",
    color: "#8b00ff",
    lore: "The Arena has no rules that matter. Contestants enter to prove something — to themselves, to the crowd, to whatever god still watches through the shattered spire. Champions are remembered. Losers are data.",
    action: null,
  },
  {
    id: "codex",
    name: "CODEX",
    sub: "Ancient Library",
    icon: "◉",
    color: "#ffd700",
    lore: "The Codex predates the Keep. It predates the city. The oldest volumes are written in a language that rewrites itself when read. Scholars spend lifetimes here. Most emerge changed.",
    action: null,
  },
  {
    id: "wall",
    name: "THE WALL",
    sub: "Outer Perimeter",
    icon: "▦",
    color: "#ff6b00",
    lore: "The Wall is the edge of everything. Beyond it, Sector VII dissolves into unmapped static. Guards rotate every six hours. Nobody asks what they're keeping out. Nobody asks what they're keeping in.",
    action: null,
  },
]

const FLAVORS = [
  "The Keep remembers.",
  "Legends are forged here.",
  "System online.",
  "Initializing neural core...",
  "Syncing waygate protocols...",
  "Calibrating plasma core...",
  "Authenticating sector credentials...",
  "Loading Compound universe...",
]

/* ─── Particle canvas hook ───────────────────────────────────── */
function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const colors = ["#00f5ff", "#8b00ff", "#ff00aa", "#ff6b00", "#ffffff"]
    let W = 0, H = 0, raf = 0

    type Particle = {
      x: number; y: number; vx: number; vy: number
      size: number; color: string; alpha: number
      life: number; maxLife: number; twinkle: number; twinkleSpeed: number
    }

    function make(): Particle {
      const life = Math.random() * 200 + 100
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.1,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.1,
        life, maxLife: life,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
      }
    }

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const particles: Particle[] = Array.from({ length: 120 }, make)

    function loop() {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        p.life--; p.twinkle += p.twinkleSpeed
        const twinkle = Math.sin(p.twinkle) * 0.3 + 0.7
        const a = p.alpha * (p.life / p.maxLife) * twinkle
        ctx.save()
        ctx.globalAlpha = a
        ctx.shadowBlur = 8
        ctx.shadowColor = p.color
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        if (p.life <= 0) particles[i] = make()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [canvasRef])
}

/* ─── Modal ──────────────────────────────────────────────────── */
function ZoneModal({
  zone,
  onClose,
  onEnter,
}: {
  zone: (typeof ZONES)[number] | null
  onClose: () => void
  onEnter: (zone: (typeof ZONES)[number]) => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed", inset: 0, zIndex: 9500,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: zone ? 1 : 0,
        visibility: zone ? "visible" : "hidden",
        transition: "opacity 0.3s ease, visibility 0.3s ease",
      }}
    >
      {zone && (
        <div style={{
          width: 480, maxWidth: "90vw",
          background: "rgba(10,10,25,0.97)",
          border: `1px solid ${zone.color}44`,
          padding: "40px",
          position: "relative",
          boxShadow: `0 0 40px -10px ${zone.color}, 0 0 80px -20px #8b00ff, inset 0 0 40px -20px ${zone.color}0d`,
        }}>
          {/* Corner accents */}
          {[
            { top: -1, left: -1, borderWidth: "2px 0 0 2px" },
            { top: -1, right: -1, borderWidth: "2px 2px 0 0" },
            { bottom: -1, left: -1, borderWidth: "0 0 2px 2px" },
            { bottom: -1, right: -1, borderWidth: "0 2px 2px 0" },
          ].map((s, i) => (
            <div key={i} style={{
              position: "absolute", width: 16, height: 16,
              borderColor: zone.color, borderStyle: "solid",
              opacity: 0.6, ...s,
            }} />
          ))}

          <div style={{ textAlign: "center", marginBottom: 16, fontSize: 40, filter: `drop-shadow(0 0 10px ${zone.color})` }}>
            {zone.icon}
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: zone.hero ? 32 : 28,
            fontWeight: 900,
            letterSpacing: "0.3em",
            textAlign: "center",
            color: zone.color,
            textShadow: `0 0 15px ${zone.color}, 0 0 30px ${zone.color}`,
            marginBottom: 8,
            textTransform: "uppercase",
          }}>
            {zone.name}
          </div>
          <div style={{
            fontSize: 10, letterSpacing: "0.4em", textAlign: "center",
            color: "rgba(232,232,240,0.4)", textTransform: "uppercase", marginBottom: 24,
            fontFamily: "'Share Tech Mono', monospace",
          }}>
            {zone.sub}
          </div>
          <div style={{
            width: "100%", height: 1,
            background: `linear-gradient(90deg, transparent, ${zone.color}, transparent)`,
            opacity: 0.3, marginBottom: 24,
          }} />
          <div style={{
            fontSize: 13, lineHeight: 1.8, color: "rgba(232,232,240,0.7)",
            textAlign: "center", letterSpacing: "0.05em", marginBottom: 32,
            fontFamily: "'Share Tech Mono', monospace",
          }}>
            {zone.lore}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => onEnter(zone)}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
                padding: "12px 28px",
                border: `1px solid ${zone.color}`,
                cursor: "pointer", background: "transparent",
                color: zone.color,
                textShadow: `0 0 8px ${zone.color}`,
                boxShadow: `0 0 15px -5px ${zone.color}`,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                const t = e.currentTarget
                t.style.background = zone.color
                t.style.color = "#0a0a14"
                t.style.textShadow = "none"
              }}
              onMouseLeave={e => {
                const t = e.currentTarget
                t.style.background = "transparent"
                t.style.color = zone.color
                t.style.textShadow = `0 0 8px ${zone.color}`
              }}
            >
              {zone.action === "launch" ? "⬡ LAUNCH UNIVERSE" : "ENTER ZONE"}
            </button>
            <button
              onClick={onClose}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
                padding: "12px 28px",
                border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer", background: "transparent",
                color: "rgba(255,255,255,0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "#e8e8f0"
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "rgba(255,255,255,0.4)"
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Zone Card ──────────────────────────────────────────────── */
function ZoneCard({ zone, onClick }: { zone: (typeof ZONES)[number]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(10,10,30,0.85)",
        border: `1px solid ${hovered ? zone.color : "rgba(255,255,255,0.08)"}`,
        padding: zone.hero ? "32px 24px" : "20px 16px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: zone.hero ? "center" : "flex-start",
        textAlign: zone.hero ? "center" : "left",
        gridColumn: zone.hero ? "2 / 4" : undefined,
        gridRow: zone.hero ? "2" : undefined,
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered
          ? `0 0 15px -3px ${zone.color}, 0 0 40px -8px ${zone.color}, inset 0 0 20px -8px ${zone.color}22`
          : zone.hero
            ? `0 0 20px -5px ${zone.color}, 0 0 60px -15px #8b00ff, inset 0 0 30px -15px ${zone.color}1a`
            : "none",
      }}
    >
      {/* Top-right corner triangle */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 0, height: 0,
        borderStyle: "solid",
        borderWidth: "0 20px 20px 0",
        borderColor: `transparent ${zone.color} transparent transparent`,
        opacity: hovered ? 1 : 0.4,
        transition: "opacity 0.3s ease",
      }} />

      {/* Hover glow overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: zone.color,
        opacity: hovered ? 0.06 : 0,
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
      }} />

      <div style={{
        fontSize: zone.hero ? 36 : 24,
        lineHeight: 1,
        filter: `drop-shadow(0 0 6px ${zone.color})`,
        position: "relative",
      }}>
        {zone.icon}
      </div>

      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: zone.hero ? 28 : 13,
        fontWeight: 700,
        letterSpacing: zone.hero ? "0.5em" : "0.25em",
        color: zone.color,
        textShadow: zone.hero
          ? `0 0 15px ${zone.color}, 0 0 30px ${zone.color}, 0 0 60px #8b00ff`
          : `0 0 8px ${zone.color}`,
        textTransform: "uppercase",
        lineHeight: 1.2,
        position: "relative",
        animation: zone.hero ? "neonFlicker 4s ease-in-out infinite" : "none",
      }}>
        {zone.name}
      </div>

      <div style={{
        fontSize: zone.hero ? 11 : 10,
        letterSpacing: "0.15em",
        color: "rgba(232,232,240,0.4)",
        textTransform: "uppercase",
        lineHeight: 1.4,
        fontFamily: "'Share Tech Mono', monospace",
        position: "relative",
      }}>
        {zone.sub}
      </div>

      {!zone.hero && (
        <div style={{
          position: "absolute", right: 10, bottom: 10,
          fontSize: 10, letterSpacing: "0.2em",
          color: zone.color, opacity: hovered ? 1 : 0.4,
          transition: "opacity 0.3s ease",
          display: "flex", alignItems: "center", gap: 4,
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          ENTER ›
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function UniversePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<"loading" | "hub">("loading")
  const [pct, setPct] = useState(0)
  const [flavorIdx, setFlavorIdx] = useState(0)
  const [flavorVisible, setFlavorVisible] = useState(true)
  const [selectedZone, setSelectedZone] = useState<(typeof ZONES)[number] | null>(null)

  useParticles(canvasRef)

  /* Loading progress */
  useEffect(() => {
    let current = 0
    const total = 4200
    const interval = 40
    const steps = total / interval

    const tid = setInterval(() => {
      current = Math.min(100, current + (100 / steps) + Math.random() * (100 / steps) * 0.5)
      setPct(Math.floor(current))
      if (current >= 100) {
        clearInterval(tid)
        setTimeout(() => setPhase("hub"), 700)
      }
    }, interval)
    return () => clearInterval(tid)
  }, [])

  /* Flavor text cycling */
  useEffect(() => {
    const tid = setInterval(() => {
      setFlavorVisible(false)
      setTimeout(() => {
        setFlavorIdx(i => (i + 1) % FLAVORS.length)
        setFlavorVisible(true)
      }, 400)
    }, 1100)
    return () => clearInterval(tid)
  }, [])

  const handleEnterZone = useCallback((zone: (typeof ZONES)[number]) => {
    setSelectedZone(null)
    if (zone.action === "launch") {
      const cu = (window as any).CompoundUniverse
      if (cu?.start) cu.start()
    }
  }, [])

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Share+Tech+Mono&display=swap');

        @keyframes neonFlicker {
          0%, 95%, 100% { opacity: 1; }
          96% { opacity: 0.85; }
          97% { opacity: 1; }
          98% { opacity: 0.7; }
          99% { opacity: 1; }
        }
        @keyframes compassSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes gridDrift {
          from { background-position: 0 0; }
          to   { background-position: 60px 60px; }
        }
        @keyframes pillarPulse {
          0%, 100% {
            box-shadow: 0 0 30px 10px rgba(255,107,0,0.3), 0 0 80px 30px rgba(139,0,255,0.2), inset 0 0 20px rgba(255,107,0,0.5);
          }
          50% {
            box-shadow: 0 0 50px 20px rgba(255,107,0,0.5), 0 0 120px 50px rgba(139,0,255,0.35), inset 0 0 40px rgba(255,107,0,0.7);
          }
        }
        @keyframes coreSpin {
          from { transform: rotate(0deg); filter: hue-rotate(0deg); }
          to   { transform: rotate(360deg); filter: hue-rotate(60deg); }
        }
        @keyframes ringExpand {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes statusPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); opacity: 0.6; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px); opacity: 0.5; }
          50% { transform: translateY(-14px); opacity: 0.9; }
        }
        @keyframes blink {
          50% { opacity: 0.4; }
        }
        @keyframes loadBarShimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
      `}</style>

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      }} />

      {/* Scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9000, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
      }} />

      {/* Vignette */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9001, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
      }} />

      {/* ─── LOADING SCREEN ─────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 8000,
        background: "#0a0a14",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        opacity: phase === "loading" ? 1 : 0,
        visibility: phase === "loading" ? "visible" : "hidden",
        transition: "opacity 0.8s ease, visibility 0.8s ease",
      }}>
        {/* Animated grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "gridDrift 20s linear infinite",
        }} />

        {/* Corner accents */}
        {[
          { top: 24, left: 24, borderWidth: "2px 0 0 2px" },
          { top: 24, right: 24, borderWidth: "2px 2px 0 0" },
          { bottom: 24, left: 24, borderWidth: "0 0 2px 2px" },
          { bottom: 24, right: 24, borderWidth: "0 2px 2px 0" },
        ].map((s, i) => (
          <div key={i} style={{
            position: "absolute", width: 24, height: 24,
            borderColor: "#00f5ff", borderStyle: "solid", opacity: 0.35, ...s,
          }} />
        ))}

        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 48,
          width: 600, maxWidth: "90vw",
        }}>
          {/* Compass SVG */}
          <svg
            viewBox="0 0 100 100"
            style={{
              width: 80, height: 80,
              animation: "compassSpin 20s linear infinite",
              filter: "drop-shadow(0 0 12px #00f5ff) drop-shadow(0 0 24px #8b00ff)",
            }}
          >
            <circle cx="50" cy="50" r="45" stroke="#00f5ff" strokeWidth="1" strokeDasharray="4 4" fill="none"/>
            <circle cx="50" cy="50" r="35" stroke="#8b00ff" strokeWidth="0.5" fill="none"/>
            <line x1="50" y1="5" x2="50" y2="95" stroke="#00f5ff" strokeWidth="0.8" opacity="0.3"/>
            <line x1="5" y1="50" x2="95" y2="50" stroke="#00f5ff" strokeWidth="0.8" opacity="0.3"/>
            <line x1="14" y1="14" x2="86" y2="86" stroke="#8b00ff" strokeWidth="0.5" opacity="0.3"/>
            <line x1="86" y1="14" x2="14" y2="86" stroke="#8b00ff" strokeWidth="0.5" opacity="0.3"/>
            <polygon points="50,8 46,26 50,22 54,26" fill="#00f5ff" opacity="0.9"/>
            <polygon points="50,92 46,74 50,78 54,74" fill="#8b00ff" opacity="0.6"/>
            <polygon points="92,50 74,46 78,50 74,54" fill="#00f5ff" opacity="0.6"/>
            <polygon points="8,50 26,46 22,50 26,54" fill="#00f5ff" opacity="0.6"/>
            <circle cx="50" cy="50" r="4" fill="#ff00aa" opacity="0.9"/>
            <circle cx="50" cy="50" r="2" fill="white"/>
            <circle cx="50" cy="12" r="1.5" fill="#00f5ff" opacity="0.5"/>
            <circle cx="88" cy="50" r="1.5" fill="#00f5ff" opacity="0.5"/>
            <circle cx="50" cy="88" r="1.5" fill="#00f5ff" opacity="0.5"/>
            <circle cx="12" cy="50" r="1.5" fill="#00f5ff" opacity="0.5"/>
          </svg>

          {/* Logo */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(48px, 10vw, 88px)",
              fontWeight: 900,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#e8e8f0",
              textShadow: "0 0 10px #00f5ff, 0 0 30px #00f5ff, 0 0 60px #00f5ff, 0 0 100px #8b00ff",
              animation: "neonFlicker 4s ease-in-out infinite",
              lineHeight: 1,
            }}>
              COMPOUND
            </div>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 13, letterSpacing: "0.5em",
              color: "#8b00ff",
              textShadow: "0 0 10px #8b00ff",
              textTransform: "uppercase",
              marginTop: 12,
              fontFamily2: "'Share Tech Mono', monospace",
            }}>
              ◆ NIGHT CITY · SECTOR VII ◆
            </div>
          </div>

          {/* Progress */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.4em", color: "#00f5ff",
              textShadow: "0 0 8px #00f5ff",
              animation: "blink 1.2s step-end infinite",
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              LOADING...
            </div>

            <div style={{
              width: "100%", height: 3,
              background: "rgba(0,245,255,0.1)",
              border: "1px solid rgba(0,245,255,0.2)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: "linear-gradient(90deg, #8b00ff, #00f5ff)",
                boxShadow: "0 0 12px #00f5ff, 0 0 24px #00f5ff",
                transition: "width 0.1s linear",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", right: 0, top: -3,
                  width: 3, height: 9, background: "white",
                  boxShadow: "0 0 8px white, 0 0 16px #00f5ff",
                }} />
              </div>
            </div>

            <div style={{
              fontSize: 28, letterSpacing: "0.15em",
              color: "#00f5ff",
              textShadow: "0 0 15px #00f5ff",
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              {pct}%
            </div>

            <div style={{
              fontSize: 13, letterSpacing: "0.2em",
              color: "rgba(232,232,240,0.5)",
              fontStyle: "italic", textAlign: "center",
              minHeight: 20,
              opacity: flavorVisible ? 1 : 0,
              transition: "opacity 0.4s ease",
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              {FLAVORS[flavorIdx]}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN HUB ───────────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", flexDirection: "column",
        background: "#0a0a14",
        opacity: phase === "hub" ? 1 : 0,
        visibility: phase === "hub" ? "visible" : "hidden",
        transition: "opacity 1s ease 0.3s, visibility 1s ease 0.3s",
      }}>
        {/* NAV */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 32px",
          borderBottom: "1px solid rgba(0,245,255,0.12)",
          background: "rgba(10,10,20,0.7)",
          backdropFilter: "blur(8px)",
          position: "relative", zIndex: 200,
        }}>
          <a href="/" style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 22, fontWeight: 900, letterSpacing: "0.4em",
            color: "#e8e8f0",
            textShadow: "0 0 10px #00f5ff, 0 0 20px #00f5ff",
            animation: "neonFlicker 4s ease-in-out infinite",
            textDecoration: "none",
          }}>
            ⬡ COMPOUND
          </a>
          <div style={{
            fontSize: 11, letterSpacing: "0.25em",
            color: "#00f5ff",
            textShadow: "0 0 8px #00f5ff",
            display: "flex", alignItems: "center", gap: 8,
            fontFamily: "'Share Tech Mono', monospace",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#00f5ff",
              boxShadow: "0 0 6px #00f5ff, 0 0 12px #00f5ff",
              animation: "statusPulse 2s ease infinite",
            }} />
            SYSTEM ONLINE ✦ v2.1 ✦ SECTOR VII
          </div>
        </nav>

        {/* SCENE */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>

          {/* Fog */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
            background: "radial-gradient(ellipse at center bottom, rgba(139,0,255,0.08) 0%, rgba(0,245,255,0.04) 40%, transparent 70%)",
            animation: "float1 12s ease-in-out infinite alternate",
          }} />

          {/* Floating decorative signs */}
          {[
            { text: "PLAZA", color: "#ff00aa", style: { top: "15%", left: "6%" }, anim: "float1 6s ease-in-out infinite" },
            { text: "ACADEMY", color: "#00f5ff", style: { top: "22%", right: "6%" }, anim: "float2 7s ease-in-out infinite" },
            { text: "NIGHT CITY", color: "#ffd700", style: { bottom: "18%", left: "5%" }, anim: "float1 8s ease-in-out infinite 1s" },
            { text: "SECTOR VII", color: "#8b00ff", style: { bottom: "20%", right: "6%" }, anim: "float2 5s ease-in-out infinite 0.5s" },
            { text: "BYTE BREW", color: "#ff6b00", style: { top: "38%", left: "3%" }, anim: "float1 9s ease-in-out infinite 2s" },
          ].map(({ text, color, style, anim }) => (
            <div key={text} style={{
              position: "absolute", ...style,
              fontFamily: "'Cinzel', serif",
              fontSize: 10, letterSpacing: "0.3em", fontWeight: 700,
              textTransform: "uppercase",
              color, textShadow: `0 0 8px ${color}`,
              display: "flex", alignItems: "center", gap: 6,
              animation: anim,
              zIndex: 3, pointerEvents: "none", whiteSpace: "nowrap",
            }}>
              ▶ {text}
            </div>
          ))}

          {/* Energy pillar centerpiece */}
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 5, pointerEvents: "none",
          }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,107,0,0.4) 0%, rgba(139,0,255,0.2) 50%, transparent 70%)",
              animation: "pillarPulse 3s ease-in-out infinite",
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  position: "absolute",
                  width: 80, height: 80, borderRadius: "50%",
                  border: `1px solid ${["#ff6b00", "#8b00ff", "#00f5ff"][i]}`,
                  animation: `ringExpand 3s ease-out infinite`,
                  animationDelay: `${i}s`,
                  opacity: 0,
                }} />
              ))}
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "radial-gradient(circle, #fff 0%, #ff6b00 40%, #8b00ff 100%)",
                boxShadow: "0 0 20px #ff6b00, 0 0 40px #ff6b00, 0 0 60px #8b00ff",
                animation: "coreSpin 4s linear infinite",
              }} />
            </div>
          </div>

          {/* Zone Grid */}
          <div style={{
            position: "relative", zIndex: 10,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(3, auto)",
            gap: 16,
            padding: 24,
            width: "min(1100px, 95vw)",
            maxHeight: "calc(100vh - 130px)",
          }}>
            {ZONES.map(zone => (
              <ZoneCard key={zone.id} zone={zone} onClick={() => setSelectedZone(zone)} />
            ))}
          </div>
        </div>

        {/* STATUS BAR */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 32px",
          borderTop: "1px solid rgba(0,245,255,0.08)",
          background: "rgba(10,10,20,0.7)",
          backdropFilter: "blur(8px)",
          fontSize: 10, letterSpacing: "0.2em",
          color: "rgba(232,232,240,0.3)",
          fontFamily: "'Share Tech Mono', monospace",
          position: "relative", zIndex: 200,
        }}>
          <span>COMPOUND ◆ NIGHT CITY ◆ <span style={{ color: "rgba(0,245,255,0.5)" }}>SECTOR VII</span></span>
          <span>
            NEURAL LINK: <span style={{ color: "rgba(0,245,255,0.5)" }}>ACTIVE</span>
            {" "}·{" "}WAYGATE: <span style={{ color: "rgba(0,245,255,0.5)" }}>ONLINE</span>
            {" "}·{" "}THREAT: <span style={{ color: "rgba(255,107,0,0.7)" }}>MODERATE</span>
          </span>
          <span>PLASMA CORE: <span style={{ color: "rgba(0,245,255,0.5)" }}>94.7%</span></span>
        </div>
      </div>

      {/* ─── MODAL ──────────────────────────────────────────── */}
      <ZoneModal
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        onEnter={handleEnterZone}
      />
    </>
  )
}
