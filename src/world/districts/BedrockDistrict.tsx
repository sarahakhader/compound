"use client"
import { useMemo, useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { COLORS, MAT } from "../WorldConfig"
import {
  BedrockResidence,
  BedrockAlley,
  BEDROCK_RESIDENCE_COLLIDER,
  BEDROCK_ALLEY_COLLIDERS,
} from "./BedrockResidenceModule"

/* ─── Canvas texture helpers ─────────────────────────────────────────────── */

function makeCarvedConcreteTex(): THREE.CanvasTexture {
  const W = 512, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  // Base — dark terracotta-concrete
  ctx.fillStyle = "#2a1a0e"
  ctx.fillRect(0, 0, W, H)
  // Horizontal carve lines
  ctx.strokeStyle = "#1a0e06"
  ctx.lineWidth = 2
  for (let y = 0; y < H; y += 28) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // Aggregate speckling — warm earth tones
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = 1 + Math.random() * 2.5
    const lum = 0.12 + Math.random() * 0.18
    ctx.fillStyle = `rgba(${Math.floor(lum * 210 + 40)},${Math.floor(lum * 120 + 20)},${Math.floor(lum * 60)},0.6)`
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  // Hairline cracks
  ctx.strokeStyle = "rgba(0,0,0,0.5)"
  ctx.lineWidth = 0.8
  for (let i = 0; i < 12; i++) {
    const x0 = Math.random() * W
    const y0 = Math.random() * H
    ctx.beginPath(); ctx.moveTo(x0, y0)
    ctx.lineTo(x0 + (Math.random() - 0.5) * 80, y0 + (Math.random() - 0.5) * 80)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeBasaltTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#0f1013"
  ctx.fillRect(0, 0, W, H)
  // Dark basalt pattern — irregular polygons
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = 8 + Math.random() * 18
    const n = 5 + Math.floor(Math.random() * 3)
    ctx.fillStyle = `rgba(${18 + Math.floor(Math.random()*8)},${19 + Math.floor(Math.random()*8)},${22 + Math.floor(Math.random()*8)},0.9)`
    ctx.beginPath()
    for (let j = 0; j < n; j++) {
      const angle = (j / n) * Math.PI * 2
      const rx = x + Math.cos(angle) * r * (0.7 + Math.random() * 0.6)
      const ry = y + Math.sin(angle) * r * (0.7 + Math.random() * 0.6)
      j === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry)
    }
    ctx.closePath(); ctx.fill()
  }
  // Joint lines
  ctx.strokeStyle = "rgba(0,0,0,0.7)"
  ctx.lineWidth = 1.2
  for (let x = 0; x < W; x += 32) {
    for (let y = 0; y < H; y += 36) {
      ctx.beginPath()
      ctx.moveTo(x + Math.random() * 8, y)
      ctx.lineTo(x + 32 + Math.random() * 8, y + 36)
      ctx.stroke()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeSignTex(line1: string, line2?: string, color: string = COLORS.terracotta): THREE.CanvasTexture {
  const W = 512, H = line2 ? 120 : 80
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = color
  ctx.font = "bold 44px 'Courier New', monospace"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(line1.toUpperCase(), W / 2, line2 ? H * 0.38 : H / 2)
  if (line2) {
    ctx.fillStyle = "#a08070"
    ctx.font = "18px 'Courier New', monospace"
    ctx.fillText(line2.toUpperCase(), W / 2, H * 0.75)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ─── Fire feature ───────────────────────────────────────────────────────── */
function FireFeature({ x, z }: { x: number; z: number }) {
  const flameRef = useRef<THREE.Mesh>(null!)
  const lightRef = useRef<THREE.PointLight>(null!)
  const t = useRef(0)

  useFrame((_, dt) => {
    t.current += dt
    const flicker = 0.88 + Math.sin(t.current * 7.3) * 0.06 + Math.sin(t.current * 13.1) * 0.04
    if (lightRef.current) lightRef.current.intensity = 55 * flicker
    if (flameRef.current) {
      flameRef.current.scale.y = 0.9 + Math.sin(t.current * 8) * 0.12
      flameRef.current.scale.x = 0.9 + Math.sin(t.current * 6.5 + 1) * 0.08
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Stone basin */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.88, 0.6, 10]} />
        <meshStandardMaterial {...MAT.basalt} />
      </mesh>
      {/* Inner bowl */}
      <mesh position={[0, 0.64, 0]}>
        <cylinderGeometry args={[0.52, 0.66, 0.16, 10]} />
        <meshStandardMaterial color="#1a0e06" roughness={0.95} />
      </mesh>
      {/* Steel armature legs */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * 0.55, 0.5, Math.sin(angle) * 0.55]} castShadow>
          <cylinderGeometry args={[0.025, 0.04, 1.2, 6]} />
          <meshStandardMaterial {...MAT.darkMetal} />
        </mesh>
      ))}
      {/* Flame core */}
      <mesh ref={flameRef} position={[0, 1.0, 0]}>
        <coneGeometry args={[0.22, 0.7, 8]} />
        <meshStandardMaterial
          color="#ff6600"
          emissive="#ff4400"
          emissiveIntensity={6}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>
      {/* Outer flame */}
      <mesh position={[0, 0.88, 0]}>
        <coneGeometry args={[0.32, 0.45, 8]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff5500"
          emissiveIntensity={3}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
      {/* Point light */}
      <pointLight
        ref={lightRef}
        position={[0, 1.2, 0]}
        color="#ff6622"
        intensity={55}
        distance={18}
        decay={2}
      />
    </group>
  )
}

/* ─── Material archive kiosk ─────────────────────────────────────────────── */
function MaterialKiosk({ x, z }: { x: number; z: number }) {
  const signTex = useMemo(() => makeSignTex("MATERIAL", "ARCHIVE", COLORS.warmInterior), [])
  useEffect(() => () => { signTex.dispose() }, [signTex])
  return (
    <group position={[x, 0, z]}>
      {/* Base plinth */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.5, 1.4]} />
        <meshStandardMaterial {...MAT.basalt} />
      </mesh>
      {/* Column */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 2.5, 8]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.6} metalness={0.85} />
      </mesh>
      {/* Display head */}
      <mesh position={[0, 2.9, 0]} castShadow>
        <boxGeometry args={[0.9, 0.72, 0.9]} />
        <meshStandardMaterial color="#0d0e12" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Display face */}
      <mesh position={[0, 2.9, 0.46]}>
        <planeGeometry args={[0.82, 0.62]} />
        <meshStandardMaterial
          color="#000"
          emissive={COLORS.warmInterior}
          emissiveMap={signTex}
          emissiveIntensity={1.4}
          transparent
          opacity={1}
        />
      </mesh>
    </group>
  )
}

/* ─── Stone bench ────────────────────────────────────────────────────────── */
function StoneBench({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {/* Seat slab — heavy, monolithic */}
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.22, 0.72]} />
        <meshStandardMaterial {...MAT.basalt} roughness={0.94} />
      </mesh>
      {/* Two plinth supports */}
      {[-0.72, 0.72].map((lx, i) => (
        <mesh key={i} position={[lx, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.44, 0.44, 0.68]} />
          <meshStandardMaterial {...MAT.terracotta} roughness={0.92} />
        </mesh>
      ))}
      {/* Terracotta inlay strip */}
      <mesh position={[0, 0.49, 0.36]}>
        <boxGeometry args={[2.2, 0.06, 0.04]} />
        <meshStandardMaterial color={COLORS.terracotta} roughness={0.85} />
      </mesh>
    </group>
  )
}

/* ─── Bedrock district building ──────────────────────────────────────────── */
interface BedrockBuildingDef {
  x: number; z: number
  w: number; d: number; h: number
  terraces?: number   // stacked setbacks
  circularWindows?: boolean
}

function BedrockBuilding({ x, z, w, d, h, terraces = 0, circularWindows = false }: BedrockBuildingDef) {
  const facadeTex = useMemo(() => {
    const t = makeCarvedConcreteTex()
    t.repeat.set(w / 6, h / 6)
    return t
  }, [w, h])

  const winTex = useMemo<THREE.CanvasTexture>(() => {
    const W = 256, H = 256
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, W, H)
    const rows = Math.max(2, Math.round(h / 3.5))
    const cols = Math.max(1, Math.round(d / 4))
    for (let r = 0; r < rows; r++) {
      for (let cl = 0; cl < cols; cl++) {
        if (Math.random() > 0.42) {
          const lum = 0.5 + Math.random() * 0.5
          ctx.fillStyle = `rgba(${Math.floor(lum*230)},${Math.floor(lum*160)},${Math.floor(lum*80)},0.9)`
          const wx = (cl / cols) * W + 8
          const wy = (r / rows) * H + 8
          const ww = (W / cols) - 18
          const wh = (H / rows) - 18
          if (circularWindows) {
            ctx.beginPath()
            ctx.arc(wx + ww/2, wy + wh/2, Math.min(ww, wh)/2, 0, Math.PI*2)
            ctx.fill()
          } else {
            ctx.fillRect(wx, wy, ww, wh)
          }
        }
      }
    }
    ctx.globalAlpha = 1
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [h, d, circularWindows])
  useEffect(() => () => { facadeTex.dispose(); winTex.dispose() }, [facadeTex, winTex])

  const baseH = 2.2
  const towerH = h - baseH

  return (
    <group position={[x, 0, z]}>
      {/* ── Deep base / plinth ── */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 2.8, baseH, d + 2.8]} />
        <meshStandardMaterial {...MAT.terracotta} map={facadeTex} />
      </mesh>

      {/* ── Main tower ── */}
      <mesh position={[0, baseH + towerH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, towerH, d]} />
        <meshStandardMaterial {...MAT.terracotta} map={facadeTex} />
      </mesh>

      {/* ── Stacked setback terraces ── */}
      {Array.from({ length: terraces }, (_, i) => {
        const tW = w * (0.78 - i * 0.12)
        const tH = towerH * 0.2
        const tY = baseH + towerH * 0.5 + i * tH * 1.05
        return (
          <mesh key={i} position={[0, tY, 0]} castShadow>
            <boxGeometry args={[tW + 1.2, 0.42, d + 1.2]} />
            <meshStandardMaterial color="#1a0e06" roughness={0.9} />
          </mesh>
        )
      })}

      {/* ── Warm window emissive (street-facing side) ── */}
      <mesh position={[-w / 2 - 0.02, baseH + towerH / 2, 0]}>
        <planeGeometry args={[d * 0.82, towerH * 0.78]} />
        <meshStandardMaterial
          color="#000"
          emissive={COLORS.warmInterior}
          emissiveMap={winTex}
          emissiveIntensity={0.9}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* ── Deep recessed entrance ── */}
      <mesh position={[-w / 2 - 0.08, baseH + 2.6, 0]} castShadow>
        <boxGeometry args={[0.9, 4.8, 3.6]} />
        <meshStandardMaterial color="#0a0602" roughness={0.97} />
      </mesh>
      <mesh position={[-w / 2 - 0.02, baseH + 2.6, 0]}>
        <planeGeometry args={[3.2, 4.4]} />
        <meshStandardMaterial
          color={COLORS.warmInterior}
          emissive={COLORS.warmInterior}
          emissiveIntensity={0.3}
          transparent
          opacity={0.55}
        />
      </mesh>

      {/* ── Cantilevered balcony slab (upper) ── */}
      <mesh position={[-w / 2 - 1.8, baseH + towerH * 0.62, 0]} castShadow>
        <boxGeometry args={[2.8, 0.28, d * 0.7]} />
        <meshStandardMaterial color="#1c0e08" roughness={0.9} />
      </mesh>
      {/* Balcony railing */}
      <mesh position={[-w / 2 - 3.08, baseH + towerH * 0.62 + 0.5, 0]}>
        <boxGeometry args={[0.06, 0.9, d * 0.7]} />
        <meshStandardMaterial {...MAT.darkMetal} />
      </mesh>

      {/* ── Terracotta accent band at base ── */}
      <mesh position={[0, baseH + 0.35, 0]}>
        <boxGeometry args={[w + 2.9, 0.28, d + 2.9]} />
        <meshStandardMaterial color={COLORS.terracotta} emissive={COLORS.terracotta} emissiveIntensity={0.12} roughness={0.85} />
      </mesh>

      {/* ── Rooftop ── */}
      <mesh position={[0, baseH + towerH + 0.25, 0]} castShadow>
        <boxGeometry args={[w + 0.6, 0.5, d + 0.6]} />
        <meshStandardMaterial color="#120a04" roughness={0.92} />
      </mesh>
      {/* Rooftop vegetation suggestion */}
      <mesh position={[0, baseH + towerH + 0.55, 0]}>
        <boxGeometry args={[w * 0.7, 0.08, d * 0.6]} />
        <meshStandardMaterial color="#1B3A2D" roughness={0.98} />
      </mesh>

      {/* Amber entrance light */}
      <pointLight position={[-w / 2 - 0.5, baseH + 2.6, 0]} color={COLORS.warmInterior} intensity={25} distance={10} decay={2} />
    </group>
  )
}

/* ─── Mist volume ────────────────────────────────────────────────────────── */
function DistrictMist({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt
    if (ref.current) (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.06 + Math.sin(t.current * 0.4) * 0.02
  })
  return (
    <mesh ref={ref} position={[x, 0.4, z]}>
      <boxGeometry args={[62, 0.8, 50]} />
      <meshStandardMaterial
        color="#c8b8a0"
        transparent
        opacity={0.06}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ─── Rainwater channel ──────────────────────────────────────────────────── */
function RainwaterChannel({ x, z, length }: { x: number; z: number; length: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Channel slot */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[length, 0.04, 0.18]} />
        <meshStandardMaterial color="#0a0c0f" roughness={0.08} metalness={0.55} />
      </mesh>
      {/* Chrome edge strips */}
      {[-0.1, 0.1].map((oz, i) => (
        <mesh key={i} position={[0, 0.02, oz]}>
          <boxGeometry args={[length, 0.03, 0.04]} />
          <meshStandardMaterial {...MAT.chromeMetal} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Bedrock district colliders (exported for Player) ───────────────────── */
export const BEDROCK_COLLIDERS = [
  // Side entrance road walls (west branch at z=-60)
  { x: -42, z: -53,  hw: 25, hd: 1.5 },  // north kerb
  { x: -42, z: -67,  hw: 25, hd: 1.5 },  // south kerb
  // Bedrock buildings — street-facing (east face)
  { x: -62, z: -40,  hw: 9, hd: 12 },
  { x: -60, z: -65,  hw: 8, hd: 14 },
  { x: -65, z: -90,  hw: 10, hd: 12 },
  // Opposite side (north buildings)
  { x: -30, z: -42,  hw: 7,  hd: 10 },
  { x: -28, z: -70,  hw: 6,  hd: 11 },
  { x: -32, z: -95,  hw: 8,  hd: 11 },
  // District end wall
  { x: -42, z: -110, hw: 35, hd: 2 },
  // BedrockResidence — gate building (x=-22, z=-20)
  { ...BEDROCK_RESIDENCE_COLLIDER, x: -22, z: -20 },
  // BedrockAlley — east/west walls + end cap (offset to x=-46, z=-30)
  ...BEDROCK_ALLEY_COLLIDERS.map(c => ({ ...c, x: c.x - 46, z: c.z - 30 })),
]

/* ─── BedrockDistrict — main export ─────────────────────────────────────── */
export function BedrockDistrict() {
  const basaltTex  = useMemo(() => makeBasaltTex(), [])
  const bedrockSign = useMemo(() => makeSignTex("BEDROCK", "DISTRICT · COMPOUND", COLORS.terracotta), [])
  const houseMat   = useMemo(() => makeSignTex("HOUSE OF MATERIAL", undefined, "#a08070"), [])
  useEffect(() => () => { basaltTex.dispose(); bedrockSign.dispose(); houseMat.dispose() }, [basaltTex, bedrockSign, houseMat])

  return (
    <group>
      {/* ── West branch road (z=-60 corridor) ── */}
      <mesh position={[-42, -0.01, -60]} receiveShadow>
        <boxGeometry args={[50, 0.06, 10]} />
        <meshStandardMaterial {...MAT.asphalt} />
      </mesh>
      {/* Wet shimmer */}
      <mesh position={[-42, 0.003, -60]}>
        <boxGeometry args={[50, 0.001, 10]} />
        <meshStandardMaterial color="#1a1620" roughness={0.04} metalness={0.55} transparent opacity={0.4} depthWrite={false} />
      </mesh>

      {/* ── Basalt paving (district ground) ── */}
      <mesh position={[-55, -0.005, -68]} receiveShadow>
        <boxGeometry args={[48, 0.05, 62]} />
        <meshStandardMaterial color="#111215" roughness={0.92} metalness={0.04} map={basaltTex} />
      </mesh>

      {/* ── North sidewalk of branch road ── */}
      <mesh position={[-42, 0.08, -53.5]} receiveShadow castShadow>
        <boxGeometry args={[50, 0.16, 3]} />
        <meshStandardMaterial color="#1a1612" roughness={0.94} />
      </mesh>
      {/* ── South sidewalk ── */}
      <mesh position={[-42, 0.08, -66.5]} receiveShadow castShadow>
        <boxGeometry args={[50, 0.16, 3]} />
        <meshStandardMaterial color="#1a1612" roughness={0.94} />
      </mesh>

      {/* ── Rainwater channels ── */}
      <RainwaterChannel x={-42} z={-54.6} length={50} />
      <RainwaterChannel x={-42} z={-65.4} length={50} />
      <RainwaterChannel x={-55} z={-90} length={0.18} />

      {/* ── District mist ── */}
      <DistrictMist x={-55} z={-75} />

      {/* ── BedrockResidence — gate building at district entrance (ref: CW_BEDROCK_RESIDENCE_FRONT_DAY_V01) ── */}
      <BedrockResidence position={[-22, 0, -20]} />

      {/* ── BedrockAlley — industrial street passage (ref: CW_BEDROCK_STREET_GAMEPLAY_NIGHT_V03) ── */}
      <BedrockAlley position={[-46, 0, -30]} />

      {/* ── Main Bedrock buildings (south side of district, facing north street) ── */}
      <BedrockBuilding x={-62} z={-40}  w={18} d={24} h={22} terraces={1} circularWindows />
      <BedrockBuilding x={-60} z={-65}  w={16} d={28} h={34} terraces={2} />
      <BedrockBuilding x={-65} z={-90}  w={20} d={26} h={28} terraces={1} circularWindows />

      {/* ── North side buildings (smaller, residential scale) ── */}
      <BedrockBuilding x={-28} z={-42}  w={14} d={20} h={16} />
      <BedrockBuilding x={-26} z={-68}  w={12} d={22} h={24} circularWindows />
      <BedrockBuilding x={-30} z={-95}  w={16} d={24} h={18} terraces={1} />

      {/* ── District lights (terracotta warmth) ── */}
      {[-40, -60, -80, -100].map(z => (
        <group key={z}>
          {/* North lamp */}
          <group position={[-20, 0, z]}>
            <mesh position={[0, 3.8, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.07, 7.6, 7]} />
              <meshStandardMaterial {...MAT.darkMetal} />
            </mesh>
            <mesh position={[0, 7.4, 0]}>
              <boxGeometry args={[0.42, 0.16, 0.28]} />
              <meshStandardMaterial color={COLORS.warmInterior} emissive={COLORS.warmInterior} emissiveIntensity={3} roughness={0.35} />
            </mesh>
            <pointLight position={[0, 7.0, 0]} color={COLORS.amber} intensity={26} distance={20} decay={2} />
          </group>
          {/* South lamp */}
          <group position={[-72, 0, z]}>
            <mesh position={[0, 3.8, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.07, 7.6, 7]} />
              <meshStandardMaterial {...MAT.darkMetal} />
            </mesh>
            <mesh position={[0, 7.4, 0]}>
              <boxGeometry args={[0.42, 0.16, 0.28]} />
              <meshStandardMaterial color={COLORS.warmInterior} emissive={COLORS.warmInterior} emissiveIntensity={3} roughness={0.35} />
            </mesh>
            <pointLight position={[0, 7.0, 0]} color={COLORS.amber} intensity={26} distance={20} decay={2} />
          </group>
        </group>
      ))}

      {/* ── Fire feature (district focal point) ── */}
      <FireFeature x={-42} z={-78} />

      {/* ── Stone benches ── */}
      <StoneBench x={-35} z={-58} ry={0} />
      <StoneBench x={-50} z={-58} ry={0} />
      <StoneBench x={-35} z={-78} ry={Math.PI / 2} />
      <StoneBench x={-70} z={-76} ry={Math.PI / 2} />

      {/* ── Material archive kiosk ── */}
      <MaterialKiosk x={-30} z={-74} />
      <MaterialKiosk x={-56} z={-55} />

      {/* ── BEDROCK monolith sign slab ── */}
      <group position={[-44, 0, -108]}>
        {/* Stone slab */}
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[9, 6.4, 0.9]} />
          <meshStandardMaterial color="#180e08" roughness={0.94} />
        </mesh>
        {/* Carved face */}
        <mesh position={[0, 3.2, 0.46]}>
          <planeGeometry args={[8.2, 5.8]} />
          <meshStandardMaterial
            color="#000"
            emissive={COLORS.terracotta}
            emissiveMap={bedrockSign}
            emissiveIntensity={1.8}
            transparent
            opacity={1}
          />
        </mesh>
        {/* Terracotta base strip */}
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[9.4, 0.56, 1.1]} />
          <meshStandardMaterial color={COLORS.terracotta} roughness={0.85} />
        </mesh>
        {/* Uplights */}
        <pointLight position={[-3, 0.4, 0.8]} color={COLORS.amber} intensity={30} distance={8} decay={2} />
        <pointLight position={[ 3, 0.4, 0.8]} color={COLORS.amber} intensity={30} distance={8} decay={2} />
      </group>

      {/* ── HOUSE OF MATERIAL wayfinding sign ── */}
      <group position={[-22, 0, -60]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.055, 3.2, 7]} />
          <meshStandardMaterial {...MAT.darkMetal} />
        </mesh>
        <mesh position={[0.9, 3.1, 0]}>
          <boxGeometry args={[2.4, 0.48, 0.06]} />
          <meshStandardMaterial color="#0e0a06" roughness={0.9} />
        </mesh>
        <mesh position={[0.9, 3.1, 0.04]}>
          <planeGeometry args={[2.3, 0.42]} />
          <meshStandardMaterial
            color="#000"
            emissive="#a08070"
            emissiveMap={houseMat}
            emissiveIntensity={1.4}
            transparent opacity={1}
          />
        </mesh>
      </group>

      {/* ── Terracotta planter blocks (moss/vegetation) ── */}
      {[[-38, -50], [-55, -72], [-48, -96], [-30, -88]].map(([px, pz], i) => (
        <group key={i} position={[px, 0, pz]}>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 1.0, 2.2]} />
            <meshStandardMaterial color="#2a1a0e" roughness={0.92} />
          </mesh>
          {/* Moss top */}
          <mesh position={[0, 1.06, 0]}>
            <boxGeometry args={[2.1, 0.12, 2.1]} />
            <meshStandardMaterial color="#1B3A2D" roughness={0.98} />
          </mesh>
          {/* Low plant form */}
          <mesh position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.62, 7, 5]} />
            <meshStandardMaterial color="#1B3A2D" roughness={0.97} />
          </mesh>
          {/* Terracotta rim */}
          <mesh position={[0, 1.08, 0]}>
            <boxGeometry args={[2.3, 0.1, 2.3]} />
            <meshStandardMaterial color={COLORS.terracotta} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ── District ambient fill light ── */}
      <ambientLight intensity={0.22} color="#3a1a08" />
      <pointLight position={[-45, 15, -75]} color={COLORS.amber} intensity={60} distance={65} decay={1.4} />
    </group>
  )
}
