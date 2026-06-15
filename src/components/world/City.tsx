"use client"
import React, { useMemo, useEffect, useRef } from "react"
import * as THREE from "three"
import { BedrockDistrict } from "../../world/districts/BedrockDistrict"
import { ChromeDistrict } from "../../world/districts/ChromeDistrict"
import { DeepVioletDistrict } from "../../world/districts/DeepVioletDistrict"
import { CrimsonDistrict, CRIMSON_COLLIDERS } from "../../world/districts/CrimsonDistrict"
import { AcidCanopyDistrict } from "../../world/districts/AcidCanopyDistrict"
import { GlacierDistrict, GLACIER_COLLIDERS } from "../../world/districts/GlacierDistrict"
import { VideoSign } from "./VideoSign"
import { VideoTextureScreen } from "../../world/systems/VideoTextureScreen"
import { COMPOUND_ASSETS } from "../../world/CompoundAssetManifest"

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
  // West side wall — split for two branch road gaps:
  //   Bedrock branch:  z=-53 … -67  (14m)
  //   Crimson branch:  z=-113 … -127 (14m)
  { x: -18, z: -23,  hw: 3, hd: 30 },   // z: 7 → -53
  { x: -18, z: -90,  hw: 3, hd: 23 },   // z: -67 → -113
  { x: -18, z: -134, hw: 3, hd:  7 },   // z: -127 → -141 (gap south = Glacier entrance)
  // East side wall — split for two branch gaps:
  //   Chrome district branch:  z=-73 … -87  (14m)
  //   Mansion approach:        z=-93 … -107 (14m)
  { x:  18, z: -34,  hw: 3, hd: 39 },   // z: 5 → -73
  { x:  18, z: -90,  hw: 3, hd:  3 },   // z: -87 → -93  (6m bridge between gaps)
  { x:  18, z: -126, hw: 3, hd: 19 },   // z: -107 → -145
  // Plaza rim — centre passage for Deep Violet + west open for Glacier entrance
  { x: -13, z: -152, hw:  3, hd: 3 },   // west stub  (x: -16 → -10), west side open to Glacier
  { x:  21, z: -152, hw: 11, hd: 3 },   // east half  (x:  10 →  32)
  // Mansion approach: road walls (north and south kerbs)
  { x: 42, z: -93,  hw: 33, hd: 1.5 },  // north kerb of approach road
  { x: 42, z: -107, hw: 33, hd: 1.5 },  // south kerb
  // Mansion building (kept for exterior approach, blocks hill walk-through)
  { x: 70, z: -60, hw: 15, hd: 11 },
  { x: 70, z: -76, hw: 10, hd:  3 },
  // Interior room walls (at world [200, 0, 0], 28×18m space)
  { x: 200, z:  9,  hw: 14, hd: 0.6 },  // south wall
  { x: 200, z: -9,  hw: 14, hd: 0.6 },  // north wall
  { x: 187, z:  0,  hw: 0.6, hd: 9  },  // west wall
  { x: 213, z:  0,  hw: 0.6, hd: 9  },  // east wall
  // Interior columns (4)
  { x: 194, z: -3,  hw: 0.45, hd: 0.45 },
  { x: 194, z:  3,  hw: 0.45, hd: 0.45 },
  { x: 206, z: -3,  hw: 0.45, hd: 0.45 },
  { x: 206, z:  3,  hw: 0.45, hd: 0.45 },
  // ── Chrome district (east branch at z≈-80) ───────────────────────────────
  { x: 42, z: -73,  hw: 28, hd: 1.5 },   // north road kerb
  { x: 42, z: -87,  hw: 28, hd: 1.5 },   // south road kerb
  { x: 68, z: -60,  hw: 16, hd: 14 },    // Chrome Works main building
  { x: 72, z: -85,  hw: 14, hd: 12 },    // Object Fabrication
  { x: 66, z: -108, hw: 18, hd: 13 },    // Material Forming Hall
  { x: 58, z: -65,  hw:  6, hd:  9 },    // Design Lab
  { x: 55, z: -120, hw: 28, hd:  2 },    // District end wall
  // ── Bedrock district (west branch at z≈-60) ──────────────────────────────
  // Branch road kerbs
  { x: -42, z: -53,  hw: 25, hd: 1.5 },
  { x: -42, z: -67,  hw: 25, hd: 1.5 },
  // South buildings (street-facing)
  { x: -62, z: -40,  hw: 9,  hd: 12 },
  { x: -60, z: -65,  hw: 8,  hd: 14 },
  { x: -65, z: -90,  hw: 10, hd: 12 },
  // North buildings
  { x: -28, z: -42,  hw: 7,  hd: 10 },
  { x: -26, z: -68,  hw: 6,  hd: 11 },
  { x: -30, z: -95,  hw: 8,  hd: 11 },
  // District end wall
  { x: -42, z: -110, hw: 35, hd: 2  },
  // ── Crimson district (west branch at z≈-120) ─────────────────────────────
  ...CRIMSON_COLLIDERS,
  // ── Glacier district (west side, z=-141 to -238) ─────────────────────────
  ...GLACIER_COLLIDERS,
  // ── Deep Violet district (south end, through plaza passage) ──────────────
  { x:  0,  z: -175, hw: 22, hd: 2  },    // north boundary
  { x: -22, z: -200, hw: 11, hd: 11 },    // Resonance chamber
  { x:  14, z: -205, hw: 13, hd:  9 },    // Dream archive
  { x: -10, z: -240, hw:  8, hd:  8 },    // Observatory
  { x:  30, z: -222, hw:  2, hd: 50 },    // East wall
  { x: -30, z: -222, hw:  2, hd: 50 },    // West wall
  { x:   0, z: -268, hw: 30, hd:  2 },    // South wall
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

/* ── Building name sign texture ── */
function makeSignTex(label: string, color: string): THREE.CanvasTexture {
  const W = 512, H = 72
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.strokeRect(3, 3, W - 6, H - 6)
  ctx.fillStyle = color
  ctx.font = "bold 24px 'Courier New', monospace"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(label.toUpperCase(), W / 2, H / 2)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ── Small wayfinding arrow sign ── */
function makeWayTex(label: string): THREE.CanvasTexture {
  const W = 320, H = 52
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#060810"
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = "#55D9D2"
  ctx.font = "bold 18px 'Courier New', monospace"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("▶  " + label.toUpperCase(), W / 2, H / 2)
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

function Building({ x, z, w, d, h, accent, side, name }: BuildingDef) {
  const facadeSign = side === "west" ? 1 : -1   // which face is street-facing

  const winCols = Math.max(2, Math.round(w / 2.8))
  const winRows = Math.max(4, Math.round(h / 3.8))
  const winTex  = useMemo(() => makeWindowTex(winCols, winRows), [winCols, winRows])
  const signTex = useMemo(() => (name ? makeSignTex(name, accent) : null), [name, accent])
  useEffect(() => () => { winTex.dispose(); signTex?.dispose() }, [winTex, signTex])

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

      {/* ── Building name sign — street-facing, above entrance ── */}
      {name && signTex && (
        <>
          {/* Sign backing plate */}
          <mesh
            position={[facadeSign * (w / 2 + 0.06), baseH + 6.4, 0]}
            rotation={[0, facadeSign * Math.PI / 2, 0]}
          >
            <boxGeometry args={[Math.min(d * 0.58, 7.5), 0.84, 0.08]} />
            <meshStandardMaterial color="#090a0d" roughness={0.9} />
          </mesh>
          {/* Emissive sign face */}
          <mesh
            position={[facadeSign * (w / 2 + 0.11), baseH + 6.4, 0]}
            rotation={[0, facadeSign * Math.PI / 2, 0]}
          >
            <planeGeometry args={[Math.min(d * 0.55, 7.2), 0.72]} />
            <meshStandardMaterial
              color="#000"
              emissive={accent}
              emissiveMap={signTex}
              emissiveIntensity={2.4}
              transparent
              opacity={1}
            />
          </mesh>
        </>
      )}
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

/* ── Parked vehicle ── */
function Vehicle({ x, z, ry = 0, accent = "#55D9D2" }: { x: number; z: number; ry?: number; accent?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {/* Main body — low slung */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.55, 1.76]} />
        <meshStandardMaterial color="#0d0e13" roughness={0.28} metalness={0.75} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.1, 0.82, 0]} castShadow>
        <boxGeometry args={[2.2, 0.42, 1.64]} />
        <meshStandardMaterial color="#0a0b0f" roughness={0.22} metalness={0.7} />
      </mesh>
      {/* Windshield */}
      <mesh position={[1.18, 0.86, 0]}>
        <boxGeometry args={[0.06, 0.38, 1.52]} />
        <meshStandardMaterial color="#1a2535" roughness={0.04} metalness={0.9} transparent opacity={0.65} />
      </mesh>
      {/* Rear glass */}
      <mesh position={[-1.0, 0.84, 0]}>
        <boxGeometry args={[0.06, 0.36, 1.52]} />
        <meshStandardMaterial color="#1a2535" roughness={0.04} metalness={0.9} transparent opacity={0.55} />
      </mesh>
      {/* Side accent stripe */}
      <mesh position={[0, 0.48, 0.89]}>
        <boxGeometry args={[3.6, 0.05, 0.04]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} roughness={0.35} />
      </mesh>
      {/* Headlights */}
      <mesh position={[2.23, 0.38, 0]}>
        <boxGeometry args={[0.04, 0.12, 1.1]} />
        <meshStandardMaterial color="#dde8ff" emissive="#dde8ff" emissiveIntensity={4} roughness={0.2} />
      </mesh>
      <pointLight position={[2.6, 0.38, 0]} color="#dde8ff" intensity={45} distance={16} decay={2} />
      {/* Tail lights */}
      <mesh position={[-2.23, 0.38, 0]}>
        <boxGeometry args={[0.04, 0.12, 1.0]} />
        <meshStandardMaterial color="#ff1500" emissive="#ff1500" emissiveIntensity={4} roughness={0.2} />
      </mesh>
      <pointLight position={[-2.6, 0.38, 0]} color="#ff2200" intensity={14} distance={7} decay={2} />
      {/* Wheels × 4 */}
      {([-1.4, 1.4] as const).map((wx, wi) =>
        ([-0.88, 0.88] as const).map((wz, wzi) => (
          <group key={`w-${wi}-${wzi}`} position={[wx, 0.2, wz]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.16, 12]} />
              <meshStandardMaterial color="#18191f" roughness={0.8} metalness={0.2} />
            </mesh>
            {/* Hub */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, wz > 0 ? 0.09 : -0.09]}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
              <meshStandardMaterial color="#C8C9C7" roughness={0.2} metalness={0.95} />
            </mesh>
          </group>
        ))
      )}
    </group>
  )
}

/* ── Bollards (instanced — 24 bollards as 1 draw call) ── */
const BOLLARD_POSITIONS: [number, number][] = []
for (const z of [-5, -25, -55, -85, -110, -135]) {
  BOLLARD_POSITIONS.push([-11.5, z], [-11.5, z - 2.5], [11.5, z], [11.5, z - 2.5])
}
function Bollards() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    BOLLARD_POSITIONS.forEach(([x, z], i) => {
      dummy.position.set(x, 0.48, z)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [dummy])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BOLLARD_POSITIONS.length]}>
      <cylinderGeometry args={[0.09, 0.12, 0.95, 8]} />
      <meshStandardMaterial color="#1e2128" roughness={0.5} metalness={0.8} />
    </instancedMesh>
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

/* ── Road markings geometry (instanced — ~109 meshes → 2 draw calls) ── */
const LANE_XS = [-7.5, -3.8, 0, 3.8, 7.5]
const LANE_Z_STEPS: number[] = []
for (let z = 5; z > -148; z -= 8) LANE_Z_STEPS.push(z - 2.5)
const LANE_COUNT = LANE_XS.length * LANE_Z_STEPS.length
const CW_COUNT = 9

function RoadMarkings() {
  const laneRef = useRef<THREE.InstancedMesh>(null!)
  const cwRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    let idx = 0
    for (const lx of LANE_XS) {
      for (const z of LANE_Z_STEPS) {
        dummy.position.set(lx, 0.002, z)
        dummy.updateMatrix()
        laneRef.current.setMatrixAt(idx++, dummy.matrix)
      }
    }
    laneRef.current.instanceMatrix.needsUpdate = true

    for (let i = -4; i <= 4; i++) {
      dummy.position.set(i * 1.9, 0.002, -130)
      dummy.updateMatrix()
      cwRef.current.setMatrixAt(i + 4, dummy.matrix)
    }
    cwRef.current.instanceMatrix.needsUpdate = true
  }, [dummy])

  return (
    <>
      <instancedMesh ref={laneRef} args={[undefined, undefined, LANE_COUNT]}>
        <boxGeometry args={[0.15, 0.01, 4.5]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.7} transparent opacity={0.45} />
      </instancedMesh>
      <instancedMesh ref={cwRef} args={[undefined, undefined, CW_COUNT]}>
        <boxGeometry args={[0.7, 0.01, 4.5]} />
        <meshStandardMaterial color="#ddd8c8" roughness={0.7} transparent opacity={0.4} />
      </instancedMesh>
    </>
  )
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

/* ── Wayfinding sign post ── */
function WayfindingSign({ x, z, label, ry = 0 }: { x: number; z: number; label: string; ry?: number }) {
  const tex = useMemo(() => makeWayTex(label), [label])
  useEffect(() => () => { tex.dispose() }, [tex])
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {/* Pole */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 3.1, 7]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.6} metalness={0.85} />
      </mesh>
      {/* Sign backing */}
      <mesh position={[0.8, 3.15, 0]}>
        <boxGeometry args={[2.5, 0.46, 0.06]} />
        <meshStandardMaterial color="#090a0e" roughness={0.85} />
      </mesh>
      {/* Sign face */}
      <mesh position={[0.8, 3.15, 0.04]}>
        <planeGeometry args={[2.4, 0.42]} />
        <meshStandardMaterial
          color="#000"
          emissive="#55D9D2"
          emissiveMap={tex}
          emissiveIntensity={1.8}
          transparent
          opacity={1}
        />
      </mesh>
    </group>
  )
}

/* ── Large COMPOUND billboard ── */
function CompoundBillboard({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  const tex = useMemo<THREE.CanvasTexture>(() => {
    const W = 1024, H = 256
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = "#97D700"
    ctx.fillRect(0, 0, W, 6)
    ctx.fillRect(0, H - 6, W, 6)
    ctx.fillStyle = "#C8C9C7"
    ctx.font = "bold 120px 'Courier New', monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("COMPOUND", W / 2, H / 2 - 14)
    ctx.fillStyle = "#97D700"
    ctx.font = "22px 'Courier New', monospace"
    ctx.fillText("DESIGN STUDIO   ·   TORONTO 2026", W / 2, H / 2 + 72)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => { tex.dispose() }, [tex])

  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 16.5, 0]} castShadow>
        <boxGeometry args={[14.4, 3.8, 0.28]} />
        <meshStandardMaterial color="#0b0c10" roughness={0.9} />
      </mesh>
      <mesh position={[0, 16.5, 0.16]}>
        <planeGeometry args={[13.8, 3.4]} />
        <meshStandardMaterial
          color="#000"
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={0.75}
          transparent
          opacity={1}
        />
      </mesh>
      <mesh position={[0, 14.8, 0.16]}>
        <boxGeometry args={[14.2, 0.1, 0.04]} />
        <meshStandardMaterial color="#97D700" emissive="#97D700" emissiveIntensity={3} roughness={0.3} />
      </mesh>
      {[-5.5, 5.5].map((lx, i) => (
        <mesh key={i} position={[lx, 8, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.16, 16, 7]} />
          <meshStandardMaterial color="#15171e" roughness={0.6} metalness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/* ── Mansion exterior ── */
function MansionExterior() {
  const winTex = useMemo(() => makeWindowTex(4, 3), [])
  useEffect(() => () => { winTex.dispose() }, [winTex])

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
  useEffect(() => () => { winTex.dispose() }, [winTex])

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

/* ── Mansion approach road + gate ── */
function MansionApproach() {
  return (
    <group>
      {/* ── Approach road surface (runs east from boulevard gap) ── */}
      <mesh position={[42, -0.01, -100]} receiveShadow>
        <boxGeometry args={[58, 0.06, 8]} />
        <meshStandardMaterial color="#0b0c11" roughness={0.24} metalness={0.08} />
      </mesh>

      {/* Centre line */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[15 + i * 5.8, 0.002, -100]} receiveShadow={false}>
          <boxGeometry args={[2.8, 0.01, 0.14]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.7} transparent opacity={0.35} />
        </mesh>
      ))}

      {/* North sidewalk */}
      <mesh position={[42, 0.08, -93.5]} receiveShadow>
        <boxGeometry args={[58, 0.16, 3]} />
        <meshStandardMaterial color="#111318" roughness={0.94} />
      </mesh>
      {/* South sidewalk */}
      <mesh position={[42, 0.08, -106.5]} receiveShadow>
        <boxGeometry args={[58, 0.16, 3]} />
        <meshStandardMaterial color="#111318" roughness={0.94} />
      </mesh>

      {/* ── Gate arch at hill perimeter (x≈44) ── */}
      {/* North pillar */}
      <mesh position={[44, 5.5, -94.5]} castShadow>
        <boxGeometry args={[1.2, 11, 1.2]} />
        <meshStandardMaterial color="#0e1114" roughness={0.88} metalness={0.06} />
      </mesh>
      {/* South pillar */}
      <mesh position={[44, 5.5, -105.5]} castShadow>
        <boxGeometry args={[1.2, 11, 1.2]} />
        <meshStandardMaterial color="#0e1114" roughness={0.88} metalness={0.06} />
      </mesh>
      {/* Lintel beam */}
      <mesh position={[44, 11.3, -100]} castShadow>
        <boxGeometry args={[1.4, 1.2, 12.2]} />
        <meshStandardMaterial color="#0b0d10" roughness={0.85} />
      </mesh>
      {/* Glacier accent strip on lintel */}
      <mesh position={[44.75, 11.5, -100]}>
        <boxGeometry args={[0.08, 0.1, 12]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={3} roughness={0.3} />
      </mesh>
      {/* Pillar caps */}
      <mesh position={[44.75, 11.8, -94.5]}>
        <boxGeometry args={[0.08, 0.1, 1.4]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={3} roughness={0.3} />
      </mesh>
      <mesh position={[44.75, 11.8, -105.5]}>
        <boxGeometry args={[0.08, 0.1, 1.4]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={3} roughness={0.3} />
      </mesh>

      {/* Gate warm glow */}
      <pointLight position={[44, 9, -100]} color="#55D9D2" intensity={35} distance={18} decay={2} />

      {/* ── Approach streetlights (2 pairs) ── */}
      {[18, 60].map(x => ([
        <group key={`ln-${x}`} position={[x, 0, -93.5]}>
          <mesh position={[0, 3.8, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.06, 7.6, 7]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.6} metalness={0.85} />
          </mesh>
          <mesh position={[0, 7.4, 0]}>
            <boxGeometry args={[0.38, 0.14, 0.22]} />
            <meshStandardMaterial color="#E6B87A" emissive="#E6B87A" emissiveIntensity={3} roughness={0.4} />
          </mesh>
          <pointLight position={[0, 7.1, 0]} color="#E6B87A" intensity={22} distance={18} decay={2} />
        </group>,
        <group key={`ls-${x}`} position={[x, 0, -106.5]}>
          <mesh position={[0, 3.8, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.06, 7.6, 7]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.6} metalness={0.85} />
          </mesh>
          <mesh position={[0, 7.4, 0]}>
            <boxGeometry args={[0.38, 0.14, 0.22]} />
            <meshStandardMaterial color="#E6B87A" emissive="#E6B87A" emissiveIntensity={3} roughness={0.4} />
          </mesh>
          <pointLight position={[0, 7.1, 0]} color="#E6B87A" intensity={22} distance={18} decay={2} />
        </group>,
      ]))}

      {/* ── COMPOUND ESTATE sign beside gate ── */}
      <mesh position={[43.8, 2.2, -91.8]}>
        <boxGeometry args={[0.08, 1.6, 3.8]} />
        <meshStandardMaterial color="#090a0d" roughness={0.9} />
      </mesh>
      <mesh position={[43.88, 2.2, -91.8]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.6, 1.4]} />
        <meshStandardMaterial
          color="#000"
          emissive="#E6B87A"
          emissiveIntensity={1.6}
          transparent
          opacity={1}
        />
      </mesh>
    </group>
  )
}

/* ── Mansion interior (world origin [200, 0, 0]) ── */
export function MansionInterior() {
  const floorTex = useMemo(() => {
    const W = 512, H = 512
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#0d0e12"
    ctx.fillRect(0, 0, W, H)
    // Subtle grid lines for polished concrete
    ctx.strokeStyle = "#13151b"
    ctx.lineWidth = 1
    for (let i = 0; i <= W; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(7, 4)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
  useEffect(() => () => { floorTex.dispose() }, [floorTex])

  return (
    <group position={[200, 0, 0]}>
      {/* ── Floor — polished concrete ── */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[28, 0.06, 18]} />
        <meshStandardMaterial color="#252830" roughness={0.22} metalness={0.1} map={floorTex} />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, 7.0, 0]}>
        <boxGeometry args={[28, 0.2, 18]} />
        <meshStandardMaterial color="#1e2028" roughness={0.92} />
      </mesh>

      {/* ── Walls ── */}
      {/* North */}
      <mesh position={[0, 3.5, -9]} castShadow receiveShadow>
        <boxGeometry args={[28, 7, 0.3]} />
        <meshStandardMaterial color="#22242e" roughness={0.88} />
      </mesh>
      {/* South (entrance) */}
      <mesh position={[0, 3.5, 9]} castShadow receiveShadow>
        <boxGeometry args={[28, 7, 0.3]} />
        <meshStandardMaterial color="#22242e" roughness={0.88} />
      </mesh>
      {/* East */}
      <mesh position={[14, 3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 7, 18]} />
        <meshStandardMaterial color="#1e2028" roughness={0.88} />
      </mesh>
      {/* West */}
      <mesh position={[-14, 3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 7, 18]} />
        <meshStandardMaterial color="#1e2028" roughness={0.88} />
      </mesh>

      {/* ── South wall: floor-to-ceiling glazing (city view) ── */}
      <mesh position={[0, 3.5, 8.84]}>
        <boxGeometry args={[24, 6.2, 0.08]} />
        <meshStandardMaterial color="#1a2535" roughness={0.04} metalness={0.9} transparent opacity={0.7} />
      </mesh>
      {/* Window warm spill from outside */}
      <mesh position={[0, 3.5, 8.8]}>
        <planeGeometry args={[23, 6]} />
        <meshStandardMaterial color="#E6B87A" emissive="#E6B87A" emissiveIntensity={0.18} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* Mullion verticals */}
      {[-9, -4.5, 0, 4.5, 9].map((lx, i) => (
        <mesh key={i} position={[lx, 3.5, 8.9]}>
          <boxGeometry args={[0.06, 6.4, 0.06]} />
          <meshStandardMaterial color="#1c2030" roughness={0.5} metalness={0.8} />
        </mesh>
      ))}

      {/* ── North wall: library shelving ── */}
      {[0.8, 2.0, 3.2, 4.4, 5.6].map((y, i) => (
        <mesh key={i} position={[0, y, -8.8]} receiveShadow>
          <boxGeometry args={[22, 0.06, 0.38]} />
          <meshStandardMaterial color="#14151a" roughness={0.85} metalness={0.1} />
        </mesh>
      ))}
      {/* Book spine emissives */}
      <mesh position={[-6, 3.6, -8.65]}>
        <boxGeometry args={[8, 0.55, 0.04]} />
        <meshStandardMaterial color="#97D700" emissive="#97D700" emissiveIntensity={0.25} roughness={0.8} />
      </mesh>
      <mesh position={[5, 2.4, -8.65]}>
        <boxGeometry args={[5, 0.45, 0.04]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={0.2} roughness={0.8} />
      </mesh>

      {/* ── Four structural columns ── */}
      {([-6, -6, 6, 6] as number[]).map((cx, i) => {
        const cz = i < 2 ? -3 : 3
        return (
          <group key={i} position={[cx, 0, cz]}>
            <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.72, 7, 0.72]} />
              <meshStandardMaterial color="#101216" roughness={0.9} metalness={0.05} />
            </mesh>
            {/* Acid base band */}
            <mesh position={[0, 0.06, 0]}>
              <boxGeometry args={[0.76, 0.12, 0.76]} />
              <meshStandardMaterial color="#97D700" emissive="#97D700" emissiveIntensity={0.8} roughness={0.4} />
            </mesh>
            {/* Chrome cap */}
            <mesh position={[0, 6.98, 0]}>
              <boxGeometry args={[0.78, 0.12, 0.78]} />
              <meshStandardMaterial color="#C8C9C7" roughness={0.25} metalness={0.9} />
            </mesh>
          </group>
        )
      })}

      {/* ── Long work table (centre) ── */}
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <boxGeometry args={[9, 0.06, 1.6]} />
        <meshStandardMaterial color="#12130f" roughness={0.75} metalness={0.08} />
      </mesh>
      {/* Table legs */}
      {([-4, -4, 4, 4] as number[]).flatMap((lx, i) => {
        const lz = i % 2 === 0 ? -0.65 : 0.65
        return (
          <mesh key={i} position={[lx, 0.36, lz]} castShadow>
            <boxGeometry args={[0.06, 0.72, 0.06]} />
            <meshStandardMaterial color="#1e2028" roughness={0.5} metalness={0.85} />
          </mesh>
        )
      })}
      {/* Pendant lights above table */}
      {[-3, 0, 3].map((lx, i) => (
        <group key={i} position={[lx, 7.0, 0]}>
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.22, 0.28, 0.28, 10]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.85} />
          </mesh>
          <mesh position={[0, -0.54, 0]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color="#E6B87A" emissive="#E6B87A" emissiveIntensity={6} roughness={0.3} />
          </mesh>
          <pointLight position={[0, -0.8, 0]} color="#E6B87A" intensity={38} distance={8} decay={2} />
        </group>
      ))}

      {/* ── Bench seating along south window ── */}
      <mesh position={[0, 0.42, 7.2]} castShadow receiveShadow>
        <boxGeometry args={[20, 0.12, 0.72]} />
        <meshStandardMaterial color="#0f1008" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.06, 7.2]}>
        <boxGeometry args={[20, 0.12, 0.08]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.25} metalness={0.9} />
      </mesh>

      {/* ── Reading nook (west end) ── */}
      {/* Low sofa */}
      <mesh position={[-11.5, 0.32, -5]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.52, 1.6]} />
        <meshStandardMaterial color="#1a0e0a" roughness={0.92} />
      </mesh>
      <mesh position={[-11.5, 0.62, -5.5]}>
        <boxGeometry args={[3.8, 0.62, 0.28]} />
        <meshStandardMaterial color="#1a0e0a" roughness={0.92} />
      </mesh>
      {/* Nook warm light */}
      <pointLight position={[-11.5, 3.5, -5]} color="#E6B87A" intensity={30} distance={7} decay={2} />
      {/* Side table */}
      <mesh position={[-10, 0.38, -3.5]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.76, 8]} />
        <meshStandardMaterial color="#111218" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* ── East wall: counter / wet bar ── */}
      <mesh position={[12.5, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.8, 8]} />
        <meshStandardMaterial color="#0e0f14" roughness={0.88} />
      </mesh>
      {/* Counter top */}
      <mesh position={[12.5, 1.82, 0]}>
        <boxGeometry args={[2.3, 0.06, 8.1]} />
        <meshStandardMaterial color="#1e2028" roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Glacier under-counter strip */}
      <mesh position={[12.6, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, 8]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={1.8} roughness={0.3} />
      </mesh>

      {/* ── UNIVERSE OF DESIGN video screen — east wall, above bar ── */}
      <group position={[13.6, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <VideoTextureScreen
          src={COMPOUND_ASSETS.video.universeOfDesign}
          width={5.4}
          height={3.04}
          emissiveIntensity={1.2}
        />
      </group>

      {/* ── Interior lighting rig ── */}
      {/* Warm ambient fill */}
      <ambientLight intensity={1.4} color="#c8a46a" />
      {/* Soft overhead diffuse — boosted to cover corners without extra lights */}
      <pointLight position={[0, 6.5, 0]} color="#f0e2c8" intensity={160} distance={32} decay={1.2} />
      {/* Glacier accent from counter */}
      <pointLight position={[13, 1, 0]} color="#55D9D2" intensity={18} distance={8} decay={2} />
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

      {/* ── Wet-road shimmer — thin specular plane above road ── */}
      <mesh position={[0, 0.004, -70]}>
        <boxGeometry args={[22, 0.001, 320]} />
        <meshStandardMaterial
          color="#1a1e2a"
          roughness={0.04}
          metalness={0.55}
          transparent
          opacity={0.38}
          depthWrite={false}
        />
      </mesh>

      {/* ── Parked vehicles ── */}
      <Vehicle x={-13.6} z={-28}  ry={Math.PI / 2} accent="#55D9D2" />
      <Vehicle x={ 13.6} z={-72}  ry={Math.PI / 2} accent="#97D700" />
      <Vehicle x={-13.6} z={-110} ry={Math.PI / 2} accent="#A74B2A" />

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
      {[-8, -40, -80, -110].flatMap(z => [
        <DrainGrate key={`dw-${z}`} x={-11.2} z={z} />,
        <DrainGrate key={`de-${z}`} x={11.2} z={z} />,
      ])}

      {/* ── Steam vents ── */}
      <SteamVent x={-10.8} z={-55} />
      <SteamVent x={10.4}  z={-90} />
      <SteamVent x={-10.6} z={-115} />

      {/* ── Bollards ── */}
      <Bollards />

      {/* ── Benches ── */}
      <Bench x={-13.5} z={-18} ry={Math.PI / 2} />
      <Bench x={13.5}  z={-30} ry={Math.PI / 2} />
      <Bench x={-13.5} z={-75} ry={Math.PI / 2} />
      <Bench x={13.5}  z={-110} ry={Math.PI / 2} />

      {/* ── Foreground buildings ── */}
      {WEST_BUILDINGS.map((b, i) => <Building key={`w${i}`} {...b} />)}
      {EAST_BUILDINGS.map((b, i) => <Building key={`e${i}`} {...b} />)}

      {/* ── Mansion approach road ── */}
      <MansionApproach />

      {/* ── Wayfinding signs ── */}
      <WayfindingSign x={-10.5} z={-12}  label="PLAZA"    ry={0} />
      <WayfindingSign x={10.5}  z={-45}  label="ARCHIVE"  ry={Math.PI} />
      <WayfindingSign x={-10.5} z={-85}  label="BEDROCK"  ry={0} />
      <WayfindingSign x={10.5}  z={-118} label="MANSION"  ry={Math.PI} />

      {/* ── COMPOUND billboard above east tower at z=-37 ── */}
      <CompoundBillboard x={22} z={-37} ry={Math.PI / 2} />

      {/* ── Central plaza ── */}
      <CentralPlaza />

      {/* ── Mansion exterior ── */}
      <MansionExterior />

      {/* ── Mansion interior (player teleports here via E key at approach road end) ── */}
      <MansionInterior />

      {/* ── Video signs ── */}
      {/* Concrete/architectural loop — east facade at mid-boulevard */}
      <VideoSign
        src="/sign-concrete.mp4"
        width={8.2} height={4.6}
        position={[17.8, 12, -75]}
        rotation={[0, -Math.PI / 2, 0]}
        intensity={1.4}
        fallback="#1a1820"
      />
      {/* Biophilic growth loop — in the AcidCanopy corridor, facing players walking south */}
      <VideoSign
        src="/sign-biophilic.mp4"
        width={6.8} height={3.8}
        position={[-17.8, 10, -125]}
        rotation={[0, Math.PI / 2, 0]}
        intensity={1.3}
        fallback="#0a1205"
      />
      {/* Glacier water loop — inside the Glacier district entrance */}
      <VideoSign
        src="/sign-water.mp4"
        width={7.4} height={4.2}
        position={[-21, 8, -158]}
        rotation={[0, 0, 0]}
        intensity={1.4}
        fallback="#041018"
      />

      {/* ── Manifest video screens ── */}
      {/* COMPOUND neon — east facade at city entrance, greets players entering the boulevard */}
      <VideoSign
        src={COMPOUND_ASSETS.video.compoundSign}
        width={9.6} height={5.4}
        position={[17.5, 14, -10]}
        rotation={[0, -Math.PI / 2, 0]}
        intensity={1.8}
        fallback="#100818"
      />
      {/* Holographic district map — west facade mid-boulevard, visible as players walk south */}
      <VideoSign
        src={COMPOUND_ASSETS.video.districtMap}
        width={7.2} height={4.05}
        position={[-17.5, 9, -52]}
        rotation={[0, Math.PI / 2, 0]}
        intensity={1.5}
        fallback="#021018"
      />
      {/* Chrome Works workshop window — west face of Chrome Works, visible from branch road */}
      <VideoSign
        src={COMPOUND_ASSETS.video.workshop}
        width={8.4} height={4.8}
        position={[55.5, 10, -62]}
        rotation={[0, -Math.PI / 2, 0]}
        intensity={1.3}
        fallback="#0f0a04"
      />
      {/* Portal — far end of Deep Violet zone, faces players approaching from north */}
      <VideoSign
        src={COMPOUND_ASSETS.video.portal}
        width={10.8} height={6.1}
        position={[0, 9, -200]}
        rotation={[0, 0, 0]}
        intensity={1.6}
        fallback="#020610"
      />

      {/* ── Acid Canopy District (biophilic corridor, main boulevard z≈-105→-148) ── */}
      <AcidCanopyDistrict />

      {/* ── Bedrock District (west branch off boulevard at z≈-60) ── */}
      <BedrockDistrict />

      {/* ── Chrome District (east branch off boulevard at z≈-80) ── */}
      <ChromeDistrict />

      {/* ── Crimson District (west branch off boulevard at z≈-120) ── */}
      <CrimsonDistrict />

      {/* ── Glacier District (west side, enter from gap at z≈-141) ── */}
      <GlacierDistrict />

      {/* ── Deep Violet District (south end through plaza passage) ── */}
      <DeepVioletDistrict />
    </group>
  )
}
