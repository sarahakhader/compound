"use client"
import React, { useMemo } from "react"
import * as THREE from "three"

/* ── Building AABB colliders (exported for Player collision) ── */
export interface Collider {
  x: number; z: number   // world centre
  hw: number; hd: number // half-extents
}

export const COLLIDERS: Collider[] = [
  // West side
  { x: -20, z: -5,   hw: 5,  hd: 9  },
  { x: -22, z: -37,  hw: 7,  hd: 11 },
  { x: -19, z: -67,  hw: 4,  hd: 8  },
  { x: -23, z: -97,  hw: 8,  hd: 13 },
  { x: -20, z: -127, hw: 5,  hd: 10 },
  // East side
  { x:  20, z: -5,   hw: 5,  hd: 9  },
  { x:  22, z: -37,  hw: 7,  hd: 11 },
  { x:  19, z: -67,  hw: 4,  hd: 8  },
  { x:  23, z: -97,  hw: 8,  hd: 13 },
  { x:  20, z: -127, hw: 5,  hd: 10 },
  // Side walls (prevent straying off the boulevard)
  { x: -18, z: -70, hw: 3,  hd: 75 },
  { x:  18, z: -70, hw: 3,  hd: 75 },
  // Plaza rim
  { x: 0, z: -152, hw: 32, hd: 3 },
]

/* ── Window texture ── */
function makeWindowTex(cols: number, rows: number): THREE.CanvasTexture {
  const W = cols * 16, H = rows * 14
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#050508"
  ctx.fillRect(0, 0, W, H)
  for (let r = 0; r < rows; r++) {
    for (let cl = 0; cl < cols; cl++) {
      if (Math.random() > 0.35) {
        const warm = Math.random() > 0.28
        ctx.fillStyle = warm ? "#E6B87A" : "#55D9D2"
        ctx.globalAlpha = 0.3 + Math.random() * 0.6
        ctx.fillRect(cl * 16 + 2, r * 14 + 2, 12, 10)
      }
    }
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ── Foreground building ── */
interface BuildingDef {
  x: number; z: number     // world centre
  w: number; d: number; h: number
  accent: string
  side: "west" | "east"
  name?: string
}

function Building({ x, z, w, d, h, accent, side }: BuildingDef) {
  const facadeSign = side === "west" ? 1 : -1   // which face is street-facing

  const winCols = Math.max(2, Math.round(w / 2.8))
  const winRows = Math.max(4, Math.round(h / 3.8))
  const winTex  = useMemo(() => makeWindowTex(winCols, winRows), [winCols, winRows])

  /* Stone/concrete base — wider and darker */
  const baseH = 1.4
  /* Main tower */
  const towerY = baseH + h / 2

  /* Facade detail: shallow horizontal banding (articulation) */
  const bandCount = Math.floor(h / 12)

  return (
    <group position={[x, 0, z]}>
      {/* ── Foundation base ── */}
      <mesh position={[0, baseH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 2, baseH, d + 2]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.96} metalness={0.02} />
      </mesh>

      {/* ── Main tower body ── */}
      <mesh position={[0, towerY, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#1a1e2c" roughness={0.85} metalness={0.08} />
      </mesh>

      {/* ── Facade articulation: inset window panel (street-facing) ── */}
      <mesh position={[facadeSign * (w / 2 - 0.01), towerY, 0]} castShadow={false}>
        <planeGeometry args={[d * 0.78, h * 0.82]} />
        <meshStandardMaterial
          color="#000"
          emissive="#ffffff"
          emissiveIntensity={1.1}
          emissiveMap={winTex}
          roughness={0.2}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* ── Horizontal banding (facade depth) ── */}
      {Array.from({ length: bandCount }, (_, i) => (
        <mesh
          key={i}
          position={[0, baseH + (i + 1) * (h / (bandCount + 1)), facadeSign * (d / 2 + 0.05)]}
          castShadow={false}
        >
          <boxGeometry args={[w + 0.1, 0.18, 0.12]} />
          <meshStandardMaterial color="#0a0b0e" roughness={0.85} metalness={0.15} />
        </mesh>
      ))}

      {/* ── Vertical accent pilasters ── */}
      <mesh position={[0, towerY, facadeSign * (d / 2 + 0.06)]} castShadow>
        <boxGeometry args={[0.22, h, 0.14]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[w * 0.38 * facadeSign, towerY, facadeSign * (d / 2 + 0.04)]} castShadow={false}>
        <boxGeometry args={[0.14, h * 0.6, 0.1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.3} roughness={0.4} />
      </mesh>

      {/* ── Roofline overhang ── */}
      <mesh position={[0, baseH + h + 0.55, 0]} castShadow>
        <boxGeometry args={[w + 1.2, 1.1, d + 1.2]} />
        <meshStandardMaterial color="#0c0d11" roughness={0.92} />
      </mesh>
      {/* Roofline accent neon strip */}
      <mesh position={[0, baseH + h + 0.22, facadeSign * (d / 2 + 0.65)]}>
        <boxGeometry args={[w + 1.3, 0.12, 0.06]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.2} roughness={0.3} />
      </mesh>

      {/* ── Street-level entrance recess ── */}
      <mesh position={[0, baseH + 2.8, facadeSign * (d / 2 - 0.18)]} castShadow={false}>
        <boxGeometry args={[3.2, 4.8, 0.42]} />
        <meshStandardMaterial color="#080809" roughness={0.95} />
      </mesh>
      {/* Entrance warm glow */}
      <mesh position={[0, baseH + 2.8, facadeSign * (d / 2 - 0.01)]}>
        <planeGeometry args={[2.8, 4.2]} />
        <meshStandardMaterial
          color="#E6B87A"
          emissive="#E6B87A"
          emissiveIntensity={0.45}
          roughness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* ── Ground-floor glazing band ── */}
      <mesh position={[0, baseH + 2.5, facadeSign * (d / 2 + 0.04)]}>
        <boxGeometry args={[w * 0.85, 3.8, 0.08]} />
        <meshStandardMaterial
          color="#1a2535"
          roughness={0.06}
          metalness={0.85}
          transparent
          opacity={0.82}
        />
      </mesh>
    </group>
  )
}

/* ── Boulevard building data ── */
const WEST_BUILDINGS: BuildingDef[] = [
  { side:"west", x:-20,  z:-5,   w:10, d:18, h:38,  accent:"#55D9D2", name:"COMPOUND WORLD"  },
  { side:"west", x:-22,  z:-37,  w:14, d:22, h:62,  accent:"#97D700", name:"MATERIAL ARCHIVE" },
  { side:"west", x:-19,  z:-67,  w:8,  d:16, h:28,  accent:"#A74B2A", name:"BEDROCK"          },
  { side:"west", x:-23,  z:-97,  w:16, d:26, h:72,  accent:"#55D9D2", name:"HOUSE OF COMPOUND"},
  { side:"west", x:-20,  z:-127, w:10, d:20, h:34,  accent:"#2B153F", name:"ATMOSPHERE LAB"   },
]
const EAST_BUILDINGS: BuildingDef[] = [
  { side:"east", x: 20,  z:-5,   w:10, d:18, h:42,  accent:"#97D700", name:"THE ARCHIVE"      },
  { side:"east", x: 22,  z:-37,  w:14, d:22, h:55,  accent:"#55D9D2", name:"ACID CANOPY"      },
  { side:"east", x: 19,  z:-67,  w:8,  d:16, h:32,  accent:"#BA0C2F", name:"SENSORY SYSTEMS"  },
  { side:"east", x: 23,  z:-97,  w:16, d:26, h:68,  accent:"#A74B2A", name:"DATA SHRINE"      },
  { side:"east", x: 20,  z:-127, w:10, d:20, h:38,  accent:"#55D9D2", name:"CHROME WORKS"     },
]

/* ── Bollard ── */
function Bollard({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.48, z]} castShadow>
      <cylinderGeometry args={[0.09, 0.12, 0.95, 8]} />
      <meshStandardMaterial color="#1e2128" roughness={0.5} metalness={0.8} />
    </mesh>
  )
}

/* ── Median planter ── */
function Planter({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      {/* Concrete box */}
      <mesh position={[0, 0.22, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.6, 0.44, 5]} />
        <meshStandardMaterial color="#151618" roughness={0.96} />
      </mesh>
      {/* Moss/soil top */}
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[1.5, 0.06, 4.8]} />
        <meshStandardMaterial color="#1B3A2D" roughness={0.98} />
      </mesh>
      {/* Low tree trunk */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 1.3, 7]} />
        <meshStandardMaterial color="#12150f" roughness={0.95} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.7, 8, 6]} />
        <meshStandardMaterial color="#1B3A2D" roughness={0.95} />
      </mesh>
    </group>
  )
}

/* ── Road markings geometry ── */
function RoadMarkings() {
  const stripes = useMemo(() => {
    const items: React.ReactElement[] = []
    // Lane dividers (dashed)
    const laneXs = [-7.5, -3.8, 0, 3.8, 7.5]
    for (const lx of laneXs) {
      for (let z = 5; z > -148; z -= 8) {
        items.push(
          <mesh key={`d-${lx}-${z}`} position={[lx, 0.002, z - 2.5]} receiveShadow={false}>
            <boxGeometry args={[0.15, 0.01, 4.5]} />
            <meshStandardMaterial color="#e8e0d0" roughness={0.7} transparent opacity={0.45} />
          </mesh>
        )
      }
    }
    // Crosswalk at z = -128
    for (let i = -4; i <= 4; i++) {
      items.push(
        <mesh key={`cw-${i}`} position={[i * 1.9, 0.002, -130]} receiveShadow={false}>
          <boxGeometry args={[0.7, 0.01, 4.5]} />
          <meshStandardMaterial color="#ddd8c8" roughness={0.7} transparent opacity={0.4} />
        </mesh>
      )
    }
    return items
  }, [])

  return <>{stripes}</>
}

/* ── Drainage channel grate ── */
function DrainGrate({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.001, z]} receiveShadow={false}>
      <boxGeometry args={[0.5, 0.008, 1.2]} />
      <meshStandardMaterial color="#222428" roughness={0.4} metalness={0.85} />
    </mesh>
  )
}

/* ── Steam vent ── */
function SteamVent({ x, z }: { x: number; z: number }) {
  return (
    <>
      <mesh position={[x, 0.05, z]} receiveShadow={false}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 8]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.6} metalness={0.8} />
      </mesh>
      {/* Vent haze — just a slightly emissive white cone */}
      <mesh position={[x, 0.35, z]}>
        <coneGeometry args={[0.08, 0.6, 6]} />
        <meshStandardMaterial color="#e0eeff" emissive="#e0eeff" emissiveIntensity={0.1} transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </>
  )
}

/* ── Bench ── */
function Bench({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.08, 0.48]} />
        <meshStandardMaterial color="#1a1510" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Legs */}
      {[-0.6, 0.6].map((lx, i) => (
        <mesh key={i} position={[lx, 0.2, 0]} castShadow>
          <boxGeometry args={[0.08, 0.42, 0.44]} />
          <meshStandardMaterial color="#1e2028" roughness={0.5} metalness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/* ── Mansion exterior ── */
function MansionExterior() {
  const winTex = useMemo(() => makeWindowTex(4, 3), [])

  return (
    <group position={[70, 4, -60]}>
      {/* Hill */}
      <mesh position={[0, -3, 0]} receiveShadow>
        <cylinderGeometry args={[28, 38, 6, 16]} />
        <meshStandardMaterial color="#0c0e11" roughness={0.96} />
      </mesh>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[26, 28, 0.25, 16]} />
        <meshStandardMaterial color="#1B3A2D" roughness={0.98} />
      </mesh>

      {/* Main body */}
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[28, 12, 18]} />
        <meshStandardMaterial color="#101316" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Upper storey */}
      <mesh position={[0, 14, -1]} castShadow receiveShadow>
        <boxGeometry args={[22, 6, 16]} />
        <meshStandardMaterial color="#0e1114" roughness={0.9} />
      </mesh>

      {/* Large windows (front facade, -Z face) */}
      <mesh position={[0, 7, 9.1]}>
        <boxGeometry args={[20, 8, 0.12]} />
        <meshStandardMaterial
          color="#1a2535"
          roughness={0.04}
          metalness={0.9}
          transparent
          opacity={0.78}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Emissive window mullion glow (warm interior) */}
      <mesh position={[0, 7, 9.15]}>
        <planeGeometry args={[18, 7]} />
        <meshStandardMaterial
          color="#000"
          emissive="#E6B87A"
          emissiveIntensity={0.55}
          emissiveMap={winTex}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Flat roof */}
      <mesh position={[0, 17.2, 0]} castShadow>
        <boxGeometry args={[28.8, 0.5, 18.8]} />
        <meshStandardMaterial color="#0c0d10" roughness={0.85} />
      </mesh>

      {/* Roof terrace railing — chrome */}
      <mesh position={[0, 17.7, 0]}>
        <boxGeometry args={[29, 0.08, 18]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.2} metalness={0.95} />
      </mesh>

      {/* Entrance canopy */}
      <mesh position={[0, 3.5, 9.5]} castShadow>
        <boxGeometry args={[5, 0.22, 3]} />
        <meshStandardMaterial color="#0e1014" roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 2.1, 9.12]}>
        <boxGeometry args={[2.2, 4.2, 0.12]} />
        <meshStandardMaterial color="#1a2535" roughness={0.04} metalness={0.9} transparent opacity={0.72} />
      </mesh>

      {/* Glacier accent strip above entrance */}
      <mesh position={[0, 4.2, 9.18]}>
        <boxGeometry args={[5.2, 0.1, 0.06]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={2} roughness={0.3} />
      </mesh>

      {/* Rooftop acid strip */}
      <mesh position={[0, 17.45, 9.45]}>
        <boxGeometry args={[29, 0.1, 0.06]} />
        <meshStandardMaterial color="#97D700" emissive="#97D700" emissiveIntensity={1.8} roughness={0.3} />
      </mesh>

      {/* Courtyard wall */}
      <mesh position={[0, 1, -12]} castShadow receiveShadow>
        <boxGeometry args={[28, 2, 1]} />
        <meshStandardMaterial color="#111418" roughness={0.92} />
      </mesh>

      {/* Access road */}
      <mesh position={[-8, 0.02, 13]} receiveShadow>
        <boxGeometry args={[8, 0.04, 10]} />
        <meshStandardMaterial color="#0f1014" roughness={0.24} metalness={0.08} />
      </mesh>
    </group>
  )
}

/* ── Central plaza ── */
function CentralPlaza() {
  const winTex = useMemo(() => makeWindowTex(3, 2), [])

  return (
    <group position={[0, 0, -148]}>
      {/* Sunken floor */}
      <mesh position={[0, -0.55, 0]} receiveShadow>
        <cylinderGeometry args={[32, 34, 1.1, 32]} />
        <meshStandardMaterial color="#0e0f13" roughness={0.9} />
      </mesh>

      {/* Shallow water basin (inner) */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[16, 16.5, 0.05, 32]} />
        <meshStandardMaterial
          color="#07100D"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.88}
          envMapIntensity={2}
        />
      </mesh>
      {/* Water surface reflection tint */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[15.8, 15.8, 0.01, 32]} />
        <meshStandardMaterial
          color="#55D9D2"
          emissive="#55D9D2"
          emissiveIntensity={0.06}
          roughness={0.02}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Perimeter low wall */}
      <mesh position={[0, 0.28, 0]}>
        <torusGeometry args={[32, 0.38, 6, 48]} />
        <meshStandardMaterial color="#12141a" roughness={0.9} />
      </mesh>

      {/* Monolithic Compound sculpture */}
      <group position={[0, 0, 0]}>
        {/* Base plinth */}
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 1.2, 4]} />
          <meshStandardMaterial color="#0e0f14" roughness={0.9} />
        </mesh>
        {/* Abstract form: tapering monolith */}
        <mesh position={[0, 5.5, 0]} castShadow>
          <cylinderGeometry args={[0.6, 1.5, 9, 5]} />
          <meshStandardMaterial color="#151820" roughness={0.85} metalness={0.12} />
        </mesh>
        {/* Glacier accent ring */}
        <mesh position={[0, 3, 0]}>
          <torusGeometry args={[1.4, 0.06, 8, 32]} />
          <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={2.5} roughness={0.3} />
        </mesh>
        {/* Top cap */}
        <mesh position={[0, 10.2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.6, 0.4, 5]} />
          <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={1.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Concrete seating blocks */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const r = 22
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0.22, Math.sin(angle) * r]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.44, 0.8]} />
            <meshStandardMaterial color="#111318" roughness={0.94} />
          </mesh>
        )
      })}

      {/* Mature trees around perimeter */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const r = 26
        return (
          <group key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            <mesh position={[0, 1.8, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.18, 3.6, 7]} />
              <meshStandardMaterial color="#0f120c" roughness={0.96} />
            </mesh>
            <mesh position={[0, 4.4, 0]}>
              <sphereGeometry args={[1.5, 8, 6]} />
              <meshStandardMaterial color="#1B3A2D" roughness={0.96} />
            </mesh>
          </group>
        )
      })}

      {/* Gallery entrance (north) */}
      <group position={[0, 0, -30]}>
        <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 7, 2]} />
          <meshStandardMaterial color="#0e1014" roughness={0.88} />
        </mesh>
        {/* Gallery glass facade */}
        <mesh position={[0, 3.5, 1.1]}>
          <boxGeometry args={[10, 5.5, 0.1]} />
          <meshStandardMaterial color="#1a2535" roughness={0.04} metalness={0.9} transparent opacity={0.75} />
        </mesh>
        {/* Acid accent */}
        <mesh position={[0, 7.2, 0]}>
          <boxGeometry args={[12.4, 0.12, 2.2]} />
          <meshStandardMaterial color="#97D700" emissive="#97D700" emissiveIntensity={2} roughness={0.3} />
        </mesh>
      </group>

      {/* Animated screen (flat emissive plane) */}
      <mesh position={[-18, 5, 5]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#000" emissive="#55D9D2" emissiveIntensity={0.35} roughness={0.2} />
      </mesh>
      <mesh position={[18, 5, 5]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#000" emissive="#97D700" emissiveIntensity={0.22} roughness={0.2} />
      </mesh>
    </group>
  )
}

/* ── Main city export ── */
export function City() {
  return (
    <group>
      {/* ── Ground plane (wet asphalt) ── */}
      <mesh position={[0, -0.01, -70]} receiveShadow>
        <boxGeometry args={[200, 0.06, 320]} />
        <meshStandardMaterial color="#0c0d12" roughness={0.22} metalness={0.08} />
      </mesh>

      {/* ── Sidewalks (raised 0.15 m) ── */}
      {/* West */}
      <mesh position={[-12.8, 0.08, -70]} receiveShadow castShadow>
        <boxGeometry args={[4, 0.16, 320]} />
        <meshStandardMaterial color="#111318" roughness={0.94} />
      </mesh>
      {/* East */}
      <mesh position={[12.8, 0.08, -70]} receiveShadow castShadow>
        <boxGeometry args={[4, 0.16, 320]} />
        <meshStandardMaterial color="#111318" roughness={0.94} />
      </mesh>

      {/* ── Curb edges ── */}
      <mesh position={[-11.05, 0.1, -70]}>
        <boxGeometry args={[0.18, 0.18, 320]} />
        <meshStandardMaterial color="#1c1e26" roughness={0.8} />
      </mesh>
      <mesh position={[11.05, 0.1, -70]}>
        <boxGeometry args={[0.18, 0.18, 320]} />
        <meshStandardMaterial color="#1c1e26" roughness={0.8} />
      </mesh>
      <mesh position={[-14.6, 0.1, -70]}>
        <boxGeometry args={[0.18, 0.18, 320]} />
        <meshStandardMaterial color="#1c1e26" roughness={0.8} />
      </mesh>
      <mesh position={[14.6, 0.1, -70]}>
        <boxGeometry args={[0.18, 0.18, 320]} />
        <meshStandardMaterial color="#1c1e26" roughness={0.8} />
      </mesh>

      {/* ── Center median ── */}
      <mesh position={[0, 0.1, -70]} receiveShadow castShadow>
        <boxGeometry args={[2, 0.2, 320]} />
        <meshStandardMaterial color="#0f1014" roughness={0.9} />
      </mesh>

      {/* ── Median planters ── */}
      {Array.from({ length: 8 }, (_, i) => (
        <Planter key={i} z={8 - i * 20} />
      ))}

      {/* ── Road markings ── */}
      <RoadMarkings />

      {/* ── Drainage grates ── */}
      {[-8, -40, -80, -110].map(z => (
        <>
          <DrainGrate key={`dw-${z}`} x={-11.2} z={z} />
          <DrainGrate key={`de-${z}`} x={11.2} z={z} />
        </>
      ))}

      {/* ── Steam vents ── */}
      <SteamVent x={-10.8} z={-55} />
      <SteamVent x={10.4}  z={-90} />
      <SteamVent x={-10.6} z={-115} />

      {/* ── Bollards ── */}
      {[-5, -25, -55, -85, -110, -135].flatMap(z => [
        <Bollard key={`bw1-${z}`} x={-11.5} z={z} />,
        <Bollard key={`bw2-${z}`} x={-11.5} z={z - 2.5} />,
        <Bollard key={`be1-${z}`} x={11.5}  z={z} />,
        <Bollard key={`be2-${z}`} x={11.5}  z={z - 2.5} />,
      ])}

      {/* ── Benches ── */}
      <Bench x={-13.5} z={-18} ry={Math.PI / 2} />
      <Bench x={13.5}  z={-30} ry={Math.PI / 2} />
      <Bench x={-13.5} z={-75} ry={Math.PI / 2} />
      <Bench x={13.5}  z={-110} ry={Math.PI / 2} />

      {/* ── Foreground buildings ── */}
      {WEST_BUILDINGS.map((b, i) => <Building key={`w${i}`} {...b} />)}
      {EAST_BUILDINGS.map((b, i) => <Building key={`e${i}`} {...b} />)}

      {/* ── Central plaza ── */}
      <CentralPlaza />

      {/* ── Mansion exterior ── */}
      <MansionExterior />
    </group>
  )
}
