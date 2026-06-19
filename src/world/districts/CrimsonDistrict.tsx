"use client"
import { useMemo, useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { COLORS } from "../WorldConfig"

/* ─── Canvas texture helpers ─────────────────────────────────────────────── */

function makeBlackConcreteTex(): THREE.CanvasTexture {
  const W = 512, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#070508"
  ctx.fillRect(0, 0, W, H)
  // Horizontal form-board lines
  ctx.strokeStyle = "rgba(0,0,0,0.62)"
  ctx.lineWidth = 1.2
  for (let y = 0; y < H; y += 28) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // Tie-rod holes
  ctx.fillStyle = "rgba(3,1,3,0.9)"
  for (let x = 48; x < W; x += 96) {
    for (let y = 28; y < H; y += 56) {
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
    }
  }
  // Deep crimson mineral shadow — barely there
  for (let i = 0; i < 5; i++) {
    const grd = ctx.createRadialGradient(
      Math.random() * W, Math.random() * H, 0,
      Math.random() * W, Math.random() * H, 140
    )
    grd.addColorStop(0, "rgba(80,4,16,0.07)")
    grd.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeWetAsphaltTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#060406"
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * W, y = Math.random() * H
    const lum = Math.random() * 0.05
    ctx.fillStyle = `rgba(${Math.floor(lum * 40 + 6)},${Math.floor(lum * 18 + 4)},${Math.floor(lum * 18 + 6)},0.5)`
    ctx.beginPath(); ctx.arc(x, y, 0.5 + Math.random() * 0.5, 0, Math.PI * 2); ctx.fill()
  }
  // Crimson rain-light reflection pools
  for (let i = 0; i < 6; i++) {
    const grd = ctx.createRadialGradient(
      Math.random() * W, Math.random() * H, 0,
      Math.random() * W, Math.random() * H, 42
    )
    grd.addColorStop(0, "rgba(120,8,22,0.18)")
    grd.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeCrimsonSignTex(line1: string, line2?: string): THREE.CanvasTexture {
  const W = 512, H = line2 ? 110 : 72
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#030104"
  ctx.fillRect(0, 0, W, H)
  // Minimal edge rules
  ctx.strokeStyle = COLORS.crimson
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(16, 7); ctx.lineTo(W - 16, 7); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(16, H - 7); ctx.lineTo(W - 16, H - 7); ctx.stroke()
  ctx.font = `bold ${line2 ? 30 : 36}px 'Courier New', monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillStyle = COLORS.crimson
  ctx.shadowColor = COLORS.crimson
  ctx.shadowBlur = 10
  ctx.fillText(line1.toUpperCase(), W / 2, line2 ? H * 0.36 : H / 2)
  if (line2) {
    ctx.shadowBlur = 0
    ctx.font = "14px 'Courier New', monospace"
    ctx.fillStyle = "#5a1a24"
    ctx.fillText(line2.toUpperCase(), W / 2, H * 0.76)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ─── Sparse crimson atmosphere particles ───────────────────────────────── */
function CrimsonParticles({ x, z }: { x: number; z: number }) {
  const count = 70
  const t = useRef(0)
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const offsets = useMemo(() =>
    Array.from({ length: count }, () => ({
      ox: (Math.random() - 0.5) * 68,
      y:  0.8 + Math.random() * 14,
      oz: (Math.random() - 0.5) * 58,
      speed: 0.03 + Math.random() * 0.055,
      phase: Math.random() * Math.PI * 2,
      amp:   0.3 + Math.random() * 0.55,
    })), [])

  useFrame((_, dt) => {
    t.current += dt
    offsets.forEach((o, i) => {
      dummy.position.set(
        x + o.ox + Math.sin(t.current * o.speed + o.phase) * o.amp,
        o.y + Math.sin(t.current * o.speed * 1.3 + o.phase) * 0.35,
        z + o.oz + Math.cos(t.current * o.speed * 0.85 + o.phase) * o.amp
      )
      dummy.scale.setScalar(0.025 + Math.sin(t.current * o.speed * 2 + o.phase) * 0.008)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshStandardMaterial
        color={COLORS.crimson}
        emissive={COLORS.crimson}
        emissiveIntensity={3.5}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

/* ─── Central sound sculpture — reactive black stone monolith ────────────── */
function CrimsonSoundSculpture({ x, z }: { x: number; z: number }) {
  const t = useRef(0)
  const glowRef   = useRef<THREE.PointLight>(null!)
  const vein1Ref  = useRef<THREE.MeshStandardMaterial>(null!)
  const vein2Ref  = useRef<THREE.MeshStandardMaterial>(null!)
  const vein3Ref  = useRef<THREE.MeshStandardMaterial>(null!)
  const rippleRef = useRef<THREE.Mesh>(null!)

  useFrame((_, dt) => {
    t.current += dt
    const pulse   = 0.72 + Math.sin(t.current * 0.42) * 0.16 + Math.sin(t.current * 1.28) * 0.06
    const pulse2  = 0.60 + Math.sin(t.current * 0.68 + 0.9) * 0.40
    const pulse3  = 0.55 + Math.sin(t.current * 0.90 + 1.8) * 0.45
    if (glowRef.current)  glowRef.current.intensity = 24 * pulse
    if (vein1Ref.current) vein1Ref.current.emissiveIntensity = 2.8 * pulse
    if (vein2Ref.current) vein2Ref.current.emissiveIntensity = 1.9 * pulse2
    if (vein3Ref.current) vein3Ref.current.emissiveIntensity = 2.2 * pulse3
    if (rippleRef.current) {
      rippleRef.current.scale.setScalar(1 + Math.sin(t.current * 0.38) * 0.055)
      ;(rippleRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.07 + Math.sin(t.current * 0.38) * 0.04
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Stone plinth */}
      <mesh position={[0, 0.28, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.4, 0.56, 4.4]} />
        <meshStandardMaterial color="#070507" roughness={0.92} metalness={0.08} />
      </mesh>
      {/* Lower block */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <boxGeometry args={[2.9, 3.3, 2.1]} />
        <meshStandardMaterial color="#0a0708" roughness={0.78} metalness={0.12} />
      </mesh>
      {/* Mid block — rotated, slightly offset */}
      <mesh position={[0.14, 5.0, -0.08]} rotation={[0, 0.20, 0]} castShadow>
        <boxGeometry args={[2.3, 3.0, 1.75]} />
        <meshStandardMaterial color="#090608" roughness={0.74} metalness={0.14} />
      </mesh>
      {/* Upper block */}
      <mesh position={[-0.08, 7.5, 0.12]} rotation={[0, -0.14, 0]} castShadow>
        <boxGeometry args={[1.9, 2.8, 1.55]} />
        <meshStandardMaterial color="#080608" roughness={0.72} metalness={0.15} />
      </mesh>
      {/* Spire */}
      <mesh position={[0.04, 9.6, 0]} rotation={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.95, 1.9, 0.85]} />
        <meshStandardMaterial color="#070508" roughness={0.68} metalness={0.20} />
      </mesh>

      {/* Crimson vein 1 — primary vertical groove, east face */}
      <mesh position={[1.46, 3.5, 0]}>
        <boxGeometry args={[0.05, 6.2, 0.38]} />
        <meshStandardMaterial ref={vein1Ref} color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={2.8} />
      </mesh>
      {/* Crimson vein 2 — diagonal slash, north face */}
      <mesh position={[-0.55, 6.8, 0.88]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.04, 3.4, 0.3]} />
        <meshStandardMaterial ref={vein2Ref} color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={1.9} />
      </mesh>
      {/* Crimson vein 3 — plinth edge */}
      <mesh position={[-1.46, 1.9, 0]} rotation={[0, 0, 0.06]}>
        <boxGeometry args={[0.05, 3.2, 0.22]} />
        <meshStandardMaterial ref={vein3Ref} color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={2.2} />
      </mesh>

      {/* Ground reaction ring */}
      <mesh ref={rippleRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 6.2, 48]} />
        <meshStandardMaterial
          color={COLORS.crimson}
          emissive={COLORS.crimson}
          emissiveIntensity={1.4}
          transparent opacity={0.07}
          depthWrite={false}
        />
      </mesh>

      {/* Reactive crimson fill */}
      <pointLight ref={glowRef} position={[0, 3.5, 0]} color={COLORS.crimson} intensity={24} distance={20} decay={2} />
    </group>
  )
}

/* ─── Compound Performance Hall — curved concrete drum ───────────────────── */
function PerformanceHall({ x, z }: { x: number; z: number }) {
  const concTex = useMemo(() => { const t = makeBlackConcreteTex(); t.repeat.set(6, 3); return t }, [])
  const signTex = useMemo(() => makeCrimsonSignTex("COMPOUND PERFORMANCE HALL", "COMPOUND · CULTURAL PROGRAMME"), [])
  useEffect(() => () => { concTex.dispose(); signTex.dispose() }, [concTex, signTex])

  return (
    <group position={[x, 0, z]}>
      {/* Curved drum */}
      <mesh position={[0, 10, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[11, 11.6, 20, 22, 1, false]} />
        <meshStandardMaterial color="#070508" roughness={0.93} metalness={0.04} map={concTex} />
      </mesh>
      {/* Heavy top parapet */}
      <mesh position={[0, 20.5, 0]} castShadow>
        <cylinderGeometry args={[11.4, 11, 0.9, 22]} />
        <meshStandardMaterial color="#060406" roughness={0.90} />
      </mesh>
      {/* Roofline crimson band */}
      <mesh position={[0, 21.05, 0]}>
        <cylinderGeometry args={[11.5, 11.5, 0.12, 22]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={1.8} roughness={0.4} />
      </mesh>

      {/* Vertical crimson slit windows around drum */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle  = (i / 16) * Math.PI * 2
        const isEntry = i === 8 // entrance — east side toward boulevard
        const px = Math.cos(angle) * 11.08
        const pz = Math.sin(angle) * 11.08
        return (
          <mesh key={i} position={[px, 10, pz]} rotation={[0, angle + Math.PI / 2, 0]}>
            <planeGeometry args={[isEntry ? 3.8 : 0.55, isEntry ? 11 : 15]} />
            <meshStandardMaterial
              color={COLORS.crimson}
              emissive={COLORS.crimson}
              emissiveIntensity={isEntry ? 0.35 : 2.4}
              transparent
              opacity={isEntry ? 0.45 : 0.82}
              depthWrite={false}
            />
          </mesh>
        )
      })}

      {/* Chrome entrance frame */}
      <mesh position={[11.15, 5.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[4.4, 11.2, 0.16]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.10} metalness={0.96} />
      </mesh>
      <mesh position={[11.15, 11.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[4.2, 0.2, 0.28]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.10} metalness={0.96} />
      </mesh>
      {/* Heavy fabric curtain — matte black */}
      <mesh position={[10.95, 4.9, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.8, 9.6]} />
        <meshStandardMaterial color="#0a0608" roughness={0.99} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* Crimson bleed under curtain */}
      <mesh position={[11.08, 0.22, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.6, 0.44]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={3.5} transparent opacity={0.75} depthWrite={false} />
      </mesh>

      {/* Facade sign */}
      <mesh position={[11.16, 16.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8.5, 1.1]} />
        <meshStandardMaterial color="#000" emissiveMap={signTex} emissive={COLORS.crimson} emissiveIntensity={1.3} />
      </mesh>

      {/* Interior glow — single warm crimson fill */}
      <pointLight position={[0, 8, 0]} color={COLORS.crimson} intensity={28} distance={14} decay={2} />
    </group>
  )
}

/* ─── Fashion Atelier — TEXTILE EXPERIMENT 07 ────────────────────────────── */
function FashionAtelier({ x, z }: { x: number; z: number }) {
  const concTex = useMemo(() => { const t = makeBlackConcreteTex(); t.repeat.set(3, 5); return t }, [])
  const signTex = useMemo(() => makeCrimsonSignTex("TEXTILE EXPERIMENT 07", "COMPOUND · MATERIAL STUDIES"), [])
  useEffect(() => () => { concTex.dispose(); signTex.dispose() }, [concTex, signTex])

  return (
    <group position={[x, 0, z]}>
      {/* Tower mass */}
      <mesh position={[0, 18, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 36, 12]} />
        <meshStandardMaterial color="#070508" roughness={0.95} metalness={0.03} map={concTex} />
      </mesh>
      {/* Setback top volume */}
      <mesh position={[0, 37.5, 0]} castShadow>
        <boxGeometry args={[13, 3, 10]} />
        <meshStandardMaterial color="#060407" roughness={0.92} />
      </mesh>
      {/* Roofline crimson edge */}
      <mesh position={[0, 39.1, 0]}>
        <boxGeometry args={[13.2, 0.2, 10.2]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={0.9} />
      </mesh>

      {/* Deep red glass — narrow vertical slits, 3 columns × 9 floors */}
      {Array.from({ length: 27 }, (_, idx) => {
        const col = idx % 3
        const row = Math.floor(idx / 3)
        return (
          <mesh key={idx} position={[-5 + col * 5, 3.5 + row * 3.8, -6.02]}>
            <planeGeometry args={[0.75, 3.0]} />
            <meshStandardMaterial
              color="#0c0103"
              emissive={COLORS.crimson}
              emissiveIntensity={row < 5 ? 1.4 : 0.55}
              transparent opacity={0.88}
              roughness={0.07}
            />
          </mesh>
        )
      })}

      {/* Chrome entrance frame */}
      <mesh position={[0, 3.8, -6.08]} castShadow>
        <boxGeometry args={[3.4, 7.6, 0.12]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.10} metalness={0.97} />
      </mesh>
      {/* Fabric curtain */}
      <mesh position={[0, 3.4, -6.02]}>
        <planeGeometry args={[2.8, 6.6]} />
        <meshStandardMaterial color="#090507" roughness={0.99} side={THREE.DoubleSide} />
      </mesh>
      {/* Crimson slit bleed at door base */}
      <mesh position={[0, 0.18, -6.04]}>
        <planeGeometry args={[2.6, 0.36]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={3} transparent opacity={0.7} depthWrite={false} />
      </mesh>

      {/* Poster wall — abstract exhibition */}
      <mesh position={[7.5, 9, -6.02]}>
        <planeGeometry args={[2.8, 11]} />
        <meshStandardMaterial color="#050405" roughness={0.97} />
      </mesh>
      <mesh position={[7.5, 10.5, -6.03]}>
        <planeGeometry args={[2.6, 0.06]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={2.2} />
      </mesh>
      <mesh position={[7.5, 8, -6.03]}>
        <planeGeometry args={[2.6, 0.04]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={1.5} />
      </mesh>

      {/* Facade sign */}
      <mesh position={[-1.5, 34, -6.08]}>
        <planeGeometry args={[13, 1.2]} />
        <meshStandardMaterial color="#000" emissiveMap={signTex} emissive={COLORS.crimson} emissiveIntensity={1.3} />
      </mesh>
    </group>
  )
}

/* ─── After Dark — underground club entrance ─────────────────────────────── */
function AfterDarkClub({ x, z }: { x: number; z: number }) {
  const concTex = useMemo(() => { const t = makeBlackConcreteTex(); t.repeat.set(5, 2); return t }, [])
  const signTex = useMemo(() => makeCrimsonSignTex("AFTER DARK"), [])
  const t = useRef(0)
  const glowRef = useRef<THREE.PointLight>(null!)
  useEffect(() => () => { concTex.dispose(); signTex.dispose() }, [concTex, signTex])

  useFrame((_, dt) => {
    t.current += dt
    // Subtle breath — not a strobe. Luxury, not cheap.
    if (glowRef.current) {
      glowRef.current.intensity = 18 + Math.sin(t.current * 0.55) * 5 + Math.sin(t.current * 1.8) * 2
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Low-slung building mass */}
      <mesh position={[0, 4.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[24, 9.6, 20]} />
        <meshStandardMaterial color="#070508" roughness={0.94} metalness={0.03} map={concTex} />
      </mesh>
      {/* Heavy flat roof slab */}
      <mesh position={[0, 9.65, 0]}>
        <boxGeometry args={[24.4, 0.5, 20.4]} />
        <meshStandardMaterial color="#050405" roughness={0.90} />
      </mesh>
      {/* Roof crimson edge — rear only */}
      <mesh position={[0, 9.95, -10]}>
        <boxGeometry args={[24.4, 0.12, 0.14]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={1.2} />
      </mesh>

      {/* Sunken forecourt — recessed entry */}
      <mesh position={[0, -0.55, -12]} receiveShadow>
        <boxGeometry args={[9, 1.1, 6]} />
        <meshStandardMaterial color="#050404" roughness={0.93} />
      </mesh>
      {/* Steps down */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0, -0.1 - i * 0.2, -9.8 - i * 0.5]} receiveShadow>
          <boxGeometry args={[6.8, 0.2, 0.95]} />
          <meshStandardMaterial color="#060406" roughness={0.91} />
        </mesh>
      ))}

      {/* Chrome entrance arch */}
      <mesh position={[0, 3.2, -10.08]} castShadow>
        <boxGeometry args={[5.2, 6.4, 0.14]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.10} metalness={0.97} />
      </mesh>
      {/* Dark void behind arch */}
      <mesh position={[0, 2.8, -10.0]}>
        <boxGeometry args={[3.8, 5.4, 0.05]} />
        <meshStandardMaterial color="#010101" roughness={1} />
      </mesh>
      {/* Heavy curtain — left panel */}
      <mesh position={[-1.0, 2.6, -9.94]}>
        <planeGeometry args={[1.8, 5.2]} />
        <meshStandardMaterial color="#0b0608" roughness={0.99} side={THREE.DoubleSide} />
      </mesh>
      {/* Heavy curtain — right panel */}
      <mesh position={[ 1.0, 2.6, -9.94]}>
        <planeGeometry args={[1.8, 5.2]} />
        <meshStandardMaterial color="#090508" roughness={0.99} side={THREE.DoubleSide} />
      </mesh>
      {/* Crimson bleed under curtain */}
      <mesh position={[0, 0.08, -9.9]}>
        <planeGeometry args={[3.6, 0.16]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={4.5} transparent opacity={0.88} depthWrite={false} />
      </mesh>

      {/* Vertical crimson slits — 4 on facade */}
      {[-8, -3, 3, 8].map((ox, i) => (
        <mesh key={i} position={[ox, 5.5, -10.08]}>
          <planeGeometry args={[0.18, 8.5]} />
          <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={2.6} transparent opacity={0.78} depthWrite={false} />
        </mesh>
      ))}

      {/* Sign */}
      <mesh position={[0, 8.4, -10.1]}>
        <planeGeometry args={[7.5, 0.9]} />
        <meshStandardMaterial color="#000" emissiveMap={signTex} emissive={COLORS.crimson} emissiveIntensity={1.5} />
      </mesh>

      {/* Animated entrance bleed */}
      <pointLight ref={glowRef} position={[0, 0.6, -9.5]} color={COLORS.crimson} intensity={18} distance={12} decay={2} />
    </group>
  )
}

/* ─── Night Material gallery ─────────────────────────────────────────────── */
function NightMaterialGallery({ x, z }: { x: number; z: number }) {
  const concTex = useMemo(() => { const t = makeBlackConcreteTex(); t.repeat.set(4, 2); return t }, [])
  const signTex = useMemo(() => makeCrimsonSignTex("NIGHT MATERIAL", "COMPOUND · EDITIONS"), [])
  useEffect(() => () => { concTex.dispose(); signTex.dispose() }, [concTex, signTex])

  return (
    <group position={[x, 0, z]}>
      {/* Horizontal mass */}
      <mesh position={[0, 5.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 11, 14]} />
        <meshStandardMaterial color="#070508" roughness={0.94} metalness={0.04} map={concTex} />
      </mesh>
      {/* Asymmetric upper setback */}
      <mesh position={[-2, 12.5, 0]} castShadow>
        <boxGeometry args={[11, 3, 12]} />
        <meshStandardMaterial color="#060407" roughness={0.92} />
      </mesh>

      {/* Deep red glass — divided by chrome mullions */}
      {[-4.5, 0, 4.5].map((ox, i) => (
        <mesh key={i} position={[ox, 5.2, -7.06]}>
          <planeGeometry args={[3.4, 7.8]} />
          <meshStandardMaterial
            color="#0c0103"
            emissive={COLORS.crimson}
            emissiveIntensity={0.5 + i * 0.25}
            transparent opacity={0.84}
            roughness={0.05}
            metalness={0.22}
          />
        </mesh>
      ))}
      {/* Chrome mullions */}
      {[-2.8, 1.8].map((ox, i) => (
        <mesh key={i} position={[ox, 5.8, -7.08]}>
          <boxGeometry args={[0.12, 8.2, 0.08]} />
          <meshStandardMaterial color="#C8C9C7" roughness={0.12} metalness={0.96} />
        </mesh>
      ))}

      {/* Chrome threshold bar */}
      <mesh position={[0, 0.08, -7.08]}>
        <boxGeometry args={[16.4, 0.16, 0.12]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.14} metalness={0.95} />
      </mesh>

      {/* Sign */}
      <mesh position={[0, 10.6, -7.08]}>
        <planeGeometry args={[10, 1.1]} />
        <meshStandardMaterial color="#000" emissiveMap={signTex} emissive={COLORS.crimson} emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

/* ─── Dark residential tower with crimson slit windows ───────────────────── */
function CrimsonTower({ x, z, h = 44, d = 10 }: { x: number; z: number; h?: number; d?: number }) {
  const concTex = useMemo<THREE.CanvasTexture>(() => {
    const t = makeBlackConcreteTex()
    t.repeat.set(2, Math.max(2, Math.round(h / 14)))
    return t
  }, [h])
  useEffect(() => () => { concTex.dispose() }, [concTex])

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, h, d]} />
        <meshStandardMaterial color="#070508" roughness={0.95} metalness={0.03} map={concTex} />
      </mesh>
      {/* Roofline crimson trim */}
      <mesh position={[0, h + 0.22, 0]}>
        <boxGeometry args={[10.2, 0.44, d + 0.2]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={0.7} />
      </mesh>
      {/* Vertical crimson slits — 2 columns */}
      {[-2.8, 2.8].map((ox, ci) =>
        Array.from({ length: Math.round(h / 6) }, (_, ri) => (
          <mesh key={`${ci}-${ri}`} position={[ox, 2.5 + ri * 6, d / 2 + 0.01]}>
            <planeGeometry args={[0.2, 3.6]} />
            <meshStandardMaterial
              color={COLORS.crimson}
              emissive={COLORS.crimson}
              emissiveIntensity={ri % 2 === 0 ? 2.0 : 1.2}
              transparent opacity={0.72}
              depthWrite={false}
            />
          </mesh>
        ))
      )}
    </group>
  )
}

/* ─── Outdoor installation + café + poster wall ──────────────────────────── */
function OutdoorInstallation({ x, z }: { x: number; z: number }) {
  const signTex   = useMemo(() => makeCrimsonSignTex("CRIMSON"), [])
  const nightTex  = useMemo(() => makeCrimsonSignTex("NIGHT MATERIAL"), [])
  const afterTex  = useMemo(() => makeCrimsonSignTex("AFTER DARK"), [])
  useEffect(() => () => { signTex.dispose(); nightTex.dispose(); afterTex.dispose() }, [signTex, nightTex, afterTex])

  return (
    <group position={[x, 0, z]}>
      {/* Steel frame installation — uprights */}
      {[-5, 0, 5].map((ox, i) => (
        <mesh key={i} position={[ox, 5.5, 0]} castShadow>
          <boxGeometry args={[0.16, 11, 0.16]} />
          <meshStandardMaterial color="#1a1618" roughness={0.5} metalness={0.88} />
        </mesh>
      ))}
      {/* Horizontal cross beams */}
      {[3.5, 7, 10].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[10.5, 0.14, 0.14]} />
          <meshStandardMaterial color="#1a1618" roughness={0.5} metalness={0.88} />
        </mesh>
      ))}
      {/* Fabric panel — semi-opaque */}
      <mesh position={[0, 6, 0]}>
        <planeGeometry args={[9.8, 7.5]} />
        <meshStandardMaterial color="#0c080b" roughness={0.99} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Poster wall */}
      <mesh position={[11, 4.5, 0]}>
        <boxGeometry args={[0.2, 9, 10]} />
        <meshStandardMaterial color="#060406" roughness={0.96} />
      </mesh>
      <mesh position={[11.12, 6.5, 2]}>
        <planeGeometry args={[7.5, 0.9]} />
        <meshStandardMaterial color="#000" emissiveMap={signTex} emissive={COLORS.crimson} emissiveIntensity={1.1} />
      </mesh>
      <mesh position={[11.12, 5, 2]}>
        <planeGeometry args={[7, 0.78]} />
        <meshStandardMaterial color="#000" emissiveMap={nightTex} emissive={COLORS.crimson} emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[11.12, 3.5, 2]}>
        <planeGeometry args={[6.5, 0.78]} />
        <meshStandardMaterial color="#000" emissiveMap={afterTex} emissive={COLORS.crimson} emissiveIntensity={0.72} />
      </mesh>

      {/* Late-night café — 3 tables */}
      {[-3.5, 0, 3.5].map((ox, i) => (
        <group key={i} position={[ox, 0, -6]}>
          <mesh position={[0, 0.76, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.06, 10]} />
            <meshStandardMaterial color="#0e0a0d" roughness={0.7} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.7, 6]} />
            <meshStandardMaterial color="#1a1618" roughness={0.5} metalness={0.88} />
          </mesh>
          {[-0.52, 0.52].map((sx, j) => (
            <mesh key={j} position={[sx, 0.4, 0]}>
              <cylinderGeometry args={[0.19, 0.17, 0.08, 8]} />
              <meshStandardMaterial color="#0c0a0e" roughness={0.82} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/* ─── Crimson district colliders ─────────────────────────────────────────── */
export const CRIMSON_COLLIDERS = [
  // Branch road kerbs
  { x: -37, z: -113, hw: 17, hd: 1.5 },
  { x: -37, z: -127, hw: 17, hd: 1.5 },
  // Buildings
  { x: -74, z: -108, hw: 12, hd: 11 },  // Performance Hall
  { x: -56, z: -90,  hw:  9, hd:  6 },  // Fashion Atelier
  { x: -73, z: -142, hw: 12, hd: 10 },  // After Dark Club
  { x: -56, z: -150, hw:  9, hd:  7 },  // Night Material gallery
  // Boundary
  { x: -88, z: -120, hw:  4, hd: 38 },  // West wall
  { x: -55, z: -160, hw: 33, hd:  2 },  // South wall
]

/* ─── CrimsonDistrict — main export ─────────────────────────────────────── */
export function CrimsonDistrict() {
  const asphTex  = useMemo<THREE.CanvasTexture>(() => { const t = makeWetAsphaltTex(); t.repeat.set(12, 12); return t }, [])
  const concTex  = useMemo<THREE.CanvasTexture>(() => { const t = makeBlackConcreteTex(); t.repeat.set(5, 1); return t }, [])
  const criSign  = useMemo(() => makeCrimsonSignTex("CRIMSON", "COMPOUND · NIGHT CULTURE"), [])
  useEffect(() => () => { asphTex.dispose(); concTex.dispose(); criSign.dispose() }, [asphTex, concTex, criSign])

  return (
    <group>
      {/* ── Sparse atmosphere ── */}
      <CrimsonParticles x={-62} z={-120} />

      {/* ── District ground — wet black asphalt ── */}
      <mesh position={[-60, -0.02, -122]} receiveShadow>
        <boxGeometry args={[72, 0.06, 80]} />
        <meshStandardMaterial color="#060406" roughness={0.20} metalness={0.10} map={asphTex} />
      </mesh>

      {/* ── Entry road from boulevard ── */}
      <mesh position={[-37, -0.01, -120]} receiveShadow>
        <boxGeometry args={[34, 0.05, 12]} />
        <meshStandardMaterial color="#060406" roughness={0.18} metalness={0.12} map={asphTex} />
      </mesh>
      {/* Directional crimson ground guide strips */}
      {[-3.5, 0, 3.5].map((dz, i) => (
        <mesh key={i} position={[-37, -0.005, -120 + dz]}>
          <boxGeometry args={[32, 0.01, 0.06]} />
          <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={1.6} transparent opacity={0.45} depthWrite={false} />
        </mesh>
      ))}

      {/* ── North boundary wall (solid concrete, with one entry arch) ── */}
      <mesh position={[-60, 4.5, -84.2]} castShadow receiveShadow>
        <boxGeometry args={[56, 9, 0.4]} />
        <meshStandardMaterial color="#070508" roughness={0.93} metalness={0.03} map={concTex} />
      </mesh>
      {/* Crimson top band on north wall */}
      <mesh position={[-60, 9.1, -84.2]}>
        <boxGeometry args={[56.4, 0.2, 0.5]} />
        <meshStandardMaterial color={COLORS.crimson} emissive={COLORS.crimson} emissiveIntensity={1.0} />
      </mesh>

      {/* ── District identifier sign ── */}
      <mesh position={[-22, 3.2, -113.2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[7.5, 0.9]} />
        <meshStandardMaterial color="#000" emissiveMap={criSign} emissive={COLORS.crimson} emissiveIntensity={1.5} />
      </mesh>

      {/* ── Central sound sculpture ── */}
      <CrimsonSoundSculpture x={-64} z={-120} />

      {/* ── Performance Hall (north of entry road) ── */}
      <PerformanceHall x={-74} z={-108} />

      {/* ── Fashion Atelier (north-east, close to boulevard) ── */}
      <FashionAtelier x={-56} z={-90} />

      {/* ── After Dark Club (south of entry road) ── */}
      <AfterDarkClub x={-73} z={-142} />

      {/* ── Night Material gallery (south-east) ── */}
      <NightMaterialGallery x={-56} z={-150} />

      {/* ── Residential towers ── */}
      <CrimsonTower x={-87} z={-95}  h={50} />
      <CrimsonTower x={-87} z={-148} h={40} d={8} />
      <CrimsonTower x={-84} z={-128} h={30} d={9} />

      {/* ── Outdoor installation + café + poster wall ── */}
      <OutdoorInstallation x={-46} z={-115} />

      {/* ── District fill lighting (strict budget) ── */}
      {/* Primary crimson fill — broad, low intensity */}
      <pointLight position={[-64, 10, -120]} color={COLORS.crimson} intensity={45} distance={60} decay={1.5} />
      {/* South fill — warms the After Dark side */}
      <pointLight position={[-64, 6, -148]} color="#7a0520" intensity={22} distance={32} decay={1.8} />
      {/* Entry throat light */}
      <pointLight position={[-30, 4, -120]} color={COLORS.crimson} intensity={14} distance={18} decay={2} />
    </group>
  )
}
