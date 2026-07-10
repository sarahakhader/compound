"use client"
import { useMemo, useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { COLORS, MAT } from "../WorldConfig"

/* ─── Canvas texture helpers ─────────────────────────────────────────────── */

function makeSteelPanelTex(): THREE.CanvasTexture {
  const W = 512, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  // Base brushed steel — cool grey
  ctx.fillStyle = "#1e2028"
  ctx.fillRect(0, 0, W, H)
  // Horizontal brush lines (brushed aluminum effect)
  for (let y = 0; y < H; y += 3) {
    const lum = 0.06 + Math.random() * 0.04
    ctx.strokeStyle = `rgba(${Math.floor(lum*255+160)},${Math.floor(lum*255+165)},${Math.floor(lum*255+172)},0.18)`
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // Panel seam lines — vertical
  ctx.strokeStyle = "rgba(0,0,0,0.55)"
  ctx.lineWidth = 1.5
  for (let x = 0; x < W; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  // Horizontal panel seams
  ctx.lineWidth = 1.2
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // Subtle rivet dots at intersections
  ctx.fillStyle = "rgba(80,85,95,0.7)"
  for (let x = 0; x < W; x += 64) {
    for (let y = 0; y < H; y += 80) {
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeConcreteFacTex(): THREE.CanvasTexture {
  const W = 512, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#1c1e24"
  ctx.fillRect(0, 0, W, H)
  // Form-board shuttering marks
  ctx.strokeStyle = "rgba(0,0,0,0.4)"
  ctx.lineWidth = 1.2
  for (let y = 0; y < H; y += 22) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // Tie-rod holes grid
  ctx.fillStyle = "rgba(10,10,14,0.7)"
  for (let x = 32; x < W; x += 64) {
    for (let y = 22; y < H; y += 44) {
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
    }
  }
  // Moisture staining — subtle cool wash
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * W
    const grd = ctx.createLinearGradient(x, 0, x + 40, H)
    grd.addColorStop(0, "rgba(20,30,40,0)")
    grd.addColorStop(0.4, "rgba(20,30,40,0.06)")
    grd.addColorStop(1, "rgba(20,30,40,0)")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeGridFloorTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#13151a"
  ctx.fillRect(0, 0, W, H)
  // Embedded steel rail lines
  ctx.strokeStyle = "#2a2e38"
  ctx.lineWidth = 3
  // Two parallel rail tracks
  for (const x of [W * 0.3, W * 0.7]) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  // Cross-sleepers
  ctx.lineWidth = 1.5
  ctx.strokeStyle = "#1c2030"
  for (let y = 0; y < H; y += 18) {
    ctx.beginPath(); ctx.moveTo(W * 0.22, y); ctx.lineTo(W * 0.78, y); ctx.stroke()
  }
  // Wet shimmer patches
  for (let i = 0; i < 4; i++) {
    const grd = ctx.createRadialGradient(Math.random()*W, Math.random()*H, 0, Math.random()*W, Math.random()*H, 40)
    grd.addColorStop(0, "rgba(40,55,80,0.18)")
    grd.addColorStop(1, "rgba(40,55,80,0)")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeSignTex(line1: string, line2?: string, accent = COLORS.chrome): THREE.CanvasTexture {
  const W = 512, H = line2 ? 100 : 64
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#09090e"
  ctx.fillRect(0, 0, W, H)
  // Brushed metal top border
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 3)
  ctx.fillRect(0, H - 3, W, 3)
  ctx.font = `bold ${line2 ? 30 : 36}px 'Courier New', monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillStyle = accent
  ctx.fillText(line1.toUpperCase(), W / 2, line2 ? H * 0.36 : H / 2)
  if (line2) {
    ctx.font = "14px 'Courier New', monospace"
    ctx.fillStyle = "#7a8090"
    ctx.fillText(line2.toUpperCase(), W / 2, H * 0.72)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeWorkshopWindowTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#080c14"
  ctx.fillRect(0, 0, W, H)
  // Interior glow — cool cyan/white
  const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.6)
  grd.addColorStop(0, "rgba(160,200,230,0.18)")
  grd.addColorStop(0.5, "rgba(80,140,180,0.08)")
  grd.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)
  // Robotic arm silhouettes — simplified geometric shapes
  ctx.fillStyle = "rgba(20,30,45,0.9)"
  // Arm 1
  ctx.fillRect(W*0.2, H*0.3, 8, H*0.5)
  ctx.fillRect(W*0.2, H*0.3, W*0.15, 6)
  ctx.fillRect(W*0.35-6, H*0.3, 6, H*0.2)
  // Arm 2
  ctx.fillRect(W*0.6, H*0.4, 8, H*0.45)
  ctx.fillRect(W*0.6, H*0.4, W*0.18, 6)
  // Occasional orange welding flash
  if (Math.random() > 0.5) {
    const weld = ctx.createRadialGradient(W*0.38, H*0.32, 0, W*0.38, H*0.32, 18)
    weld.addColorStop(0, "rgba(255,140,0,0.7)")
    weld.addColorStop(0.5, "rgba(255,100,0,0.2)")
    weld.addColorStop(1, "rgba(255,100,0,0)")
    ctx.fillStyle = weld
    ctx.fillRect(0, 0, W, H)
  }
  // Window frame grid
  ctx.strokeStyle = "rgba(60,75,95,0.6)"
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, W, H)
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ─── Ventilation tower ──────────────────────────────────────────────────── */
function VentTower({ x, z, h = 14 }: { x: number; z: number; h?: number }) {
  const ref = useRef<THREE.PointLight>(null!)
  const t = useRef(Math.random() * Math.PI * 2)
  useFrame((_, dt) => {
    t.current += dt
    if (ref.current) ref.current.intensity = 8 + Math.sin(t.current * 2.1) * 2
  })
  return (
    <group position={[x, 0, z]}>
      {/* Main shaft */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, h, 8]} />
        <meshStandardMaterial color="#1a1e28" roughness={0.22} metalness={0.92} />
      </mesh>
      {/* Top cap — louvred hood */}
      <mesh position={[0, h + 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.68, 0.35, 0.6, 8]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.18} metalness={0.95} />
      </mesh>
      {/* Louvre ring */}
      {[0, Math.PI/4, Math.PI/2, (3*Math.PI)/4, Math.PI, (5*Math.PI)/4, (3*Math.PI)/2, (7*Math.PI)/4].map((a, i) => (
        <mesh key={i} position={[Math.cos(a)*0.5, h + 0.1, Math.sin(a)*0.5]} rotation={[0, a, 0.25]}>
          <boxGeometry args={[0.08, 0.25, 0.28]} />
          <meshStandardMaterial color="#C8C9C7" roughness={0.2} metalness={0.9} />
        </mesh>
      ))}
      {/* Status beacon */}
      <mesh position={[0, h + 0.8, 0]}>
        <sphereGeometry args={[0.08, 6, 4]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={ref} position={[0, h + 0.8, 0]} color="#55D9D2" intensity={8} distance={6} decay={2} />
    </group>
  )
}

/* ─── Suspended walkway ──────────────────────────────────────────────────── */
function SuspendedWalkway({ x1, z1, x2, z2, h = 9 }: { x1: number; z1: number; x2: number; z2: number; h?: number }) {
  const dx = x2 - x1, dz = z2 - z1
  const len = Math.sqrt(dx*dx + dz*dz)
  const cx = (x1+x2)/2, cz = (z1+z2)/2
  const ry = Math.atan2(dx, dz)
  return (
    <group position={[cx, h, cz]} rotation={[0, ry, 0]}>
      {/* Deck */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[len, 0.18, 1.8]} />
        <meshStandardMaterial color="#1a1e2a" roughness={0.55} metalness={0.7} />
      </mesh>
      {/* Railing — left */}
      <mesh position={[0, 0.55, -0.9]} castShadow>
        <boxGeometry args={[len, 0.05, 0.04]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.2} metalness={0.92} />
      </mesh>
      {/* Railing — right */}
      <mesh position={[0, 0.55, 0.9]} castShadow>
        <boxGeometry args={[len, 0.05, 0.04]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.2} metalness={0.92} />
      </mesh>
      {/* Uprights */}
      {Array.from({ length: Math.ceil(len / 2.5) + 1 }, (_, i) => {
        const lx = -len/2 + i * (len / Math.ceil(len / 2.5))
        return (
          <group key={i}>
            <mesh position={[lx, 0.3, -0.9]}>
              <boxGeometry args={[0.04, 0.7, 0.04]} />
              <meshStandardMaterial color="#8a8e9a" roughness={0.3} metalness={0.88} />
            </mesh>
            <mesh position={[lx, 0.3, 0.9]}>
              <boxGeometry args={[0.04, 0.7, 0.04]} />
              <meshStandardMaterial color="#8a8e9a" roughness={0.3} metalness={0.88} />
            </mesh>
          </group>
        )
      })}
      {/* Suspension cables */}
      {[-len*0.3, 0, len*0.3].map((lx, i) => (
        <mesh key={i} position={[lx, 1.8, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 3.6, 4]} />
          <meshStandardMaterial color="#3a3e4a" roughness={0.4} metalness={0.85} />
        </mesh>
      ))}
      {/* Under-deck task light strip */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[len * 0.8, 0.04, 0.18]} />
        <meshStandardMaterial color="#d8eeff" emissive="#d8eeff" emissiveIntensity={1.2} roughness={0.4} />
      </mesh>
    </group>
  )
}

/* ─── Robotic cart ───────────────────────────────────────────────────────── */
function RoboCart({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {/* Body */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.2, 0.42, 0.8]} />
        <meshStandardMaterial color="#1a1e28" roughness={0.35} metalness={0.85} />
      </mesh>
      {/* Top surface — status panel */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.0, 0.04, 0.6]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
      {/* 4 wheels */}
      {[[-0.45, -0.32], [0.45, -0.32], [-0.45, 0.32], [0.45, 0.32]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.1, wz]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 8]} />
          <meshStandardMaterial color="#C8C9C7" roughness={0.25} metalness={0.9} />
        </mesh>
      ))}
      {/* Cargo — stacked flat blocks */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[0.9, 0.18, 0.55]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.8} />
      </mesh>
    </group>
  )
}

/* ─── Material crate stack ───────────────────────────────────────────────── */
function CrateStack({ x, z, n = 3, ry = 0 }: { x: number; z: number; n?: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[(i % 2) * 0.06 - 0.03, i * 0.62 + 0.31, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.58, 0.72]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#1c2030" : "#22262e"}
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
      ))}
      {/* Chrome corner brackets on bottom crate */}
      {[[-0.44, -0.36], [0.44, -0.36], [-0.44, 0.36], [0.44, 0.36]].map(([cx2, cz2], i) => (
        <mesh key={i} position={[cx2, 0.31, cz2]}>
          <boxGeometry args={[0.06, 0.58, 0.06]} />
          <meshStandardMaterial color="#C8C9C7" roughness={0.2} metalness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Digital fabrication display ───────────────────────────────────────── */
function FabDisplay({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  const t = useRef(0)
  const barRef = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => {
    t.current += dt
    if (barRef.current) {
      const s = 0.4 + (Math.sin(t.current * 0.8) * 0.5 + 0.5) * 0.6
      barRef.current.scale.x = s
    }
  })

  const screenTex = useMemo<THREE.CanvasTexture>(() => {
    const W = 256, H = 160
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#050810"
    ctx.fillRect(0, 0, W, H)
    // Grid overlay
    ctx.strokeStyle = "rgba(85,217,210,0.1)"
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
    // 3D object wireframe — simplified hex
    ctx.strokeStyle = "rgba(85,217,210,0.7)"
    ctx.lineWidth = 1.5
    const pts = Array.from({length: 6}, (_, i) => [
      W/2 + Math.cos(i/6*Math.PI*2)*45,
      H/2 + Math.sin(i/6*Math.PI*2)*35
    ])
    ctx.beginPath()
    pts.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py))
    ctx.closePath(); ctx.stroke()
    // Inner hex
    const pts2 = Array.from({length: 6}, (_, i) => [
      W/2 + Math.cos(i/6*Math.PI*2)*22,
      H/2 + Math.sin(i/6*Math.PI*2)*18
    ])
    ctx.beginPath()
    pts2.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py))
    ctx.closePath(); ctx.stroke()
    pts.forEach(([px, py], i) => {
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(pts2[i][0], pts2[i][1]); ctx.stroke()
    })
    // Status text
    ctx.font = "10px 'Courier New', monospace"
    ctx.fillStyle = "#55D9D2"
    ctx.fillText("FORMING UNIT 03", 12, 18)
    ctx.fillStyle = "rgba(85,217,210,0.5)"
    ctx.fillText("CYCLE: 84%", 12, 34)
    ctx.fillText("STATUS: ACTIVE", 12, H - 18)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
  useEffect(() => () => { screenTex.dispose() }, [screenTex])

  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {/* Stand */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.8, 6]} />
        <meshStandardMaterial {...MAT.darkMetal} />
      </mesh>
      {/* Screen housing */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <boxGeometry args={[0.8, 0.52, 0.06]} />
        <meshStandardMaterial color="#0d0f14" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 1.9, 0.034]}>
        <planeGeometry args={[0.72, 0.46]} />
        <meshStandardMaterial
          color="#000"
          emissiveMap={screenTex}
          emissive="#55D9D2"
          emissiveIntensity={1.1}
        />
      </mesh>
      {/* Progress bar */}
      <mesh ref={barRef} position={[0, 1.65, 0.035]}>
        <planeGeometry args={[0.6, 0.04]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={2} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, 1.9, 0.2]} color="#55D9D2" intensity={10} distance={4} decay={2} />
    </group>
  )
}

/* ─── Loading platform ───────────────────────────────────────────────────── */
function LoadingPlatform({ x, z, w = 6, d = 3, ry = 0 }: { x: number; z: number; w?: number; d?: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      {/* Raised dock */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 1.1, d]} />
        <meshStandardMaterial color="#161820" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Safety yellow edge strips */}
      {[[-w/2+0.06, 0], [w/2-0.06, 0]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 1.12, 0]}>
          <boxGeometry args={[0.12, 0.04, d]} />
          <meshStandardMaterial color="#f0c800" emissive="#f0c800" emissiveIntensity={0.6} roughness={0.6} />
        </mesh>
      ))}
      {/* Dock bumpers */}
      {[-w/2+0.35, 0, w/2-0.35].map((lx, i) => (
        <mesh key={i} position={[lx, 0.8, -d/2]}>
          <boxGeometry args={[0.22, 0.42, 0.18]} />
          <meshStandardMaterial color="#2a1a00" roughness={0.9} />
        </mesh>
      ))}
      {/* Handrail */}
      <mesh position={[0, 1.55, -d/2]}>
        <boxGeometry args={[w, 0.05, 0.04]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.22} metalness={0.92} />
      </mesh>
      {/* Railing uprights */}
      {Array.from({ length: Math.ceil(w / 1.5) + 1 }, (_, i) => (
        <mesh key={i} position={[-w/2 + i * (w/Math.ceil(w/1.5)), 1.28, -d/2]}>
          <boxGeometry args={[0.04, 0.58, 0.04]} />
          <meshStandardMaterial color="#8a8e9a" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Exhaust sculpture ──────────────────────────────────────────────────── */
function ExhaustSculpture({ x, z }: { x: number; z: number }) {
  const steamRef = useRef<THREE.Mesh>(null!)
  const t = useRef(Math.random() * 10)
  useFrame((_, dt) => {
    t.current += dt
    if (steamRef.current) {
      steamRef.current.scale.y = 0.8 + Math.sin(t.current * 1.4) * 0.3
      ;(steamRef.current.material as THREE.MeshStandardMaterial).opacity = 0.08 + Math.sin(t.current * 0.9) * 0.04
    }
  })
  return (
    <group position={[x, 0, z]}>
      {/* Base plinth */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.8, 0.44, 1.8]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Three staggered pipes */}
      {[[-0.44, 7.5], [0, 9], [0.44, 6.5]].map(([ox, h], i) => (
        <group key={i}>
          <mesh position={[ox, h/2 + 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, h, 8]} />
            <meshStandardMaterial color="#C8C9C7" roughness={0.16} metalness={0.96} />
          </mesh>
          {/* Pipe bend collar */}
          <mesh position={[ox, h + 0.44, 0]}>
            <cylinderGeometry args={[0.2, 0.12, 0.22, 8]} />
            <meshStandardMaterial color="#8a8e9a" roughness={0.22} metalness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Steam volume */}
      <mesh ref={steamRef} position={[0, 10.5, 0]}>
        <sphereGeometry args={[1.4, 7, 5]} />
        <meshStandardMaterial color="#c8d0e0" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {/* Chrome connectors */}
      {[-0.44, 0.44].map((ox, i) => (
        <mesh key={i} position={[ox/2, 0.6, 0]}>
          <boxGeometry args={[0.44, 0.1, 0.1]} />
          <meshStandardMaterial color="#C8C9C7" roughness={0.2} metalness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Chrome factory building ────────────────────────────────────────────── */
interface ChromeBuildingDef {
  x: number; z: number
  w: number; d: number; h: number
  label?: string
  labelSub?: string
  facing?: "north" | "south" | "east" | "west"
  trusses?: boolean
  glassRatio?: number  // 0–1 glazing on facade
}

function ChromeBuilding({ x, z, w, d, h, label, labelSub, facing = "east", trusses = false, glassRatio = 0.35 }: ChromeBuildingDef) {
  const facTex  = useMemo(() => { const t = makeConcreteFacTex(); t.repeat.set(w/8, h/8); return t }, [w, h])
  const steelTex = useMemo(() => { const t = makeSteelPanelTex(); t.repeat.set(w/6, h/6); return t }, [w, h])
  const winTex  = useMemo(() => makeWorkshopWindowTex(), [])
  const signTex = useMemo(() => (label ? makeSignTex(label, labelSub) : null), [label, labelSub])
  useEffect(() => () => { facTex.dispose(); steelTex.dispose(); winTex.dispose(); signTex?.dispose() }, [facTex, steelTex, winTex, signTex])

  const faceDir = { north: Math.PI, south: 0, east: Math.PI/2, west: -Math.PI/2 }
  const signRy = faceDir[facing]

  // Determine street-facing offset for sign/windows
  const offset = (facing === "east") ? w/2 + 0.02 :
                 (facing === "west") ? -(w/2 + 0.02) :
                 (facing === "south") ? d/2 + 0.02 : -(d/2 + 0.02)
  const isNS = facing === "north" || facing === "south"

  return (
    <group position={[x, 0, z]}>
      {/* ── Concrete core ── */}
      <mesh position={[0, h/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#1e2028" roughness={0.88} metalness={0.04} map={facTex} />
      </mesh>

      {/* ── Stainless steel cladding strip — street-facing upper half ── */}
      <mesh position={[
        facing === "east" ? w/2 - 0.25 : facing === "west" ? -(w/2 - 0.25) : 0,
        h * 0.65,
        facing === "south" ? d/2 - 0.25 : facing === "north" ? -(d/2 - 0.25) : 0
      ]} castShadow>
        <boxGeometry args={[
          isNS ? w : 0.5,
          h * 0.55,
          isNS ? 0.5 : d
        ]} />
        <meshStandardMaterial color="#b8bcc8" roughness={0.12} metalness={0.96} map={steelTex} />
      </mesh>

      {/* ── Workshop windows ── */}
      {Array.from({ length: Math.max(2, Math.round(w / 5)) }, (_, i) => {
        const wd = isNS ? w : d
        const wx = wd / Math.max(2, Math.round(wd / 5))
        const loff = -wd/2 + wx*(i+0.5)
        return (
          <mesh key={i} position={[
            facing === "east" ? w/2 + 0.01 : facing === "west" ? -(w/2 + 0.01) : loff,
            h * 0.38,
            facing === "south" ? d/2 + 0.01 : facing === "north" ? -(d/2 + 0.01) : loff
          ]} rotation={[0, signRy, 0]}>
            <planeGeometry args={[Math.min(wx * 0.78, 4.2), h * 0.32]} />
            <meshStandardMaterial
              color="#000"
              emissiveMap={winTex}
              emissive="#8ab4d4"
              emissiveIntensity={0.7}
              transparent
              opacity={0.92}
            />
          </mesh>
        )
      })}

      {/* ── Translucent industrial door (ground level) ── */}
      <mesh position={[
        facing === "east" ? w/2 + 0.02 : facing === "west" ? -(w/2 + 0.02) : 0,
        h * 0.13,
        facing === "south" ? d/2 + 0.02 : facing === "north" ? -(d/2 + 0.02) : 0
      ]} rotation={[0, signRy, 0]}>
        <planeGeometry args={[5.5, h * 0.22]} />
        <meshStandardMaterial
          color="#d8eeff"
          emissive="#a0c8e8"
          emissiveIntensity={0.12}
          transparent
          opacity={0.28}
          roughness={0.08}
          metalness={0.3}
        />
      </mesh>
      {/* Door frame */}
      {[[-2.77, 0], [2.77, 0]].map(([ox], i) => (
        <mesh key={i} position={[
          facing === "east" ? w/2 + 0.04 : facing === "west" ? -(w/2 + 0.04) : ox,
          h * 0.13,
          facing === "south" ? d/2 + 0.04 : facing === "north" ? -(d/2 + 0.04) : ox
        ]} rotation={[0, signRy, 0]}>
          <planeGeometry args={[0.14, h * 0.24]} />
          <meshStandardMaterial color="#C8C9C7" roughness={0.2} metalness={0.95} />
        </mesh>
      ))}

      {/* ── Exposed trusses ── */}
      {trusses && Array.from({ length: Math.ceil(w / 6) + 1 }, (_, i) => {
        const tx = -w/2 + i * (w / Math.ceil(w / 6))
        return (
          <group key={i} position={[tx, h + 0.2, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.18, d + 0.4]} />
              <meshStandardMaterial color="#C8C9C7" roughness={0.25} metalness={0.9} />
            </mesh>
            {/* Cross bracing */}
            <mesh castShadow rotation={[Math.PI/4, 0, 0]}>
              <boxGeometry args={[0.08, 0.08, d * 1.2]} />
              <meshStandardMaterial color="#8a8e9a" roughness={0.3} metalness={0.85} />
            </mesh>
          </group>
        )
      })}

      {/* ── Metal mesh screen (upper facade) ── */}
      <mesh position={[
        facing === "east" ? w/2 + 0.08 : facing === "west" ? -(w/2 + 0.08) : 0,
        h * 0.82,
        facing === "south" ? d/2 + 0.08 : facing === "north" ? -(d/2 + 0.08) : 0
      ]} rotation={[0, signRy, 0]}>
        <planeGeometry args={[isNS ? w * 0.7 : d * 0.7, h * 0.22]} />
        <meshStandardMaterial
          color="#5a6070"
          roughness={0.65}
          metalness={0.7}
          transparent
          opacity={0.4}
          depthWrite={false}
          wireframe={false}
        />
      </mesh>

      {/* ── Facade sign ── */}
      {signTex && (
        <mesh position={[
          facing === "east" ? w/2 + 0.06 : facing === "west" ? -(w/2 + 0.06) : 0,
          h * 0.74,
          facing === "south" ? d/2 + 0.06 : facing === "north" ? -(d/2 + 0.06) : 0
        ]} rotation={[0, signRy, 0]}>
          <planeGeometry args={[Math.min(w * 0.7, 12), 1.6]} />
          <meshStandardMaterial
            color="#000"
            emissiveMap={signTex}
            emissive={COLORS.chrome}
            emissiveIntensity={1.6}
            transparent opacity={1}
          />
        </mesh>
      )}

      {/* ── Roof parapet + edge trim ── */}
      <mesh position={[0, h + 0.28, 0]} castShadow>
        <boxGeometry args={[w + 0.4, 0.56, d + 0.4]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.8} />
      </mesh>
      <mesh position={[0, h + 0.58, 0]}>
        <boxGeometry args={[w + 0.5, 0.08, d + 0.5]} />
        <meshStandardMaterial color="#C8C9C7" roughness={0.18} metalness={0.95} />
      </mesh>

    </group>
  )
}

/* ─── Reflecting pool ────────────────────────────────────────────────────── */
function ReflectingPool({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  const t = useRef(0)
  const waterRef = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => {
    t.current += dt
    if (waterRef.current) {
      const m = waterRef.current.material as THREE.MeshStandardMaterial
      m.roughness = 0.03 + Math.sin(t.current * 0.7) * 0.01
    }
  })
  return (
    <group position={[x, 0, z]}>
      {/* Pool basin */}
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <boxGeometry args={[w + 0.3, 0.36, d + 0.3]} />
        <meshStandardMaterial color="#0d0f14" roughness={0.7} />
      </mesh>
      {/* Water surface */}
      <mesh ref={waterRef} position={[0, 0.01, 0]}>
        <boxGeometry args={[w, 0.04, d]} />
        <meshStandardMaterial color="#1a2840" roughness={0.03} metalness={0.65} transparent opacity={0.88} depthWrite={false} />
      </mesh>
      {/* Stainless rim */}
      {[[w/2, 0, d, 0.15], [-w/2, 0, d, 0.15], [0, d/2, w, 0.15], [0, -d/2, w, 0.15]].map(([px, pz, len, ], i) => (
        <mesh key={i} position={[i < 2 ? w/2*(i===0?1:-1) : 0, 0.05, i >= 2 ? d/2*(i===2?1:-1) : 0]}>
          <boxGeometry args={[i < 2 ? 0.15 : len+0.3, 0.14, i < 2 ? len+0.3 : 0.15]} />
          <meshStandardMaterial color="#C8C9C7" roughness={0.14} metalness={0.96} />
        </mesh>
      ))}
      {/* Underwater edge lights — cyan */}
      <pointLight position={[0, -0.08, 0]} color="#55D9D2" intensity={25} distance={Math.max(w,d) * 1.2} decay={1.6} />
    </group>
  )
}

/* ─── Chrome district colliders (exported for Player) ────────────────────── */
export const CHROME_COLLIDERS = [
  // East branch road kerbs (south branch off boulevard ~z=-80)
  { x: 42, z: -73,  hw: 28, hd: 1.5 },
  { x: 42, z: -87,  hw: 28, hd: 1.5 },
  // Chrome Works main building
  { x: 68, z: -60,  hw: 16, hd: 14 },
  // Object Fabrication block
  { x: 72, z: -85,  hw: 14, hd: 12 },
  // Material Forming Hall
  { x: 66, z: -108, hw: 18, hd: 13 },
  // Design Lab
  { x: 58, z: -65,  hw: 6,  hd: 9  },
  // District end wall
  { x: 55, z: -120, hw: 28, hd: 2  },
]

/* ─── ChromeDistrict — main export ──────────────────────────────────────── */
export function ChromeDistrict() {
  const floorTex = useMemo(() => {
    const t = makeGridFloorTex(); t.repeat.set(6, 6); return t
  }, [])
  useEffect(() => () => { floorTex.dispose() }, [floorTex])

  return (
    <group>
      {/* ── South branch road off boulevard (z≈-80 corridor going east) ── */}
      {/* NOTE: east wall already has gap at z=-93…-107 for mansion approach.
          Chrome branch uses the road at x=18…75, z=-73…-87 */}
      <mesh position={[46, -0.01, -80]} receiveShadow>
        <boxGeometry args={[56, 0.06, 12]} />
        <meshStandardMaterial {...MAT.asphalt} />
      </mesh>
      {/* Wet shimmer */}
      <mesh position={[46, 0.003, -80]}>
        <boxGeometry args={[56, 0.001, 12]} />
        <meshStandardMaterial color="#1a2030" roughness={0.03} metalness={0.6} transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {/* ── District ground — precision concrete ── */}
      <mesh position={[72, -0.006, -88]} receiveShadow>
        <boxGeometry args={[46, 0.05, 56]} />
        <meshStandardMaterial color="#141619" roughness={0.82} metalness={0.06} map={floorTex} />
      </mesh>

      {/* ── Embedded steel rail runs ── */}
      {[[-6, 0], [0, 0], [6, 0]].map(([oz], i) => (
        <mesh key={i} position={[66, 0.015, -88 + oz]} receiveShadow>
          <boxGeometry args={[40, 0.04, 0.14]} />
          <meshStandardMaterial color="#3a3e4a" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}

      {/* ── Reflecting pool ── */}
      <ReflectingPool x={50} z={-80} w={8} d={6} />

      {/* ── Chrome Works — main building ── */}
      <ChromeBuilding
        x={70} z={-62} w={28} d={22} h={28}
        label="CHROME WORKS"
        labelSub="COMPOUND INDUSTRIAL DESIGN"
        facing="west"
        trusses
        glassRatio={0.42}
      />

      {/* ── Object Fabrication ── */}
      <ChromeBuilding
        x={74} z={-88} w={24} d={20} h={22}
        label="OBJECT FABRICATION"
        facing="west"
        trusses
      />

      {/* ── Material Forming Hall ── */}
      <ChromeBuilding
        x={68} z={-110} w={30} d={22} h={18}
        label="MATERIAL FORMING HALL"
        facing="west"
      />

      {/* ── Modular design lab (smaller) ── */}
      <ChromeBuilding
        x={52} z={-67} w={10} d={14} h={14}
        label="DESIGN LAB"
        facing="south"
      />

      {/* ── Suspended walkways between buildings ── */}
      <SuspendedWalkway x1={56} z1={-62} x2={56} z2={-78} h={10} />
      <SuspendedWalkway x1={64} z1={-78} x2={64} z2={-98} h={9} />

      {/* ── Ventilation towers ── */}
      <VentTower x={62} z={-55} h={16} />
      <VentTower x={84} z={-72} h={14} />
      <VentTower x={80} z={-100} h={18} />
      <VentTower x={54} z={-106} h={13} />

      {/* ── Exhaust sculptures ── */}
      <ExhaustSculpture x={48} z={-64} />
      <ExhaustSculpture x={58} z={-98} />

      {/* ── Loading platforms ── */}
      <LoadingPlatform x={56} z={-72} w={7} d={3.5} ry={Math.PI/2} />
      <LoadingPlatform x={60} z={-93} w={8} d={3.5} ry={Math.PI/2} />
      <LoadingPlatform x={54} z={-112} w={6} d={3.2} ry={Math.PI/2} />

      {/* ── Robotic carts (parked at platforms) ── */}
      <RoboCart x={58} z={-70} ry={0} />
      <RoboCart x={60} z={-91} ry={Math.PI} />
      <RoboCart x={52} z={-110} ry={Math.PI/2} />

      {/* ── Crate stacks ── */}
      <CrateStack x={52} z={-78} n={4} ry={0.3} />
      <CrateStack x={55} z={-79.5} n={3} ry={0} />
      <CrateStack x={50} z={-96} n={5} />
      <CrateStack x={66} z={-104} n={3} ry={0.15} />

      {/* ── Digital fabrication displays ── */}
      <FabDisplay x={47} z={-76} ry={-Math.PI/2} />
      <FabDisplay x={47} z={-84} ry={-Math.PI/2} />
      <FabDisplay x={54} z={-100} ry={Math.PI/2} />

      {/* ── District lighting — cool white + cyan task lights ── */}
      {[-65, -80, -95, -110].map((z, i) => (
        <group key={i}>
          {/* North lamp */}
          <group position={[48, 0, z]}>
            <mesh position={[0, 5.5, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.065, 11, 7]} />
              <meshStandardMaterial {...MAT.darkMetal} />
            </mesh>
            {/* Arm */}
            <mesh position={[0.8, 10.6, 0]}>
              <boxGeometry args={[1.6, 0.05, 0.05]} />
              <meshStandardMaterial {...MAT.darkMetal} />
            </mesh>
            {/* Luminaire */}
            <mesh position={[1.6, 10.5, 0]}>
              <boxGeometry args={[0.4, 0.1, 0.24]} />
              <meshStandardMaterial color="#e8f4ff" emissive="#e8f4ff" emissiveIntensity={4} />
            </mesh>
            <pointLight position={[1.6, 10.2, 0]} color="#e0eeff" intensity={40} distance={22} decay={2} />
          </group>
        </group>
      ))}

      {/* ── Welding flash ambient ── */}
      <pointLight position={[72, 4, -88]} color="#ff7700" intensity={22} distance={18} decay={2} />

      {/* ── Fine rain particles ── (static mist volume) */}
      <mesh position={[65, 12, -85]}>
        <boxGeometry args={[50, 24, 50]} />
        <meshStandardMaterial color="#c0ccd8" transparent opacity={0.015} depthWrite={false} />
      </mesh>

      {/* ── Low cloud ceiling ── */}
      <mesh position={[65, 32, -85]}>
        <boxGeometry args={[70, 8, 70]} />
        <meshStandardMaterial color="#1a1e24" transparent opacity={0.55} depthWrite={false} />
      </mesh>

      {/* Master fill — limited radius so it doesn't bleed globally */}
      <pointLight position={[65, 20, -85]} color="#d8eeff" intensity={55} distance={80} decay={1.2} />
    </group>
  )
}
