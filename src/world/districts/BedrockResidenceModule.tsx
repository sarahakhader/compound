"use client"
import { useMemo, useEffect, useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { Collider } from "../../components/world/City"

/* ─────────────────────────────────────────────────────────────────────────────
   TEXTURE GENERATORS  (called once per component mount, never in render path)
───────────────────────────────────────────────────────────────────────────── */

function makeCharredBoardTex(repeatX = 2.8, repeatY = 0.8): THREE.CanvasTexture {
  const W = 256, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#0d0e10"; ctx.fillRect(0, 0, W, H)
  const boardW = 9
  for (let x = 0; x < W; x += boardW) {
    const lum = 0.88 + Math.random() * 0.14
    ctx.fillStyle = `rgb(${Math.floor(15*lum)},${Math.floor(16*lum)},${Math.floor(19*lum)})`
    ctx.fillRect(x, 0, boardW - 1, H)
    ctx.fillStyle = "#070809"; ctx.fillRect(x + boardW - 1, 0, 1, H)
    for (let i = 0; i < 5; i++) {
      const gx = x + Math.random() * (boardW - 2)
      const str = Math.random() * 0.55
      ctx.strokeStyle = `rgba(${Math.floor(6+str*14)},${Math.floor(7+str*14)},${Math.floor(9+str*16)},0.75)`
      ctx.lineWidth = 0.5 + Math.random()
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx + (Math.random()-0.5)*5, H); ctx.stroke()
    }
  }
  for (let i = 0; i < 3200; i++) {
    const x = Math.random()*W; const y = Math.random()*H
    ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.14})`
    ctx.fillRect(x, y, 1 + Math.random()*2, 1 + Math.random()*2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.repeat.set(repeatX, repeatY)     // ← set once here, never in render
  return tex
}

function makePlinthConcreteTex(repeatX = 2.8, repeatY = 0.8): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#0a0b0d"; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = "#0d0e10"; ctx.lineWidth = 1
  for (let y = 0; y < H; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  for (let i = 0; i < 1800; i++) {
    const x = Math.random()*W; const y = Math.random()*H; const v = 10 + Math.floor(Math.random()*9)
    ctx.fillStyle = `rgba(${v},${v},${v+2},0.42)`; ctx.fillRect(x, y, 1, 1)
  }
  for (let i = 0; i < 5; i++) {
    const x0 = Math.random()*W; const y0 = Math.random()*H
    ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 0.7
    ctx.beginPath(); ctx.moveTo(x0, y0)
    ctx.lineTo(x0 + (Math.random()-0.5)*90, y0 + (Math.random()-0.5)*90); ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.repeat.set(repeatX, repeatY)
  return tex
}

function makeGaragePanelTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#09090c"; ctx.fillRect(0, 0, W, H)
  const ribH = 22
  for (let y = 0; y < H; y += ribH) {
    ctx.fillStyle = "#111215"; ctx.fillRect(0, y, W, 2)
    ctx.fillStyle = "#0b0c0f"; ctx.fillRect(0, y + 2, W, ribH - 3)
    ctx.fillStyle = "#050608"; ctx.fillRect(0, y + ribH - 2, W, 2)
  }
  ctx.strokeStyle = "#0e0f12"; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeWetAsphaltTex(): THREE.CanvasTexture {
  const W = 512, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#0c0e10"; ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 3200; i++) {
    const x = Math.random()*W; const y = Math.random()*H
    const r = 0.7 + Math.random()*2.6
    const v = 11 + Math.floor(Math.random()*13)
    ctx.fillStyle = `rgba(${v},${v},${v+2},0.8)`
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill()
  }
  for (let i = 0; i < 6; i++) {
    const x0 = Math.random()*W; const y0 = Math.random()*H
    ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 0.9
    ctx.beginPath(); ctx.moveTo(x0, y0)
    ctx.lineTo(x0 + (Math.random()-0.5)*180, y0 + (Math.random()-0.5)*180); ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.repeat.set(3, 11)
  return tex
}

function makeGridWindowTex(): THREE.CanvasTexture {
  const cols = 4, rows = 3
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  const fw = 10
  const pw = (W - fw*(cols+1)) / cols
  const ph = (H - fw*(rows+1)) / rows
  ctx.fillStyle = "#18191e"; ctx.fillRect(0, 0, W, H)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = fw + col*(pw+fw); const py = fw + row*(ph+fw)
      const k = 0.55 + Math.random()*0.45
      ctx.fillStyle = `rgb(${Math.floor(175*k)},${Math.floor(125*k)},${Math.floor(75*k)})`
      ctx.fillRect(px, py, pw, ph)
      ctx.fillStyle = "rgba(220,230,255,0.07)"
      ctx.fillRect(px, py, pw*0.32, ph)
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeUrbanFacadeTex(): THREE.CanvasTexture {
  const W = 256, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#111317"; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = "#191b21"; ctx.lineWidth = 1.5
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  for (let i = 0; i < 1600; i++) {
    const x = Math.random()*W; const y = Math.random()*H; const v = 14 + Math.floor(Math.random()*8)
    ctx.fillStyle = `rgba(${v},${v},${v+2},0.35)`; ctx.fillRect(x, y, 1, 1)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.repeat.set(1, 1.4)
  return tex
}

/* ─────────────────────────────────────────────────────────────────────────────
   BEDROCK RESIDENCE
   Ref: CW_BEDROCK_RESIDENCE_FRONT_DAY_V01

   LOD tiers:
     <18m  HIGH — full geometry + glass planes
     18-45m MED — no glass planes
     >45m  LOW  — single massed slab (early return)

   Collision: single AABB  hw=7.3  hd=5.6
───────────────────────────────────────────────────────────────────────────── */

export const BEDROCK_RESIDENCE_COLLIDER: Collider = { x: 0, z: 0, hw: 7.3, hd: 5.6 }

interface BedrockResidenceProps {
  position?: [number, number, number]
}

export function BedrockResidence({ position = [0, 0, 0] }: BedrockResidenceProps) {
  // All repeat.set calls happen inside the factory — never in the render path
  const charTex   = useMemo(() => makeCharredBoardTex(2.8, 0.8), [])
  const plinthTex = useMemo(() => makePlinthConcreteTex(2.8, 0.8), [])
  const garageTex = useMemo(makeGaragePanelTex, [])
  useEffect(() => () => { charTex.dispose(); plinthTex.dispose(); garageTex.dispose() }, [charTex, plinthTex, garageTex])

  const { camera } = useThree()
  const [lod, setLod] = useState<"high" | "med" | "low">("high")
  const lodRef = useRef<"high" | "med" | "low">("high")
  const wp = useMemo(() => new THREE.Vector3(...position), [position])

  useFrame(() => {
    const d = camera.position.distanceTo(wp)
    const next: "high" | "med" | "low" = d < 18 ? "high" : d < 45 ? "med" : "low"
    if (next !== lodRef.current) { lodRef.current = next; setLod(next) }
  })

  const W = 14.2, D = 11.0, G = 3.4, U = 3.6, PT = 0.8, PC = 1.6

  const charProps   = { color: "#0d0e10" as const, roughness: 0.88, metalness: 0.0,  map: charTex }
  const plinthProps = { color: "#0a0b0d" as const, roughness: 0.92, metalness: 0.02, map: plinthTex }

  // LOW LOD — single baked slab, return early so the rest of the tree never mounts
  if (lod === "low") {
    return (
      <group position={position}>
        <mesh position={[0, (G+U+PC)/2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, G+U+PC, D]} />
          <meshStandardMaterial color="#0d0e10" roughness={0.9} />
        </mesh>
      </group>
    )
  }

  return (
    <group position={position}>

      {/* ── MODULE A: Ground plinth ── */}
      <mesh position={[0, G/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, G, D]} />
        <meshStandardMaterial {...plinthProps} />
      </mesh>
      {/* Plinth cap slab — 50mm overhang */}
      <mesh position={[0, G + 0.08, 0]} castShadow>
        <boxGeometry args={[W + 0.12, 0.16, D + 0.12]} />
        <meshStandardMaterial color="#080909" roughness={0.94} />
      </mesh>

      {/* ── MODULE B: Garage door bays × 3 ── */}
      {([-4.44, 0, 4.44] as number[]).map((gx, i) => (
        <group key={i} position={[gx, G/2 - 0.05, D/2]}>
          <mesh position={[0, 0, -0.06]}>
            <boxGeometry args={[4.08, 2.96, 0.12]} />
            <meshStandardMaterial color="#060709" roughness={0.88} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[3.88, 2.78, 0.07]} />
            <meshStandardMaterial color="#08090c" roughness={0.74} metalness={0.42} map={garageTex} />
          </mesh>
          <mesh position={[0, -1.42, 0.04]}>
            <boxGeometry args={[3.88, 0.06, 0.05]} />
            <meshStandardMaterial color="#050608" roughness={0.99} />
          </mesh>
        </group>
      ))}

      {/* ── MODULE C: Upper mass body ── */}
      <mesh position={[0, G + U/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, U, D]} />
        <meshStandardMaterial {...charProps} />
      </mesh>

      {/* ── MODULE D: Stepped parapet ── */}
      {([-5.4, 5.4] as number[]).map((px, i) => (
        <mesh key={i} position={[px, G + U + PT/2, 0]} castShadow>
          <boxGeometry args={[3.4, PT, D]} />
          <meshStandardMaterial {...charProps} />
        </mesh>
      ))}
      <mesh position={[0, G + U + PC/2, 0]} castShadow>
        <boxGeometry args={[7.4, PC, D]} />
        <meshStandardMaterial {...charProps} />
      </mesh>
      {/* Parapet cap slabs */}
      {([-5.4, 5.4] as number[]).map((px, i) => (
        <mesh key={i} position={[px, G + U + PT + 0.09, 0]}>
          <boxGeometry args={[3.44, 0.18, D + 0.12]} />
          <meshStandardMaterial color="#09090c" roughness={0.93} />
        </mesh>
      ))}
      <mesh position={[0, G + U + PC + 0.09, 0]}>
        <boxGeometry args={[7.52, 0.18, D + 0.12]} />
        <meshStandardMaterial color="#09090c" roughness={0.93} />
      </mesh>

      {/* ── MODULE E: Window Type A — vertical slot ── */}
      <group position={[-5.82, G + 1.42, D/2]}>
        <mesh position={[0, 0, -0.09]}>
          <boxGeometry args={[0.66, 2.44, 0.18]} />
          <meshStandardMaterial color="#040506" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[0.76, 2.54, 0.06]} />
          <meshStandardMaterial color="#0c0d11" roughness={0.58} metalness={0.72} />
        </mesh>
        {lod === "high" && (
          <mesh position={[0, 0, 0.02]}>
            <planeGeometry args={[0.60, 2.38]} />
            <meshStandardMaterial color="#090c14" roughness={0.05} metalness={0.92} transparent opacity={0.9} />
          </mesh>
        )}
      </group>

      {/* ── MODULE F: Window Type B — horizontal banner × 2 ── */}
      {([-2.0, 4.44] as number[]).map((wx, i) => (
        <group key={i} position={[wx, G + U - 1.36, D/2]}>
          <mesh position={[0, 0, -0.09]}>
            <boxGeometry args={[2.96, 0.96, 0.18]} />
            <meshStandardMaterial color="#040506" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[3.08, 1.08, 0.06]} />
            <meshStandardMaterial color="#0c0d11" roughness={0.58} metalness={0.72} />
          </mesh>
          {lod === "high" && (
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[2.88, 0.88]} />
              <meshStandardMaterial color="#090c14" roughness={0.05} metalness={0.92} transparent opacity={0.9} />
            </mesh>
          )}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[0.04, 0.84, 0.04]} />
            <meshStandardMaterial color="#0d0e12" roughness={0.55} metalness={0.82} />
          </mesh>
        </group>
      ))}

      {/* ── MODULE G: Back-wall residential windows × 3 ── */}
      {([-4.2, 0, 4.2] as number[]).map((wx, i) => (
        <group key={i} position={[wx, G + 1.3, -D/2]}>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[1.42, 1.18, 0.14]} />
            <meshStandardMaterial color="#040506" roughness={0.72} />
          </mesh>
          {lod === "high" && (
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[1.34, 1.10]} />
              <meshStandardMaterial color="#090c14" roughness={0.05} metalness={0.92} transparent opacity={0.88} />
            </mesh>
          )}
        </group>
      ))}

      {/* ── MODULE H: Trim sill at upper-floor datum ── */}
      <mesh position={[0, G + 0.22, D/2 + 0.01]} castShadow>
        <boxGeometry args={[W, 0.12, 0.24]} />
        <meshStandardMaterial color="#090a0c" roughness={0.86} metalness={0.12} />
      </mesh>

      {/* ── MODULE I: Forecourt apron ── */}
      <mesh position={[0, -0.02, D/2 + 3.8]} receiveShadow>
        <boxGeometry args={[W + 2, 0.06, 7.6]} />
        <meshStandardMaterial color="#0d0e12" roughness={0.86} metalness={0.05} map={plinthTex} />
      </mesh>
      <mesh position={[0, 0.002, D/2 + 3.8]}>
        <boxGeometry args={[W + 1.8, 0.001, 7.4]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.04} metalness={0.58} transparent opacity={0.38} depthWrite={false} />
      </mesh>

      {/* ── MODULE J: Vegetation — shrub cluster, bottom-left ── */}
      {/* Positions / sizes are constants — no Math.random() in render */}
      {([
        { vo: 0.00, rx: 0.65, ry: 0.85, r: 0.33 },
        { vo: 0.38, rx: 0.80, ry: 0.65, r: 0.38 },
        { vo: 0.72, rx: 0.50, ry: 0.47, r: 0.42 },
      ]).map(({ vo, rx, ry, r }, i) => (
        <mesh key={i} position={[-W/2 + rx, 0.28 + vo*0.32, D/2 + ry - vo*0.22]} castShadow>
          <sphereGeometry args={[r, 6, 5]} />
          <meshStandardMaterial color="#1B2B18" roughness={0.98} />
        </mesh>
      ))}

      {/* ── MODULE K: Under-garage accent light ── */}
      <pointLight position={[0, 0.6, D/2 + 0.4]} color="#e8c88a" intensity={14} distance={9} decay={2.2} />

      {/* ── WEATHERING: base-of-plinth stain strip ── */}
      <mesh position={[0, 0.04, D/2 + 0.02]} receiveShadow>
        <boxGeometry args={[W, 0.08, 0.05]} />
        <meshStandardMaterial color="#07080a" roughness={0.99} transparent opacity={0.62} />
      </mesh>

    </group>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   BEDROCK ALLEY STREET
   Ref: CW_BEDROCK_STREET_GAMEPLAY_NIGHT_V03

   Textures:  created ONCE in BedrockAlley, passed as props to bay modules.
              Never created inside a .map() loop.

   Puddle data: stable array from useMemo — no Math.random() in JSX.

   Collision: 2 wall AABBs + south end cap
───────────────────────────────────────────────────────────────────────────── */

export const BEDROCK_ALLEY_COLLIDERS: Collider[] = [
  { x:  8, z: -22, hw: 2, hd: 22 },
  { x: -8, z: -22, hw: 2, hd: 22 },
  { x:  0, z: -45, hw: 8, hd: 1  },
]

/* ── Module P: Amber tube wall fixture ── */
function AmberTubeFix({ x, y, z, ry = 0 }: { x: number; y: number; z: number; ry?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0, 0.14]}>
        <boxGeometry args={[0.06, 0.06, 0.28]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.55} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.3]}>
        <boxGeometry args={[1.72, 0.06, 0.06]} />
        <meshStandardMaterial color="#E6832A" emissive="#E6832A" emissiveIntensity={4.2} roughness={0.3} />
      </mesh>
      <pointLight position={[0, -0.18, 0.34]} color="#E67B2E" intensity={26} distance={9} decay={2} />
    </group>
  )
}

/* ── Module N: Warehouse bay — texture received from parent, NEVER created here ── */
function WarehouseBayModule({
  x, z, lod, gridTex,
}: {
  x: number; z: number
  lod: "high" | "med" | "low"
  gridTex: THREE.CanvasTexture
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 9.0, 0.8]} />
        <meshStandardMaterial color="#111315" roughness={0.9} metalness={0.04} />
      </mesh>
      <mesh position={[0, 3.8, 0.42]}>
        <boxGeometry args={[2.2, 2.6, 0.04]} />
        <meshStandardMaterial
          color="#1a1c22" roughness={0.55} metalness={0.3}
          map={gridTex}
          emissive="#604020" emissiveIntensity={lod === "low" ? 0.08 : 0.22}
        />
      </mesh>
      <mesh position={[0, 3.8, 0.46]}>
        <boxGeometry args={[2.38, 2.78, 0.04]} />
        <meshStandardMaterial color="#18191f" roughness={0.7} metalness={0.55} />
      </mesh>
    </group>
  )
}

/* ── Module O: Retail bay — texture received from parent, NEVER created here ── */
function RetailBayModule({
  x, z, lod, urbanTex,
}: {
  x: number; z: number
  lod: "high" | "med" | "low"
  urbanTex: THREE.CanvasTexture
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 9.0, 0.8]} />
        <meshStandardMaterial color="#111317" roughness={0.88} metalness={0.02} map={urbanTex} />
      </mesh>
      <mesh position={[0, 1.3, -0.28]}>
        <boxGeometry args={[2.8, 2.6, 0.56]} />
        <meshStandardMaterial color="#08090c" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.3, -0.54]}>
        <planeGeometry args={[2.7, 2.5]} />
        <meshStandardMaterial
          color="#e8c070" emissive="#e8c070"
          emissiveIntensity={lod === "low" ? 0.10 : 0.35}
          roughness={0.9} transparent opacity={0.8} depthWrite={false}
        />
      </mesh>
      {lod !== "low" && (
        <pointLight position={[0, 0.6, -0.2]} color="#e8c070" intensity={12} distance={5} decay={2.2} />
      )}
    </group>
  )
}

interface BedrockAlleyProps {
  position?: [number, number, number]
}

export function BedrockAlley({ position = [0, 0, 0] }: BedrockAlleyProps) {
  // ONE texture per type — never multiplied by bay count
  const asphaltTex = useMemo(makeWetAsphaltTex, [])
  const gridTex    = useMemo(makeGridWindowTex, [])
  const urbanTex   = useMemo(makeUrbanFacadeTex, [])
  useEffect(() => () => {
    asphaltTex.dispose(); gridTex.dispose(); urbanTex.dispose()
  }, [asphaltTex, gridTex, urbanTex])

  const { camera } = useThree()
  const [lod, setLod] = useState<"high" | "med" | "low">("high")
  const lodRef = useRef<"high" | "med" | "low">("high")
  const wp = useMemo(() => new THREE.Vector3(...position), [position])

  useFrame(() => {
    const d = camera.position.distanceTo(wp)
    const next: "high" | "med" | "low" = d < 22 ? "high" : d < 55 ? "med" : "low"
    if (next !== lodRef.current) { lodRef.current = next; setLod(next) }
  })

  const bayZs = useMemo(() => [-4, -8, -12, -16, -20, -24, -28, -32, -36, -40], [])

  // Puddle data computed ONCE — no Math.random() ever runs in JSX
  const puddles = useMemo(() => [
    { px: -2.4, pz:  -6, w: 1.12, d: 0.72, ry: 0.38 },
    { px:  1.8, pz: -14, w: 0.94, d: 0.58, ry: 1.85 },
    { px: -1.2, pz: -22, w: 1.30, d: 0.68, ry: 0.92 },
    { px:  2.2, pz: -31, w: 0.88, d: 0.64, ry: 2.44 },
    { px: -2.8, pz: -38, w: 1.05, d: 0.55, ry: 1.12 },
  ], [])

  return (
    <group position={position}>

      {/* ── MODULE L: Wet asphalt ground ── */}
      <mesh position={[0, -0.02, -22]} receiveShadow>
        <boxGeometry args={[12, 0.06, 44]} />
        <meshStandardMaterial color="#0c0e10" roughness={0.84} metalness={0.06} map={asphaltTex} />
      </mesh>
      <mesh position={[0, 0.003, -22]}>
        <boxGeometry args={[11.8, 0.001, 43.8]} />
        <meshStandardMaterial color="#1a1e28" roughness={0.02} metalness={0.72} transparent opacity={0.52} depthWrite={false} />
      </mesh>

      {/* ── MODULE M: Puddle decals (stable positions, stable geometry args) ── */}
      {lod !== "low" && puddles.map((p, i) => (
        <mesh key={i} position={[p.px, 0.004, p.pz]} rotation={[-Math.PI/2, 0, p.ry]}>
          <planeGeometry args={[p.w, p.d]} />
          <meshStandardMaterial color="#1c2030" roughness={0.01} metalness={0.85} transparent opacity={0.65} depthWrite={false} />
        </mesh>
      ))}

      {/* ── MODULE N: Left (east) warehouse wall — continuous mass + bays ── */}
      <mesh position={[7.4, 4.5, -22]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 9.0, 44]} />
        <meshStandardMaterial color="#0f1013" roughness={0.92} metalness={0.04} />
      </mesh>
      {bayZs.map((bz, i) => (
        <WarehouseBayModule key={i} x={6.2} z={bz} lod={lod} gridTex={gridTex} />
      ))}

      {/* ── MODULE P: Amber tube fixtures ── */}
      {[-5, -13, -21, -29, -37].map((fz, i) => (
        <AmberTubeFix key={i} x={6.0} y={5.2} z={fz} ry={-Math.PI/2} />
      ))}

      {/* ── MODULE O: Right (west) retail wall — continuous mass + bays ── */}
      <mesh position={[-7.4, 4.5, -22]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 9.0, 44]} />
        <meshStandardMaterial color="#111317" roughness={0.88} metalness={0.02} />
      </mesh>
      {bayZs.map((bz, i) => (
        <RetailBayModule key={i} x={-6.2} z={bz} lod={lod} urbanTex={urbanTex} />
      ))}

      {/* ── MODULE Q: Violet neon cornice ── */}
      <mesh position={[-6.2, 8.56, -22]}>
        <boxGeometry args={[0.06, 0.06, 44]} />
        <meshStandardMaterial color="#7744CC" emissive="#7744CC" emissiveIntensity={3.8} roughness={0.3} />
      </mesh>
      {lod !== "low" && (
        <pointLight position={[-5.8, 8.4, -22]} color="#7744CC" intensity={18} distance={14} decay={2} />
      )}

      {/* ── MODULE R: Distant vanishing-point street lamp ── */}
      <group position={[0, 0, -42]}>
        <mesh position={[0, 3.0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 6.0, 6]} />
          <meshStandardMaterial color="#1a1c22" roughness={0.55} metalness={0.85} />
        </mesh>
        <mesh position={[0, 6.1, 0]}>
          <sphereGeometry args={[0.12, 6, 5]} />
          <meshStandardMaterial color="#e8d080" emissive="#e8d080" emissiveIntensity={5.0} roughness={0.3} />
        </mesh>
        <pointLight position={[0, 5.9, 0]} color="#e8d090" intensity={30} distance={16} decay={2} />
      </group>

      {/* ── MODULE S: End cap + entrance lintel (prevents bleed-through) ── */}
      <mesh position={[0, 4.5, -44.5]} castShadow>
        <boxGeometry args={[12, 9.0, 1.0]} />
        <meshStandardMaterial color="#0f1013" roughness={0.92} />
      </mesh>
      <mesh position={[0, 9.1, -22]}>
        <boxGeometry args={[12.8, 0.4, 44]} />
        <meshStandardMaterial color="#0a0b0e" roughness={0.95} />
      </mesh>

    </group>
  )
}
