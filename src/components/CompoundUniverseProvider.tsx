"use client"
import {
  useState, useEffect, useRef, useCallback,
  Component, type ReactNode, type ErrorInfo,
} from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"

/* Lazy-load the heavy R3F world — no SSR */
const CompoundWorld = dynamic(
  () => import("./world/CompoundWorld").then(m => ({ default: m.CompoundWorld })),
  { ssr: false }
)

/* ── Loading screen — appears instantly on click, fades once 3D world is ready ── */
const DISTRICTS = [
  "MATERIAL ARCHIVE",
  "ACID CANOPY",
  "BEDROCK DISTRICT",
  "CHROME WORKS",
  "GLACIER ZONE",
  "DEEP VIOLET",
  "COMPOUND ESTATE",
  "WORLD SYSTEMS",
]

function LoadingScreen({ visible }: { visible: boolean }) {
  const [progress, setProgress]   = useState(0)
  const [distIdx, setDistIdx]     = useState(0)

  useEffect(() => {
    if (!visible) return
    setProgress(0)
    setDistIdx(0)

    /* Fake-progress bar — runs fast up to 85%, then waits for real readiness */
    const tick = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(tick); return p }
        return p + Math.random() * 9 + 3
      })
    }, 180)

    const cycle = setInterval(() => {
      setDistIdx(i => (i + 1) % DISTRICTS.length)
    }, 420)

    return () => { clearInterval(tick); clearInterval(cycle) }
  }, [visible])

  /* When world becomes ready, snap bar to 100 */
  useEffect(() => {
    if (!visible) setProgress(100)
  }, [visible])

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99997,
        pointerEvents: visible ? "auto" : "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.9s ease",
        background: "#05070B",
        backgroundImage: "url('/compound-loading-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Courier New', monospace",
        userSelect: "none",
      }}
    >
      {/* Image overlay gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(5,7,11,0.78) 0%, rgba(5,7,11,0.42) 48%, rgba(5,7,11,0.88) 100%)",
      }} />

      {/* Center content */}
      <div style={{ position: "relative", textAlign: "center", padding: "0 24px" }}>
        {/* Sub-label */}
        <div style={{
          fontSize: 8, letterSpacing: "0.55em", marginBottom: 28,
          color: "rgba(151,215,0,0.55)", textTransform: "uppercase",
        }}>
          COMPOUND · ALTERNATE UNIVERSE
        </div>

        {/* Main title */}
        <div style={{
          fontSize: 22, letterSpacing: "0.38em", fontWeight: 700, marginBottom: 10,
          color: "rgba(237,228,216,0.92)",
        }}>
          COMPOUND WORLD
        </div>

        {/* Teal accent rule */}
        <div style={{
          width: 48, height: 1, background: "#55D9D2",
          margin: "0 auto 38px", boxShadow: "0 0 8px #55D9D2",
        }} />

        {/* Progress bar */}
        <div style={{
          width: 280, height: 1,
          background: "rgba(237,228,216,0.1)",
          margin: "0 auto 14px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${Math.min(progress, 100)}%`,
            background: "#97D700",
            boxShadow: "0 0 10px #97D700, 0 0 3px rgba(151,215,0,0.6)",
            transition: "width 0.25s ease",
          }} />
        </div>

        {/* Cycling district name */}
        <div style={{
          fontSize: 7.5, letterSpacing: "0.3em",
          color: "rgba(237,228,216,0.28)",
          minHeight: 14,
        }}>
          LOADING · {DISTRICTS[distIdx]}
        </div>
      </div>

      {/* Bottom wordmark */}
      <div style={{
        position: "absolute", bottom: 28,
        fontSize: 7, letterSpacing: "0.4em",
        color: "rgba(237,228,216,0.14)",
      }}>
        COMPOUND DESIGN STUDIO · TORONTO
      </div>
    </div>
  )
}

/* ── Error boundary — catches any exception inside the game tree ── */
interface EBState { crashed: boolean; message: string }
class GameErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, EBState> {
  state: EBState = { crashed: false, message: "" }

  static getDerivedStateFromError(err: unknown): EBState {
    return { crashed: true, message: err instanceof Error ? err.message : String(err) }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("[CompoundWorld] Runtime error:", err, info.componentStack)
  }

  handleReset = () => {
    this.setState({ crashed: false, message: "" })
    this.props.onReset()
  }

  render() {
    if (!this.state.crashed) return this.props.children
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "#05070B", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 20,
        fontFamily: "'Courier New', monospace", color: "rgba(237,228,216,0.7)",
      }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "rgba(237,228,216,0.35)" }}>
          COMPOUND WORLD — SYSTEM FAULT
        </div>
        <div style={{ fontSize: 9, color: "rgba(237,228,216,0.25)", maxWidth: 400, textAlign: "center" }}>
          {this.state.message}
        </div>
        <button
          onClick={this.handleReset}
          style={{
            marginTop: 8, padding: "10px 28px",
            background: "transparent", border: "1px solid rgba(237,228,216,0.22)",
            color: "rgba(237,228,216,0.6)", fontFamily: "inherit",
            fontSize: 9, letterSpacing: "0.28em", cursor: "pointer",
          }}
        >
          RETRY
        </button>
      </div>
    )
  }
}

declare global {
  interface Window {
    CompoundUniverse?: {
      readonly active: boolean
      start(): void
      stop(): void
      debug(): void
    }
  }
}

export function CompoundUniverseProvider() {
  const [active, setActive]       = useState(false)
  const [mounted, setMounted]     = useState(false)
  const [worldReady, setWorldReady] = useState(false)

  const activeRef = useRef(false)
  activeRef.current = active

  const activate   = useCallback(() => setActive(true),  [])
  const deactivate = useCallback(() => setActive(false), [])

  /* Mount + window API + preload the bundle immediately (before user clicks) */
  useEffect(() => {
    setMounted(true)

    /* Pre-fetch the game bundle so it's already in cache when user activates */
    import("./world/CompoundWorld").catch(() => {})

    window.CompoundUniverse = {
      get active() { return activeRef.current },
      start:  () => setActive(true),
      stop:   () => setActive(false),
      debug:  () => console.log("[CompoundWorld]", { active: activeRef.current }),
    }
    return () => { delete window.CompoundUniverse }
  }, [])

  /* Block body scroll while game is active */
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [active])

  /* Reset readiness when game closes (with delay so fade-out completes) */
  useEffect(() => {
    if (active) return
    const t = setTimeout(() => setWorldReady(false), 1200)
    return () => clearTimeout(t)
  }, [active])

  if (!mounted) return null

  /* Loading screen is always rendered while active so it appears instantly.
     CompoundWorld renders underneath it and signals ready via onReady. */
  return (
    <>
      {active && createPortal(
        <GameErrorBoundary onReset={deactivate}>
          {/* 3D world renders under the loading screen */}
          <CompoundWorld onExit={deactivate} onReady={() => setWorldReady(true)} />
          {/* Loading screen fades out once world signals ready */}
          <LoadingScreen visible={!worldReady} />
        </GameErrorBoundary>,
        document.body
      )}
    </>
  )
}
