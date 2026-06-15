"use client"
import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import * as THREE from "three"
import { Player, type PlayerSharedState } from "./Player"
import { CatCompanion } from "./CatCompanion"
import { NPCs, type NPCDef } from "./NPC"
import { InspectableObject, InspectPanel, type InspectableDef, INSPECT_NEAR_EVENT } from "./Inspectable"
import { City, COLLIDERS } from "./City"
import { Skyline } from "./Skyline"
import { Lights } from "./Lights"
import { Rain } from "./Rain"
import { CityAmbience } from "./Audio"

/* ── NPC patrol layout ── */
const NPC_LAYOUT: NPCDef[] = [
  { id: "n-01", type: "walker",   waypoints: [[-3, -10], [-3, -55], [-3, -10]],                             speed: 2.0 },
  { id: "n-02", type: "walker",   waypoints: [[8, -20],  [8, -65],  [8, -20]],                              speed: 2.2 },
  { id: "n-03", type: "observer", waypoints: [[-9, -112], [-9, -132], [-9, -112]],                          speed: 0.7 },
  { id: "n-04", type: "observer", waypoints: [[9,  -118], [9,  -142], [9,  -118]],                          speed: 0.6 },
  { id: "n-05", type: "worker",   waypoints: [[-32, -62], [-58, -82], [-50, -104], [-32, -62]],             speed: 2.8 },
  { id: "n-06", type: "worker",   waypoints: [[-24, -72], [-46, -72], [-46, -98], [-24, -98], [-24, -72]],  speed: 2.5 },
  { id: "n-07", type: "walker",   waypoints: [[36, -76],  [72, -78],  [72, -102], [36, -76]],               speed: 2.3 },
]

/* ── Inspectable object catalogue ── */
const INSPECTABLES: InspectableDef[] = [
  {
    id:       "basalt-sample",
    position: [-4, 0, -32],
    label:    "Basalt Column Fragment",
    detail:   "Irregular prismatic section cut from a columnar basalt formation. The hexagonal geometry is a product of thermal contraction in cooling lava flows — nature's compression algorithm.",
    material: "Basalt · Volcanic · Unfinished",
    origin:   "Faroe Islands, 2023",
    radius:   3.2,
  },
  {
    id:       "acid-canopy-specimen",
    position: [0, 0, -128],
    label:    "Leucobryum Specimen",
    detail:   "Cushion moss grown under controlled spectrum lighting. The pale blue-green coloration results from dead hyaline cells that fill with air, creating a reflective interior surface.",
    material: "Living Moss · Leucobryum glaucum",
    origin:   "Acid Canopy Greenhouse, Level 2",
    radius:   3.0,
  },
  {
    id:       "chrome-prototype",
    position: [45, 0, -82],
    label:    "Prototype 07-C",
    detail:   "Vacuum-formed chrome alloy housing for an undisclosed sensory instrument. The surface topography records thermal expansion cycles during fabrication — each line is a material memory.",
    material: "Chrome Alloy · Mirror-Polished · 2mm",
    origin:   "Chrome Works Fabrication, Bay 3",
    radius:   3.2,
  },
  {
    id:       "glacier-core",
    position: [-38, 0, -165],
    label:    "Ice Core Sample",
    detail:   "A 60cm section extracted from a 12,000-year-old glacier archive. Trapped air bubbles contain atmospheric data predating industrialisation. The blue tint increases with depth and age.",
    material: "Glacial Ice · Preserved at −18°C",
    origin:   "Glacier District Cold Store, Sub-Level 1",
    radius:   3.2,
  },
  {
    id:       "deep-violet-object",
    position: [0, 0, -195],
    label:    "Resonance Object",
    detail:   "A hand-cast violet pigment block, the same formulation used in Yves Klein's IKB but shifted toward ultraviolet. Under UV illumination the object appears to absorb all visible light.",
    material: "Synthetic Ultramarine Violet · Cast Resin",
    origin:   "Deep Violet Research Lab",
    radius:   3.0,
  },
]

/* ── Quality tier detection (runs once in browser, never on server) ── */
type Quality = "high" | "medium" | "low"

function detectQuality(): Quality {
  if (typeof window === "undefined") return "high"
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return "low"
  const cores = navigator.hardwareConcurrency ?? 4
  return cores >= 8 ? "high" : cores >= 4 ? "medium" : "low"
}

const QUALITY_DPR:        Record<Quality, [number, number]> = {
  high:   [1, 1.75],
  medium: [1, 1.50],
  low:    [1, 1.00],
}
const QUALITY_RAIN_COUNT: Record<Quality, number> = { high: 4000, medium: 2000, low: 0 }
const QUALITY_BLOOM:      Record<Quality, boolean> = { high: true,  medium: true,  low: false }
const QUALITY_SHADOWS:    Record<Quality, boolean> = { high: true,  medium: false, low: false }

interface Props { onExit: () => void }

type SceneProps = Props & {
  fogDensity:  number
  onPrompt:    (t: string | null) => void
  playerState: React.MutableRefObject<PlayerSharedState>
  rainCount:   number
  bloom:       boolean
}

function Scene({ onExit, fogDensity, onPrompt, playerState, rainCount, bloom }: SceneProps) {
  return (
    <>
      <color attach="background" args={["#05070B"]} />
      <fogExp2 attach="fog" args={["#07100D", fogDensity]} />

      <Lights />

      <Suspense fallback={null}>
        <City />
        <Skyline />
        {rainCount > 0 && <Rain count={rainCount} />}
        <Player colliders={COLLIDERS} onExit={onExit} onPrompt={onPrompt} playerState={playerState} />
        <CatCompanion playerState={playerState} />
        <NPCs defs={NPC_LAYOUT} />
        {INSPECTABLES.map(def => (
          <InspectableObject key={def.id} def={def} playerState={playerState} />
        ))}
      </Suspense>

      {bloom && (
        <EffectComposer>
          <Bloom intensity={0.62} luminanceThreshold={0.60} luminanceSmoothing={0.80} mipmapBlur />
        </EffectComposer>
      )}
    </>
  )
}

export function CompoundWorld({ onExit }: Props) {
  const [prompt, setPrompt]         = useState<string | null>(null)
  const [interior, setInterior]     = useState(false)
  const [inspecting, setInspecting] = useState<InspectableDef | null>(null)

  const playerState       = useRef<PlayerSharedState>({ pos: new THREE.Vector3(0, 0, 8), yaw: 0, moving: false })
  const nearInspectable   = useRef<InspectableDef | null>(null)
  const [inspectPrompt, setInspectPrompt] = useState<string | null>(null)

  /* Quality tier — detected once, drives dpr / bloom / rain count */
  const [quality]  = useState<Quality>(detectQuality)
  const dpr        = QUALITY_DPR[quality]
  const rainCount  = QUALITY_RAIN_COUNT[quality]
  const bloom      = QUALITY_BLOOM[quality]
  const shadows    = QUALITY_SHADOWS[quality]

  /* Interior state */
  useEffect(() => {
    const handler = (e: Event) => {
      const active = (e as CustomEvent<{ active: boolean }>).detail.active
      setInterior(active)
      if (!active) setPrompt(null)
    }
    window.addEventListener("compound-interior", handler)
    return () => window.removeEventListener("compound-interior", handler)
  }, [])

  /* Inspectable proximity events */
  useEffect(() => {
    const handler = (e: Event) => {
      const def = (e as CustomEvent<{ def: InspectableDef | null }>).detail.def
      nearInspectable.current = def
      setInspectPrompt(def ? `[ E ]  ${def.label.toUpperCase()}` : null)
    }
    window.addEventListener(INSPECT_NEAR_EVENT, handler)
    return () => window.removeEventListener(INSPECT_NEAR_EVENT, handler)
  }, [])

  /* E key — open inspection panel (estate entrance takes priority via Player) */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "KeyE") return
      if (inspecting) { setInspecting(null); return }
      if (nearInspectable.current) setInspecting(nearInspectable.current)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [inspecting])

  const handlePrompt = useCallback((t: string | null) => setPrompt(t), [])
  const fogDensity   = interior ? 0.001 : 0.011

  /* Estate prompt takes priority over inspect prompt */
  const shownPrompt = prompt || (!inspecting ? inspectPrompt : null)

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99998, background: "#05070B", overflow: "hidden" }}>
      <Canvas
        shadows={shadows}
        dpr={dpr}
        gl={{
          antialias:           quality !== "low",
          powerPreference:     "high-performance",
          outputColorSpace:    THREE.SRGBColorSpace,
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: interior ? 1.1 : 0.88,
        }}
        camera={{ fov: 72, near: 0.1, far: 900, position: [0, 1.6, 12] }}
      >
        <Scene
          onExit={onExit} fogDensity={fogDensity} onPrompt={handlePrompt}
          playerState={playerState} rainCount={rainCount} bloom={bloom}
        />
      </Canvas>

      <CityAmbience interior={interior} />

      {/* Cinematic vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(0,0,0,0.72) 100%)",
      }} />

      {/* HUD wordmark */}
      <div style={{
        position: "absolute", top: 16, left: 20,
        fontFamily: "'Courier New', monospace",
        fontSize: 9, letterSpacing: "0.28em", color: "#B5CC45",
        pointerEvents: "none",
      }}>
        <span style={{ opacity: 0.5 }}>COMPOUND</span>{" "}
        <span style={{ color: "rgba(237,228,216,0.25)" }}>{interior ? "ESTATE · INTERIOR" : "WORLD"}</span>
      </div>

      {/* Controls hint */}
      {!interior && !inspecting && (
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          fontFamily: "'Courier New', monospace", fontSize: 8.5, letterSpacing: "0.18em",
          color: "rgba(237,228,216,0.22)", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          CLICK TO LOOK   ·   WASD MOVE   ·   SHIFT RUN   ·   ESC EXIT
        </div>
      )}
      {interior && !inspecting && (
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          fontFamily: "'Courier New', monospace", fontSize: 8.5, letterSpacing: "0.18em",
          color: "rgba(237,228,216,0.22)", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          WASD MOVE   ·   ESC RETURN OUTSIDE
        </div>
      )}

      {/* Entrance / inspect prompt */}
      {shownPrompt && !inspecting && (
        <div style={{
          position: "absolute", bottom: 56, left: "50%", transform: "translateX(-50%)",
          fontFamily: "'Courier New', monospace", fontSize: 11, letterSpacing: "0.22em",
          color: "#E6B87A", background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(230,184,122,0.28)", padding: "8px 22px",
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {shownPrompt}
        </div>
      )}

      {/* Inspection panel */}
      {inspecting && (
        <InspectPanel def={inspecting} onClose={() => setInspecting(null)} />
      )}

      <button
        onClick={onExit}
        style={{
          position: "absolute", top: 14, right: 16,
          background: "rgba(0,0,0,0.55)", border: "1px solid rgba(237,228,216,0.14)",
          color: "rgba(237,228,216,0.4)", fontFamily: "'Courier New', monospace",
          fontSize: 8.5, letterSpacing: "0.2em", padding: "6px 14px", cursor: "pointer",
        }}
      >
        ✕ EXIT
      </button>
    </div>
  )
}
