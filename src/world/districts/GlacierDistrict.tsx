"use client"
import { useRef, useEffect, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { COLORS } from "../WorldConfig"

/* ── Colliders (exported for City.tsx COLLIDERS array) ── */
export const GLACIER_COLLIDERS = [
  // Boundary
  { x: -55, z: -143, hw: 35, hd: 2 },    // North wall
  { x: -55, z: -238, hw: 37, hd: 2 },    // South wall
  { x: -90, z: -190, hw: 2,  hd: 48 },   // West wall
  // Buildings / basins
  { x: -32, z: -168, hw: 10, hd: 12 },   // Water processing tower
  { x: -62, z: -172, hw: 13, hd: 14 },   // Main treatment facility
  { x: -48, z: -200, hw: 8,  hd: 10 },   // Holding basin complex
  { x: -28, z: -212, hw: 7,  hd: 8  },   // Secondary processing
  { x: -68, z: -215, hw: 11, hd: 9  },   // Filtration chambers
]

/* ── Canvas textures ── */
function makeWetConcreteTex(): THREE.CanvasTexture {
  const W = 512, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#080b10"
  ctx.fillRect(0, 0, W, H)
  // Horizontal form-board lines
  ctx.strokeStyle = "rgba(0,0,0,0.7)"
  ctx.lineWidth = 1.5
  for (let y = 0; y < H; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // Moisture staining — cold blue-grey
  for (let i = 0; i < 6; i++) {
    const grd = ctx.createLinearGradient(0, Math.random() * H, 0, Math.random() * H)
    grd.addColorStop(0, "rgba(10,30,50,0.12)")
    grd.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  // Tie-rod holes
  ctx.fillStyle = "rgba(2,5,10,0.9)"
  for (let x = 64; x < W; x += 128) {
    for (let y = 32; y < H; y += 64) {
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeWaterTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#020a14"
  ctx.fillRect(0, 0, W, H)
  // Concentric ripples
  for (let i = 0; i < 8; i++) {
    const cx = Math.random() * W, cy = Math.random() * H
    const r = 10 + Math.random() * 60
    ctx.strokeStyle = `rgba(85,217,210,${0.06 + Math.random() * 0.1})`
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
  }
  // Depth gradient
  const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2)
  grd.addColorStop(0, "rgba(20,60,90,0.4)")
  grd.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ── Animated water basin ── */
function WaterBasin({ x, z, r, depth = 1.2 }: { x: number; z: number; r: number; depth?: number }) {
  const waterRef = useRef<THREE.Mesh>(null!)
  const waterTex = useMemo(() => makeWaterTex(), [])
  useEffect(() => () => { waterTex.dispose() }, [waterTex])

  useFrame(({ clock }) => {
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.28 + Math.sin(clock.elapsedTime * 0.7 + x * 0.03) * 0.12
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Basin rim */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[r + 0.6, r + 0.8, 0.7, 14]} />
        <meshStandardMaterial color="#08090e" roughness={0.90} metalness={0.12} />
      </mesh>
      {/* Basin walls */}
      <mesh position={[0, -depth / 2, 0]} receiveShadow>
        <cylinderGeometry args={[r, r + 0.4, depth, 14, 1, true]} />
        <meshStandardMaterial color="#06080d" roughness={0.92} side={THREE.BackSide} />
      </mesh>
      {/* Water surface (animated) */}
      <mesh ref={waterRef} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[r - 0.05, r - 0.05, 0.04, 14]} />
        <meshStandardMaterial
          color="#020d1a"
          emissive={COLORS.glacier}
          emissiveMap={waterTex}
          emissiveIntensity={0.28}
          roughness={0.08}
          metalness={0.65}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* Glacial-blue ripple ring */}
      <mesh position={[0, 0.03, 0]}>
        <torusGeometry args={[r * 0.7, 0.03, 6, 24]} />
        <meshStandardMaterial
          color={COLORS.glacier}
          emissive={COLORS.glacier}
          emissiveIntensity={2.2}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

/* ── Concrete building with glacier accent ── */
interface GlacierBuildingProps {
  x: number; z: number
  w: number; d: number; h: number
  label?: string
}

function GlacierBuilding({ x, z, w, d, h, label }: GlacierBuildingProps) {
  const concTex = useMemo(() => makeWetConcreteTex(), [])
  useEffect(() => () => { concTex.dispose() }, [concTex])

  const signTex = useMemo<THREE.CanvasTexture | null>(() => {
    if (!label) return null
    const W = 512, H = 72
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = COLORS.glacier
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, W - 4, H - 4)
    ctx.fillStyle = COLORS.glacier
    ctx.font = "bold 22px 'Courier New', monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(label.toUpperCase(), W / 2, H / 2)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [label])
  useEffect(() => () => { signTex?.dispose() }, [signTex])

  return (
    <group position={[x, 0, z]}>
      {/* Foundation */}
      <mesh position={[0, 0.6, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 1.5, 1.2, d + 1.5]} />
        <meshStandardMaterial color="#060709" roughness={0.96} metalness={0.04} />
      </mesh>
      {/* Main body */}
      <mesh position={[0, h / 2 + 1.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#0a0c12" roughness={0.88} metalness={0.06} map={concTex} />
      </mesh>
      {/* Glacier blue accent band at cornice */}
      <mesh position={[0, h + 1.16, 0]}>
        <boxGeometry args={[w + 0.08, 0.12, d + 0.08]} />
        <meshStandardMaterial
          color={COLORS.glacier}
          emissive={COLORS.glacier}
          emissiveIntensity={3.5}
          roughness={0.2}
        />
      </mesh>
      {/* Glazed horizontal strip windows */}
      {Array.from({ length: Math.max(1, Math.floor(h / 8)) }).map((_, i) => (
        <mesh key={i} position={[0, 4 + i * 8, w / 2 + 0.01]}>
          <boxGeometry args={[w * 0.72, 1.4, 0.06]} />
          <meshStandardMaterial
            color={COLORS.glacier}
            emissive={COLORS.glacier}
            emissiveIntensity={0.35}
            roughness={0.04}
            metalness={0.8}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      {/* Building name sign */}
      {signTex && (
        <mesh position={[0, 3.2, w / 2 + 0.05]}>
          <planeGeometry args={[Math.min(w * 0.85, 7), 0.8]} />
          <meshStandardMaterial
            color="#000"
            emissive="#ffffff"
            emissiveMap={signTex}
            emissiveIntensity={0.8}
            transparent
            opacity={1}
          />
        </mesh>
      )}
    </group>
  )
}

/* ── Elevated walkway ── */
function ElevatedWalkway({ x1, x2, z, y = 4.0 }: { x1: number; x2: number; z: number; y?: number }) {
  const cx = (x1 + x2) / 2
  const len = Math.abs(x2 - x1)
  return (
    <group position={[cx, y, z]}>
      {/* Deck */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[len, 0.22, 2.2]} />
        <meshStandardMaterial color="#090b10" roughness={0.88} metalness={0.18} />
      </mesh>
      {/* Guardrail top bar */}
      <mesh position={[0, 0.9, 0.9]}>
        <boxGeometry args={[len, 0.06, 0.06]} />
        <meshStandardMaterial
          color={COLORS.glacier}
          emissive={COLORS.glacier}
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.9, -0.9]}>
        <boxGeometry args={[len, 0.06, 0.06]} />
        <meshStandardMaterial
          color={COLORS.glacier}
          emissive={COLORS.glacier}
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>
      {/* Support columns at each end */}
      {[-len / 2 + 0.5, len / 2 - 0.5].map((ox, i) => (
        <mesh key={i} position={[ox, -y / 2, 0]}>
          <boxGeometry args={[0.22, y, 0.22]} />
          <meshStandardMaterial color="#07080c" roughness={0.85} metalness={0.28} />
        </mesh>
      ))}
    </group>
  )
}

/* ── Water treatment column stack ── */
function TreatmentColumn({ x, z, h }: { x: number; z: number; h: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Stack of cylinders — narrowing upward */}
      {[
        { y: h * 0.15, r: 2.2, ch: h * 0.30 },
        { y: h * 0.52, r: 1.8, ch: h * 0.44 },
        { y: h * 0.82, r: 1.2, ch: h * 0.24 },
      ].map((seg, i) => (
        <mesh key={i} position={[0, seg.y, 0]} castShadow>
          <cylinderGeometry args={[seg.r * 0.92, seg.r, seg.ch, 10]} />
          <meshStandardMaterial color="#08090e" roughness={0.86} metalness={0.18} />
        </mesh>
      ))}
      {/* Accent rings */}
      {[h * 0.3, h * 0.6].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[1.95, 0.08, 6, 16]} />
          <meshStandardMaterial
            color={COLORS.glacier}
            emissive={COLORS.glacier}
            emissiveIntensity={2.8}
            roughness={0.2}
          />
        </mesh>
      ))}
      {/* Top vent/cap */}
      <mesh position={[0, h, 0]}>
        <cylinderGeometry args={[1.6, 1.0, 0.6, 10]} />
        <meshStandardMaterial color="#0a0c12" roughness={0.7} metalness={0.4} />
      </mesh>
    </group>
  )
}

/* ── District entry sign ── */
function GlacierSign() {
  const tex = useMemo<THREE.CanvasTexture>(() => {
    const W = 640, H = 96
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = COLORS.glacier
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, W - 4, H - 4)
    ctx.fillStyle = COLORS.glacier
    ctx.font = "bold 28px 'Courier New', monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("GLACIER  ·  AQUATIC DISTRICT", W / 2, H / 2 - 10)
    ctx.font = "14px 'Courier New', monospace"
    ctx.fillStyle = `rgba(85,217,210,0.55)`
    ctx.fillText("WATER SYSTEMS   ·   ZONE GL-06", W / 2, H / 2 + 20)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => { tex.dispose() }, [tex])

  return (
    <group position={[-20, 0, -148]}>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 3.6, 6]} />
        <meshStandardMaterial color="#0a0b0e" roughness={0.82} metalness={0.5} />
      </mesh>
      <mesh position={[-3.2, 3.5, 0]}>
        <boxGeometry args={[6.4, 0.96, 0.08]} />
        <meshStandardMaterial color="#030406" roughness={0.9} />
      </mesh>
      <mesh position={[-3.2, 3.5, 0.05]}>
        <planeGeometry args={[6.2, 0.88]} />
        <meshStandardMaterial
          color="#000"
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={0.9}
          transparent
          opacity={1}
        />
      </mesh>
    </group>
  )
}

/* ── Ground plane for district ── */
function GlacierGround() {
  return (
    <>
      {/* Wet basalt paving */}
      <mesh position={[-55, -0.01, -190]} receiveShadow>
        <boxGeometry args={[72, 0.18, 96]} />
        <meshStandardMaterial color="#050608" roughness={0.15} metalness={0.35} />
      </mesh>
      {/* Channel grooves (recessed) — running along the ground */}
      {([-40, -50, -60, -70] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.02, -190]}>
          <boxGeometry args={[0.22, 0.06, 90]} />
          <meshStandardMaterial
            color={COLORS.glacier}
            emissive={COLORS.glacier}
            emissiveIntensity={0.7}
            roughness={0.4}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </>
  )
}

/* ── Export ── */
export function GlacierDistrict() {
  return (
    <group>
      <GlacierSign />
      <GlacierGround />

      {/* Water basins */}
      <WaterBasin x={-30} z={-162} r={5.5} />
      <WaterBasin x={-58} z={-170} r={7.0} depth={1.6} />
      <WaterBasin x={-42} z={-195} r={4.5} />
      <WaterBasin x={-68} z={-210} r={5.0} />

      {/* Treatment columns */}
      <TreatmentColumn x={-25} z={-175} h={18} />
      <TreatmentColumn x={-75} z={-180} h={22} />
      <TreatmentColumn x={-55} z={-225} h={15} />

      {/* Main buildings */}
      <GlacierBuilding x={-32} z={-168} w={16} d={20} h={18} label="Water Processing" />
      <GlacierBuilding x={-62} z={-172} w={20} d={22} h={24} label="Treatment Facility" />
      <GlacierBuilding x={-48} z={-205} w={14} d={16} h={14} label="Holding Basin" />
      <GlacierBuilding x={-28} z={-215} w={12} d={14} h={12} />
      <GlacierBuilding x={-68} z={-218} w={18} d={16} h={16} label="Filtration" />

      {/* Elevated walkways between buildings */}
      <ElevatedWalkway x1={-23} x2={-40} z={-170} y={4.5} />
      <ElevatedWalkway x1={-45} x2={-52} z={-188} y={3.8} />
      <ElevatedWalkway x1={-55} x2={-75} z={-195} y={5.0} />
    </group>
  )
}
