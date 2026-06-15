"use client"
import { useState, useEffect, useRef, useCallback, Component, type ReactNode, type ErrorInfo } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"

/* Lazy-load the heavy R3F world — no SSR */
const CompoundWorld = dynamic(
  () => import("./world/CompoundWorld").then(m => ({ default: m.CompoundWorld })),
  { ssr: false }
)

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
  const [active, setActive] = useState(false)
  const [mounted, setMounted] = useState(false)

  /* refs so the window API closures always see the latest state */
  const activeRef = useRef(false)
  activeRef.current = active

  const activate   = useCallback(() => setActive(true),  [])
  const deactivate = useCallback(() => setActive(false), [])

  /* Expose window API as soon as client mounts */
  useEffect(() => {
    setMounted(true)
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

  if (!mounted || !active) return null

  return createPortal(
    <GameErrorBoundary onReset={deactivate}>
      <CompoundWorld onExit={deactivate} />
    </GameErrorBoundary>,
    document.body
  )
}
