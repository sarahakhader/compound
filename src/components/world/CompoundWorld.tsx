"use client"
import React, { Suspense, useState, useEffect, useCallback, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
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

class GameErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { crashed: boolean }
> {
  constructor(props: any) { super(props); this.state = { crashed: false } }
  static getDerivedStateFromError() { return { crashed: true } }
  componentDidCatch() { this.props.onError() }
  render() {
    if (this.state.crashed) return null
    return this.props.children
  }
}

function ExposureUpdater({ interior }: { interior: boolean }) {
  const { gl } = useThree()
  useEffect(() => { gl.toneMappingExposure = interior ? 1.05 : 0.82 }, [gl, interior])
  return null
}

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

/* ────────────────────────────────────────────────────────────────────────────
   Quality tier detection
   Priority order:
   1. Mobile → always "low"
   2. Integrated/Apple GPU string → "medium"  (this is the laptop fix)
   3. Core count → high/medium/low
────────────────────────────────────────────────────────────────────────────── */
type Quality = "high" | "medium" | "low"

function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium"
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return "low"

  // Check GPU renderer string — integrated GPUs get medium, never high
  try {
    const testCanvas = document.createElement("canvas")
    const gl = testCanvas.getContext("webgl") ?? testCanvas.getContext("experimental-webgl") as WebGLRenderingContext | null
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info")
      if (ext) {
        const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string
        const lc = renderer.toLowerCase()
        // Intel HD / Iris, Apple Silicon GPU, ARM Mali, Adreno → medium
        if (/intel|apple m\d|apple gpu|mali|adreno/i.test(lc)) return "medium"
      }
    }
  } catch { /* ignore — can't read renderer string in some browser configs */ }

  const cores = navigator.hardwareConcurrency ?? 4
  return cores >= 12 ? "high" : cores >= 6 ? "medium" : "low"
}

/* DPR: capped at 1.0 on all tiers to prevent Retina pixel count doubling GPU load */
const QUALITY_DPR: Record<Quality, [number, number]> = {
  high:   [1, 1.0],
  medium: [1, 1.0],
  low:    [1, 1.0],
}
const QUALITY_RAIN_COUNT: Record<Quality, number> = {
  high:   500,
  medium: 0,
  low:    0,
}

interface Props { onExit: () => void; onReady?: () => void }

type SceneProps = Props & {
  fogDensity:  number
  interior:    boolean
  onPrompt:    (t: string | null) => void
  playerState: React.MutableRefObject<PlayerSharedState>
  rainCount:   number
  quality:     Quality
}

function PostFX({ quality }: { quality: Quality }) {
  if (quality === "low") return null
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom
        intensity={quality === "high" ? 1.8 : 1.1}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.45}
        height={quality === "high" ? 360 : 220}
      />
    </EffectComposer>
  )
}

function Scene({ onExit, fogDensity, interior, onPrompt, playerState, rainCount, onReady, quality }: SceneProps) {
  const firedReady = useRef(false)
  useFrame(() => {
    if (!firedReady.current) {
      firedReady.current = true
      onReady?.()
    }
  })
  return (
    <>
      <color attach="background" args={["#04060A"]} />
      <fogExp2 attach="fog" args={["#07100D", fogDensity]} />
      <ExposureUpdater interior={interior} />

      <Lights />

      <Suspense fallback={null}>
        <City interior={interior} />
        <Skyline />
        {rainCount > 0 && <Rain count={rainCount} />}
        <Player colliders={COLLIDERS} onExit={onExit} onPrompt={onPrompt} playerState={playerState} />
        <CatCompanion playerState={playerState} />
        <NPCs defs={NPC_LAYOUT} />
        {INSPECTABLES.map(def => (
          <InspectableObject key={def.id} def={def} playerState={playerState} />
        ))}
      </Suspense>

      <PostFX quality={quality} />
    </>
  )
}

export function CompoundWorld({ onExit, onReady }: Props) {
  const [prompt, setPrompt]         = useState<string | null>(null)
  const [interior, setInterior]     = useState(false)
  const [inspecting, setInspecting] = useState<InspectableDef | null>(null)
  const [crashed, setCrashed]       = useState(false)

  const playerState       = useRef<PlayerSharedState>({ pos: new THREE.Vector3(0, 0, 8), yaw: 0, moving: false })
  const nearInspectable   = useRef<InspectableDef | null>(null)
  const [inspectPrompt, setInspectPrompt] = useState<string | null>(null)
  const canvasRef         = useRef<HTMLCanvasElement | null>(null)

  const [quality]  = useState<Quality>(detectQuality)
  const dpr        = QUALITY_DPR[quality]
  const rainCount  = QUALITY_RAIN_COUNT[quality]

  /* ── WebGL context lost → exit game cleanly ── */
  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault()
      console.warn("[CompoundWorld] WebGL context lost — exiting game")
      onExit()
    }
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null
    canvas?.addEventListener("webglcontextlost", handleContextLost)
    return () => canvas?.removeEventListener("webglcontextlost", handleContextLost)
  }, [onExit])

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

  /* E key */
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
  const handleError  = useCallback(() => { setCrashed(true); setTimeout(onExit, 50) }, [onExit])
  const fogDensity   = interior ? 0.001 : 0.010

  const shownPrompt = prompt || (!inspecting ? inspectPrompt : null)

  if (crashed) return null

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99998, background: "#04060A", overflow: "hidden" }}>
      <GameErrorBoundary onError={handleError}>
        <Canvas
          dpr={dpr}
          gl={{
            antialias:        quality === "high",
            powerPreference:  "high-performance",
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping:      THREE.ACESFilmicToneMapping,
            alpha:            false,
            stencil:          false,
            depth:            true,
          }}
          camera={{ fov: 70, near: 0.15, far: 550, position: [0, 1.6, 12] }}
          frameloop="always"
          performance={{ min: 0.5 }}
        >
          <Scene
            onExit={onExit}
            fogDensity={fogDensity}
            interior={interior}
            onPrompt={handlePrompt}
            playerState={playerState}
            rainCount={rainCount}
            onReady={onReady}
            quality={quality}
          />
        </Canvas>
      </GameErrorBoundary>

      <CityAmbience interior={interior} />

      {/* Cinematic vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.78) 100%)",
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

      {/* Quality badge — helps user know what mode they're in */}
      <div style={{
        position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
        fontFamily: "'Courier New', monospace", fontSize: 7.5, letterSpacing: "0.22em",
        color: "rgba(237,228,216,0.12)", pointerEvents: "none",
      }}>
        {quality.toUpperCase()}
      </div>

      {/* Controls hint */}
      {!interior && !inspecting && (
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          fontFamily: "'Courier New', monospace", fontSize: 8.5, letterSpacing: "0.18em",
          color: "rgba(237,228,216,0.22)", pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          WASD MOVE   ·   ARROWS LOOK   ·   SHIFT RUN   ·   ESC EXIT
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

      {/* Prompt */}
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
