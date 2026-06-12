"use client"

import { useEffect, useRef } from "react"
import { gsap } from "gsap"

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mx = 0, my = 0, rx = 0, ry = 0

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      gsap.set(dot, { x: mx, y: my })
    }
    document.addEventListener("mousemove", onMove)

    let raf: number
    const tick = () => {
      rx += (mx - rx) * 0.11
      ry += (my - ry) * 0.11
      gsap.set(ring, { x: rx, y: ry })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const addHov = () => document.body.classList.add("hov")
    const rmHov  = () => document.body.classList.remove("hov")
    const bindHover = () => {
      document.querySelectorAll("a,button").forEach(el => {
        el.addEventListener("mouseenter", addHov)
        el.addEventListener("mouseleave", rmHov)
      })
    }
    bindHover()
    const observer = new MutationObserver(bindHover)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return (
    <div id="cursor">
      <div id="cursor-dot" ref={dotRef} />
      <div id="cursor-ring" ref={ringRef} />
    </div>
  )
}
