"use client"
import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { PlayerSharedState } from "./Player"

/* ── Types ── */
export interface InspectableDef {
  id:       string
  position: [number, number, number]
  label:    string
  detail:   string
  material: string   // e.g. "Basalt · Hand-poured"
  origin:   string   // e.g. "Iceland, 2024"
  radius:   number   // trigger distance in metres
}

/* Custom event names */
export const INSPECT_NEAR_EVENT = "compound-inspect-near"  // detail: { def: InspectableDef | null }
export const INSPECT_OPEN_EVENT = "compound-inspect-open"  // detail: { def: InspectableDef }

/* ── Per-object proximity detector (lives inside Canvas) ── */
const _diff = new THREE.Vector3()

export function InspectableObject({ def, playerState }: {
  def:         InspectableDef
  playerState: React.MutableRefObject<PlayerSharedState>
}) {
  const wasNear = useRef(false)
  const objPos  = new THREE.Vector3(...def.position)

  useFrame(() => {
    _diff.subVectors(playerState.current.pos, objPos)
    _diff.y = 0
    const near = _diff.length() < def.radius

    if (near !== wasNear.current) {
      wasNear.current = near
      window.dispatchEvent(new CustomEvent(INSPECT_NEAR_EVENT, {
        detail: { def: near ? def : null },
      }))
    }
  })

  /* Subtle ground halo so the object is discoverable */
  return (
    <mesh position={[def.position[0], 0.015, def.position[2]]}>
      <cylinderGeometry args={[0.28, 0.28, 0.03, 14]} />
      <meshStandardMaterial
        color="#C8C9C7"
        emissive="#C8C9C7"
        emissiveIntensity={0.55}
        roughness={0.45}
        transparent
        opacity={0.22}
      />
    </mesh>
  )
}

/* ── Inspection info panel (rendered in DOM, outside Canvas) ── */
export function InspectPanel({ def, onClose }: {
  def:     InspectableDef
  onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "KeyE" || e.code === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div style={{
      position:       "fixed",
      right:          28,
      top:            "50%",
      transform:      "translateY(-50%)",
      width:          270,
      background:     "rgba(5,7,11,0.90)",
      border:         "1px solid rgba(200,201,199,0.18)",
      padding:        "22px 20px 18px",
      fontFamily:     "'Courier New', monospace",
      pointerEvents:  "none",
      zIndex:         99999,
    }}>
      {/* Chrome accent bar */}
      <div style={{ height: 1.5, background: "#C8C9C7", marginBottom: 16, opacity: 0.65 }} />

      <div style={{ fontSize: 7.5, letterSpacing: "0.32em", color: "rgba(200,201,199,0.40)", marginBottom: 10 }}>
        OBJECT  ·  INSPECTION
      </div>

      <div style={{
        fontSize:    18,
        letterSpacing: "0.06em",
        color:       "#EDE4D8",
        marginBottom: 5,
        fontFamily:  "var(--font-cormorant, Georgia, serif)",
        fontStyle:   "italic",
        fontWeight:  300,
      }}>
        {def.label}
      </div>

      <div style={{ fontSize: 8.5, letterSpacing: "0.22em", color: "#C8C9C7", marginBottom: 14, opacity: 0.62 }}>
        {def.material}
      </div>

      <div style={{
        fontSize:     9.5,
        letterSpacing: "0.10em",
        color:         "rgba(237,228,216,0.68)",
        lineHeight:    1.75,
        marginBottom:  16,
      }}>
        {def.detail}
      </div>

      <div style={{
        borderTop:   "1px solid rgba(200,201,199,0.10)",
        paddingTop:  10,
        display:     "flex",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 7.5, letterSpacing: "0.18em", color: "rgba(200,201,199,0.32)" }}>
          {def.origin}
        </span>
        <span style={{ fontSize: 7.5, letterSpacing: "0.22em", color: "rgba(200,201,199,0.28)" }}>
          [ E ] CLOSE
        </span>
      </div>
    </div>
  )
}
