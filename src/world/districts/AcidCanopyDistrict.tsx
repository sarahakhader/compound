"use client"
import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { COLORS } from "../WorldConfig"

/* ── Canvas textures ── */
function makeLeafTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#060d03"
  ctx.fillRect(0, 0, W, H)
  // Cellular structure
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * W, y = Math.random() * H
    const r = 6 + Math.random() * 18
    const lum = 0.04 + Math.random() * 0.06
    ctx.fillStyle = `rgba(${Math.floor(lum * 60)},${Math.floor(lum * 180 + 20)},${Math.floor(lum * 30)},0.7)`
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeMossTex(): THREE.CanvasTexture {
  const W = 256, H = 64
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#030804"
  ctx.fillRect(0, 0, W, H)
  // Dense stipple
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * W, y = Math.random() * H
    const brightness = 0.15 + Math.random() * 0.45
    ctx.fillStyle = `rgba(${Math.floor(brightness * 60)},${Math.floor(brightness * 210)},${Math.floor(brightness * 20)},${0.4 + Math.random() * 0.5})`
    ctx.fillRect(x, y, 2, 2)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ── Single structural arch ── */
const ARCH_SPAN = 26   // clear span in X
const ARCH_H    = 13   // post height (m)

function CanopyArch({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      {/* Left post */}
      <mesh position={[-ARCH_SPAN / 2, ARCH_H / 2, 0]} castShadow>
        <boxGeometry args={[0.9, ARCH_H, 0.9]} />
        <meshStandardMaterial color="#090c0a" roughness={0.88} metalness={0.14} />
      </mesh>
      {/* Right post */}
      <mesh position={[ARCH_SPAN / 2, ARCH_H / 2, 0]} castShadow>
        <boxGeometry args={[0.9, ARCH_H, 0.9]} />
        <meshStandardMaterial color="#090c0a" roughness={0.88} metalness={0.14} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, ARCH_H + 0.45, 0]} castShadow>
        <boxGeometry args={[ARCH_SPAN + 0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#090c0a" roughness={0.88} metalness={0.14} />
      </mesh>
      {/* Acid-green emissive strip on underside of top beam */}
      <mesh position={[0, ARCH_H - 0.01, 0]}>
        <boxGeometry args={[ARCH_SPAN - 1, 0.06, 0.14]} />
        <meshStandardMaterial
          color={COLORS.acidCanopy}
          emissive={COLORS.acidCanopy}
          emissiveIntensity={5}
          roughness={0.2}
        />
      </mesh>
      {/* Mid horizontal cross-bar */}
      <mesh position={[0, ARCH_H * 0.52, 0]}>
        <boxGeometry args={[ARCH_SPAN - 1, 0.18, 0.55]} />
        <meshStandardMaterial color="#0b0e0a" roughness={0.9} metalness={0.06} />
      </mesh>
      {/* Hanging plant clusters on cross-bar — 5 along span */}
      {([-9.5, -4.8, 0, 4.8, 9.5] as number[]).map((ox, i) => (
        <group key={i} position={[ox, ARCH_H * 0.52, 0]}>
          {/* Main foliage mass */}
          <mesh position={[0, -1.0, 0]}>
            <sphereGeometry args={[0.85, 7, 5]} />
            <meshStandardMaterial color="#0b1d06" roughness={0.96} />
          </mesh>
          <mesh position={[0.45, -1.55, 0.22]}>
            <sphereGeometry args={[0.52, 6, 4]} />
            <meshStandardMaterial color="#0d2208" roughness={0.96} />
          </mesh>
          <mesh position={[-0.38, -1.7, -0.18]}>
            <sphereGeometry args={[0.48, 6, 4]} />
            <meshStandardMaterial color="#0e2208" roughness={0.96} />
          </mesh>
          {/* Trailing vine tendrils */}
          <mesh position={[0.1, -2.2, 0.1]}>
            <cylinderGeometry args={[0.04, 0.01, 0.9, 4]} />
            <meshStandardMaterial color="#0a1805" roughness={0.98} />
          </mesh>
          <mesh position={[-0.15, -2.4, -0.08]}>
            <cylinderGeometry args={[0.03, 0.01, 1.1, 4]} />
            <meshStandardMaterial color="#0a1805" roughness={0.98} />
          </mesh>
          {/* Acid-green bioluminescent tip */}
          <mesh position={[0, -2.6, 0]}>
            <sphereGeometry args={[0.1, 5, 4]} />
            <meshStandardMaterial
              color={COLORS.acidCanopy}
              emissive={COLORS.acidCanopy}
              emissiveIntensity={4}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ── Animated bioluminescent moss planter ── */
function MedianPlanter({ z }: { z: number }) {
  const mossRef = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (mossRef.current) {
      const mat = mossRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.55 + Math.sin(clock.elapsedTime * 0.9 + z * 0.05) * 0.2
    }
  })
  return (
    <group position={[0, 0, z]}>
      {/* Planter casing */}
      <mesh position={[0, 0.28, 0]} receiveShadow>
        <boxGeometry args={[2.8, 0.56, 5.5]} />
        <meshStandardMaterial color="#070908" roughness={0.95} metalness={0.08} />
      </mesh>
      {/* Soil / substrate layer */}
      <mesh position={[0, 0.57, 0]}>
        <boxGeometry args={[2.6, 0.05, 5.3]} />
        <meshStandardMaterial color="#050603" roughness={0.99} />
      </mesh>
      {/* Bioluminescent moss (animated) */}
      <mesh ref={mossRef} position={[0, 0.62, 0]}>
        <boxGeometry args={[2.4, 0.06, 5.0]} />
        <meshStandardMaterial
          color="#1a4208"
          emissive={COLORS.acidCanopy}
          emissiveIntensity={0.55}
          roughness={0.92}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Low planting mass */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[1.0, 8, 5]} />
        <meshStandardMaterial color="#0c1d06" roughness={0.97} />
      </mesh>
      <mesh position={[-0.65, 0.85, 0.9]}>
        <sphereGeometry args={[0.6, 6, 4]} />
        <meshStandardMaterial color="#0e2207" roughness={0.97} />
      </mesh>
      <mesh position={[0.55, 0.8, -0.8]}>
        <sphereGeometry args={[0.55, 6, 4]} />
        <meshStandardMaterial color="#0d2107" roughness={0.97} />
      </mesh>
    </group>
  )
}

/* ── Tall specimen tree ── */
function SpecimenTree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 8, 7]} />
        <meshStandardMaterial color="#0c0c09" roughness={0.98} />
      </mesh>
      {/* Lower canopy */}
      <mesh position={[0, 9.2, 0]} castShadow>
        <sphereGeometry args={[2.1, 8, 6]} />
        <meshStandardMaterial color="#0d2007" roughness={0.96} />
      </mesh>
      {/* Upper canopy */}
      <mesh position={[0, 11.2, 0]} castShadow>
        <sphereGeometry args={[1.4, 7, 5]} />
        <meshStandardMaterial color="#0f2608" roughness={0.96} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 12.5, 0]}>
        <sphereGeometry args={[0.7, 6, 4]} />
        <meshStandardMaterial color="#112a09" roughness={0.96} />
      </mesh>
      {/* Acid-green bloom tips */}
      {([
        [0.7, 12.2, 0.4], [-0.6, 12.6, -0.3], [0.3, 13.0, -0.5],
      ] as [number, number, number][]).map(([ox, oy, oz], i) => (
        <mesh key={i} position={[ox, oy, oz]}>
          <sphereGeometry args={[0.14, 5, 4]} />
          <meshStandardMaterial
            color={COLORS.acidCanopy}
            emissive={COLORS.acidCanopy}
            emissiveIntensity={3.5}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ── District entry sign ── */
function DistrictSign() {
  const tex = (() => {
    const W = 640, H = 96
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#04080300"
    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = COLORS.acidCanopy
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, W - 4, H - 4)
    ctx.fillStyle = COLORS.acidCanopy
    ctx.font = "bold 28px 'Courier New', monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("ACID CANOPY · BIOPHILIC DISTRICT", W / 2, H / 2 - 10)
    ctx.font = "14px 'Courier New', monospace"
    ctx.fillStyle = "rgba(151,215,0,0.55)"
    ctx.fillText("GREENHOUSE CORRIDOR   ·   ZONE AC-04", W / 2, H / 2 + 20)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()

  useEffect(() => () => { tex.dispose() }, [tex])

  return (
    <group position={[-13, 0, -102]}>
      {/* Post */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 3.6, 6]} />
        <meshStandardMaterial color="#0c0d0b" roughness={0.85} metalness={0.4} />
      </mesh>
      {/* Sign panel */}
      <mesh position={[3.2, 3.5, 0]}>
        <boxGeometry args={[6.4, 0.96, 0.08]} />
        <meshStandardMaterial color="#040604" roughness={0.9} />
      </mesh>
      {/* Sign face */}
      <mesh position={[3.2, 3.5, 0.05]}>
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

/* ── Export ── */
export function AcidCanopyDistrict() {
  // 5 arches spanning the biophilic corridor
  const ARCH_Z = [-106, -116, -126, -136, -146] as const
  // Trees flanking the road (street trees) — kept outside road (x ≈ ±11)
  const TREES: [number, number][] = [
    [-11, -109], [11, -113], [-11, -123], [11, -129],
    [-11, -133], [11, -139], [-11, -143],
  ]

  return (
    <group>
      <DistrictSign />

      {ARCH_Z.map(z => <CanopyArch key={z} z={z} />)}

      {/* Median planters — between arches */}
      {[-111, -121, -131, -141].map(z => (
        <MedianPlanter key={z} z={z} />
      ))}

      {/* Street trees */}
      {TREES.map(([x, z]) => (
        <SpecimenTree key={`${x},${z}`} x={x} z={z} />
      ))}

      {/* Ground-level bioluminescent channel along median gutter lines */}
      {([-106, -116, -126, -136, -146] as const).map(z => (
        <group key={z}>
          {/* Left gutter strip */}
          <mesh position={[-6.5, 0.01, z]}>
            <boxGeometry args={[0.12, 0.04, 9]} />
            <meshStandardMaterial
              color={COLORS.acidCanopy}
              emissive={COLORS.acidCanopy}
              emissiveIntensity={1.4}
              roughness={0.5}
              transparent
              opacity={0.65}
            />
          </mesh>
          {/* Right gutter strip */}
          <mesh position={[6.5, 0.01, z]}>
            <boxGeometry args={[0.12, 0.04, 9]} />
            <meshStandardMaterial
              color={COLORS.acidCanopy}
              emissive={COLORS.acidCanopy}
              emissiveIntensity={1.4}
              roughness={0.5}
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
