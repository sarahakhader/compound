"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"

/* Lazy-load the heavy R3F world — no SSR */
const CompoundWorld = dynamic(
  () => import("./world/CompoundWorld").then(m => ({ default: m.CompoundWorld })),
  { ssr: false }
)

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
    <CompoundWorld onExit={deactivate} />,
    document.body
  )
}
