"use client"
import { useMemo, useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { COLORS, MAT } from "../WorldConfig"

/* ─── Canvas texture helpers ─────────────────────────────────────────────── */

function makePlumConcreteTex(): THREE.CanvasTexture {
  const W = 512, H = 512
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  // Deep plum concrete base
  ctx.fillStyle = "#0e0818"
  ctx.fillRect(0, 0, W, H)
  // Horizontal form-board marks
  ctx.strokeStyle = "rgba(0,0,0,0.55)"
  ctx.lineWidth = 1.5
  for (let y = 0; y < H; y += 26) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }
  // Tie-rod holes
  ctx.fillStyle = "rgba(5,2,12,0.8)"
  for (let x = 42; x < W; x += 84) {
    for (let y = 26; y < H; y += 52) {
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill()
    }
  }
  // Subtle violet mineral wash
  for (let i = 0; i < 6; i++) {
    const grd = ctx.createRadialGradient(
      Math.random()*W, Math.random()*H, 0,
      Math.random()*W, Math.random()*H, 140
    )
    grd.addColorStop(0, "rgba(43,21,63,0.14)")
    grd.addColorStop(1, "rgba(43,21,63,0)")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeBlackStoneTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#060508"
  ctx.fillRect(0, 0, W, H)
  // Mineral grain
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * W, y = Math.random() * H
    const lum = Math.random() * 0.07
    ctx.fillStyle = `rgba(${Math.floor(lum*80+8)},${Math.floor(lum*60+6)},${Math.floor(lum*100+10)},0.5)`
    ctx.beginPath(); ctx.arc(x, y, 0.6 + Math.random(), 0, Math.PI * 2); ctx.fill()
  }
  // Cleavage lines
  ctx.strokeStyle = "rgba(0,0,0,0.7)"
  ctx.lineWidth = 0.8
  for (let i = 0; i < 20; i++) {
    const x0 = Math.random()*W, y0 = Math.random()*H
    ctx.beginPath(); ctx.moveTo(x0, y0)
    ctx.lineTo(x0 + (Math.random()-0.5)*120, y0 + (Math.random()-0.5)*120)
    ctx.stroke()
  }
  // Wet sheen patches
  for (let i = 0; i < 3; i++) {
    const grd = ctx.createRadialGradient(Math.random()*W, Math.random()*H, 0, Math.random()*W, Math.random()*H, 60)
    grd.addColorStop(0, "rgba(80,60,120,0.12)")
    grd.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeWetStoneTex(): THREE.CanvasTexture {
  const W = 256, H = 256
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#0a080e"
  ctx.fillRect(0, 0, W, H)
  // Large irregular paving slabs
  ctx.strokeStyle = "rgba(0,0,0,0.7)"
  ctx.lineWidth = 2
  const slabs = [[0,0,120,100],[120,0,136,100],[0,100,80,156],[80,100,176,80],[0,156,80,100],[80,180,176,76],[0,256,256,0]]
  for (let x = 0; x < W; x += 60 + Math.random()*40) {
    for (let y = 0; y < H; y += 50 + Math.random()*30) {
      ctx.strokeRect(x + Math.random()*8-4, y + Math.random()*8-4, 55+Math.random()*20, 45+Math.random()*20)
    }
  }
  // Violet moonlight reflection pools
  for (let i = 0; i < 5; i++) {
    const grd = ctx.createRadialGradient(Math.random()*W, Math.random()*H, 0, Math.random()*W, Math.random()*H, 50)
    grd.addColorStop(0, "rgba(80,50,140,0.22)")
    grd.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, W, H)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeSignTex(line1: string, line2?: string, color = COLORS.deepViolet): THREE.CanvasTexture {
  const W = 512, H = line2 ? 110 : 72
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#050310"
  ctx.fillRect(0, 0, W, H)
  // Engraved top/bottom lines
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(18, 8); ctx.lineTo(W-18, 8); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(18, H-8); ctx.lineTo(W-18, H-8); ctx.stroke()
  ctx.font = `bold ${line2 ? 32 : 38}px 'Courier New', monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 8
  ctx.fillText(line1.toUpperCase(), W/2, line2 ? H*0.36 : H/2)
  if (line2) {
    ctx.shadowBlur = 0
    ctx.font = "15px 'Courier New', monospace"
    ctx.fillStyle = "#5a3870"
    ctx.fillText(line2.toUpperCase(), W/2, H*0.76)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* ─── Atmospheric particles ─────────────────────────────────────────────── */
function VioletParticles({ x, z }: { x: number; z: number }) {
  const count = 180
  const t = useRef(0)
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const offsets = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 60,
      y: Math.random() * 22,
      z: (Math.random() - 0.5) * 60,
      speed: 0.06 + Math.random() * 0.1,
      phase: Math.random() * Math.PI * 2,
      amp: 0.4 + Math.random() * 0.8,
    })), [])

  useFrame((_, dt) => {
    t.current += dt
    offsets.forEach((o, i) => {
      dummy.position.set(
        x + o.x + Math.sin(t.current * o.speed + o.phase) * o.amp,
        o.y + Math.sin(t.current * o.speed * 1.3 + o.phase) * 0.5,
        z + o.z + Math.cos(t.current * o.speed * 0.9 + o.phase) * o.amp
      )
      const s = 0.04 + Math.sin(t.current * o.speed * 2 + o.phase) * 0.015
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshStandardMaterial
        color={COLORS.deepViolet}
        emissive={COLORS.deepViolet}
        emissiveIntensity={3}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

/* ─── Sound reactive monolith ────────────────────────────────────────────── */
function SoundMonolith({ x, z, h = 12 }: { x: number; z: number; h?: number }) {
  const t = useRef(0)
  const glowRef = useRef<THREE.PointLight>(null!)
  const rippleRef = useRef<THREE.Mesh>(null!)
  const stoneTex = useMemo(() => makeBlackStoneTex(), [])
  useEffect(() => () => { stoneTex.dispose() }, [stoneTex])

  useFrame((_, dt) => {
    t.current += dt
    // Subtle surface resonance — slow wave
    const pulse = 0.8 + Math.sin(t.current * 0.6) * 0.1 + Math.sin(t.current * 1.7) * 0.06
    if (glowRef.current) glowRef.current.intensity = 14 * pulse
    if (rippleRef.current) {
      rippleRef.current.scale.setScalar(1 + Math.sin(t.current * 0.5) * 0.04)
      ;(rippleRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.12 + Math.sin(t.current * 0.5) * 0.05
    }
  })

  return (
    <group position={[x, 0, z]}>
      {/* Base plinth */}
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.2, 0.6, 3.2]} />
        <meshStandardMaterial color="#080608" roughness={0.85} metalness={0.1} map={stoneTex} />
      </mesh>
      {/* Main monolith shaft */}
      <mesh position={[0, h/2 + 0.6, 0]} castShadow>
        <boxGeometry args={[1.8, h, 1.2]} />
        <meshStandardMaterial color="#0a0710" roughness={0.62} metalness={0.18} map={stoneTex} />
      </mesh>
      {/* Carved vertical grooves (sound channels) */}
      {[-0.55, 0, 0.55].map((ox, i) => (
        <mesh key={i} position={[ox, h/2 + 0.6, -0.62]}>
          <boxGeometry args={[0.06, h * 0.9, 0.02]} />
          <meshStandardMaterial color={COLORS.deepViolet} emissive={COLORS.deepViolet} emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Resonance ring — circular cross section */}
      <mesh position={[0, h * 0.62 + 0.6, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[1.4, 0.06, 8, 32]} />
        <meshStandardMaterial color="#1a0a28" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Ripple disc on base */}
      <mesh ref={rippleRef} position={[0, 0.62, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[1.4, 3.5, 48]} />
        <meshStandardMaterial
          color={COLORS.deepViolet}
          transparent opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner glow */}
      <pointLight ref={glowRef} position={[0, h * 0.5 + 0.6, 0]} color={COLORS.deepViolet} intensity={14} distance={18} decay={2} />
      {/* Crown light */}
      <pointLight position={[0, h + 0.8, 0]} color="#8844cc" intensity={8} distance={10} decay={2} />
    </group>
  )
}

/* ─── Resonance chamber (cylinder) ──────────────────────────────────────── */
function ResonanceChamber({ x, z, r = 10, h = 14 }: { x: number; z: number; r?: number; h?: number }) {
  const plumTex = useMemo(() => { const t = makePlumConcreteTex(); t.repeat.set(4, 3); return t }, [])
  const signTex = useMemo(() => makeSignTex("RESONANCE HALL", "ACOUSTIC SANCTUARY"), [])
  useEffect(() => () => { plumTex.dispose(); signTex.dispose() }, [plumTex, signTex])

  return (
    <group position={[x, 0, z]}>
      {/* Main cylinder */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r, r + 0.4, h, 24, 1, true]} />
        <meshStandardMaterial color="#0e0818" roughness={0.88} metalness={0.04} map={plumTex} side={THREE.DoubleSide} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, h/2, 0]} castShadow>
        <cylinderGeometry args={[r + 0.2, r, 0.5, 24]} />
        <meshStandardMaterial color="#0a0614" roughness={0.85} />
      </mesh>
      {/* Acoustic panels — inset rectangular recesses around the circumference */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const px = Math.cos(angle) * (r - 0.2)
        const pz = Math.sin(angle) * (r - 0.2)
        return (
          <mesh key={i} position={[px, h*0.38, pz]} rotation={[0, angle, 0]}>
            <planeGeometry args={[1.8, h * 0.55]} />
            <meshStandardMaterial color="#120920" roughness={0.95} side={THREE.FrontSide} />
          </mesh>
        )
      })}
      {/* Entrance arch */}
      <mesh position={[r + 0.01, h * 0.22, 0]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[4.5, h * 0.42]} />
        <meshStandardMaterial color="#06040c" transparent opacity={0.92} />
      </mesh>
      {/* Sign */}
      <mesh position={[r + 0.08, h * 0.72, 0]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[6.5, 1.4]} />
        <meshStandardMaterial
          color="#000"
          emissiveMap={signTex}
          emissive={COLORS.deepViolet}
          emissiveIntensity={1.4}
        />
      </mesh>
      {/* Interior warm glow */}
      <pointLight position={[0, h * 0.35, 0]} color="#c8a0ff" intensity={30} distance={r * 2.2} decay={1.8} />
      <pointLight position={[0, h * 0.1, 0]} color="#d0805a" intensity={12} distance={8} decay={2} />
    </group>
  )
}

/* ─── Dream Archive building ─────────────────────────────────────────────── */
function DreamArchive({ x, z }: { x: number; z: number }) {
  const plumTex = useMemo(() => { const t = makePlumConcreteTex(); t.repeat.set(5, 3); return t }, [])
  const stoneTex = useMemo(() => makeBlackStoneTex(), [])
  const signTex  = useMemo(() => makeSignTex("DREAM ARCHIVE", "COMPOUND · RESEARCH"), [])
  const unseen   = useMemo(() => makeSignTex("THE UNSEEN MATERIAL"), [])
  useEffect(() => () => { plumTex.dispose(); stoneTex.dispose(); signTex.dispose(); unseen.dispose() }, [plumTex, stoneTex, signTex, unseen])

  // Light well animated glow
  const wellRef = useRef<THREE.PointLight>(null!)
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt
    if (wellRef.current) wellRef.current.intensity = 18 + Math.sin(t.current * 0.3) * 5
  })

  return (
    <group position={[x, 0, z]}>
      {/* Base — heavy stone plinth */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[26, 1.0, 18]} />
        <meshStandardMaterial color="#080610" roughness={0.9} metalness={0.05} map={stoneTex} />
      </mesh>
      {/* Main volume */}
      <mesh position={[0, 9, 0]} castShadow receiveShadow>
        <boxGeometry args={[24, 16, 16]} />
        <meshStandardMaterial color="#0e0818" roughness={0.87} metalness={0.03} map={plumTex} />
      </mesh>
      {/* Deep vertical light well — carved channel */}
      <mesh position={[6, 11, 0]} castShadow>
        <boxGeometry args={[2.2, 20, 2.2]} />
        <meshStandardMaterial color="#05030e" roughness={0.9} />
      </mesh>
      {/* Light well glow at base */}
      <pointLight ref={wellRef} position={[6, 2, 0]} color="#a060ff" intensity={18} distance={14} decay={2} />
      {/* Light well narrow opening at top */}
      <mesh position={[6, 17.4, 0]}>
        <boxGeometry args={[2.4, 0.4, 2.4]} />
        <meshStandardMaterial color="#c080ff" emissive="#c080ff" emissiveIntensity={2} />
      </mesh>

      {/* Stepped entrance recession */}
      <mesh position={[-12.1, 4.5, 0]} castShadow>
        <boxGeometry args={[0.5, 8, 6]} />
        <meshStandardMaterial color="#060410" roughness={0.95} />
      </mesh>
      {/* Circular window */}
      <mesh position={[-12.05, 12, 4]}>
        <circleGeometry args={[1.4, 24]} />
        <meshStandardMaterial color="#c0a0ff" emissive="#c0a0ff" emissiveIntensity={0.5} transparent opacity={0.7} />
      </mesh>
      {/* Circular window 2 */}
      <mesh position={[-12.05, 12, -4]}>
        <circleGeometry args={[1.0, 24]} />
        <meshStandardMaterial color="#d8b0ff" emissive="#d8b0ff" emissiveIntensity={0.4} transparent opacity={0.6} />
      </mesh>

      {/* Facade sign */}
      <mesh position={[-12.06, 8, 0]}>
        <planeGeometry args={[9, 1.4]} />
        <meshStandardMaterial
          color="#000"
          emissiveMap={signTex}
          emissive={COLORS.deepViolet}
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* THE UNSEEN MATERIAL secondary sign */}
      <mesh position={[-12.06, 14.5, 0]}>
        <planeGeometry args={[7, 0.9]} />
        <meshStandardMaterial
          color="#000"
          emissiveMap={unseen}
          emissive="#8855aa"
          emissiveIntensity={1.0}
        />
      </mesh>

      {/* Suspended metallic sculpture above entrance */}
      <mesh position={[-12, 14, 0]} castShadow>
        <torusKnotGeometry args={[0.9, 0.12, 80, 8, 2, 3]} />
        <meshStandardMaterial color="#9070c0" roughness={0.08} metalness={0.95} />
      </mesh>

      {/* Roof terrace parapet */}
      <mesh position={[0, 17.3, 0]} castShadow>
        <boxGeometry args={[24.4, 0.6, 16.4]} />
        <meshStandardMaterial color="#0a0614" roughness={0.85} />
      </mesh>

      {/* Interior candle-warmth glow */}
      <pointLight position={[-4, 5, 0]} color="#e0c080" intensity={18} distance={14} decay={2} />
    </group>
  )
}

/* ─── Listening garden ───────────────────────────────────────────────────── */
function ListeningGarden({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Circular sunken courtyard */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <cylinderGeometry args={[9.5, 9.8, 0.44, 32]} />
        <meshStandardMaterial color="#080610" roughness={0.9} />
      </mesh>
      {/* Paving surface */}
      <mesh position={[0, -0.0, 0]} receiveShadow>
        <cylinderGeometry args={[9.2, 9.2, 0.04, 32]} />
        <meshStandardMaterial color="#0a0814" roughness={0.65} metalness={0.08} />
      </mesh>
      {/* Wet moonlight sheen */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[9.0, 9.0, 0.02, 32]} />
        <meshStandardMaterial color="#3020604" roughness={0.04} metalness={0.5} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {/* Stepped rim — 3 concentric rings */}
      {[10.2, 11.6, 13.0].map((r, i) => (
        <mesh key={i} position={[0, i * 0.22, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[r, r + 0.25, 0.38, 32, 1, true]} />
          <meshStandardMaterial color="#0c0918" roughness={0.85} side={THREE.BackSide} />
        </mesh>
      ))}
      {/* Rim step surfaces */}
      {[10.2, 11.6, 13.0].map((r, i) => (
        <mesh key={i} position={[0, i * 0.22 + 0.18, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[r, r + 0.4, 32]} />
          <meshStandardMaterial color="#100d1c" roughness={0.88} />
        </mesh>
      ))}
      {/* Central reflecting pool */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.06, 24]} />
        <meshStandardMaterial color="#14083a" roughness={0.02} metalness={0.6} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <pointLight position={[0, -0.1, 0]} color="#6030cc" intensity={20} distance={10} decay={2} />
      {/* Sculptural seating stones — 5 around the pool */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2
        const sr = 5.2
        return (
          <mesh key={i} position={[Math.cos(angle)*sr, 0.24, Math.sin(angle)*sr]} rotation={[0, angle, 0.06]} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.44, 0.72]} />
            <meshStandardMaterial color="#0a0812" roughness={0.9} />
          </mesh>
        )
      })}
      {/* Low amber garden lights — emissive only, single fill light replaces 8 individual */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const lr = 7.8
        return (
          <group key={i} position={[Math.cos(angle)*lr, 0, Math.sin(angle)*lr]}>
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 0.44, 6]} />
              <meshStandardMaterial color="#1a0e06" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.1, 6, 4]} />
              <meshStandardMaterial color="#e0c080" emissive="#e0c080" emissiveIntensity={4} />
            </mesh>
          </group>
        )
      })}
      <pointLight position={[0, 1, 0]} color="#e0c080" intensity={22} distance={14} decay={1.8} />
    </group>
  )
}

/* ─── Observatory dome ───────────────────────────────────────────────────── */
function Observatory({ x, z }: { x: number; z: number }) {
  const t = useRef(0)
  const beamRef = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => {
    t.current += dt
    if (beamRef.current) {
      beamRef.current.rotation.y = t.current * 0.08
      ;(beamRef.current.material as THREE.MeshStandardMaterial).opacity = 0.06 + Math.sin(t.current * 0.4) * 0.02
    }
  })
  return (
    <group position={[x, 0, z]}>
      {/* Cylindrical drum */}
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[7, 7.4, 10, 20]} />
        <meshStandardMaterial color="#0e0818" roughness={0.86} metalness={0.05} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 10.5, 0]} castShadow>
        <sphereGeometry args={[7.2, 20, 12, 0, Math.PI*2, 0, Math.PI/2]} />
        <meshStandardMaterial color="#0a0616" roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Dome aperture slit */}
      <mesh position={[0, 13.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.8, 4, 14.5]} />
        <meshStandardMaterial color="#000" transparent opacity={0.98} />
      </mesh>
      {/* Celestial ring — equatorial band */}
      <mesh position={[0, 10.5, 0]}>
        <torusGeometry args={[7.3, 0.18, 8, 36]} />
        <meshStandardMaterial color="#3a2060" roughness={0.25} metalness={0.9} />
      </mesh>
      {/* Rotating light beam */}
      <mesh ref={beamRef} position={[0, 14, 0]}>
        <coneGeometry args={[0.04, 22, 4]} />
        <meshStandardMaterial color="#c0a0ff" emissive="#c0a0ff" emissiveIntensity={2} transparent opacity={0.06} depthWrite={false} />
      </mesh>
      {/* Entrance */}
      <mesh position={[7.05, 3.2, 0]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[3, 5.8]} />
        <meshStandardMaterial color="#06040c" transparent opacity={0.95} />
      </mesh>
      <pointLight position={[0, 5, 0]} color="#c080ff" intensity={22} distance={18} decay={2} />
      <pointLight position={[0, 13, 0]} color="#a060ff" intensity={12} distance={10} decay={2} />
    </group>
  )
}

/* ─── Suspended metallic sculpture ──────────────────────────────────────── */
function HangingSculpture({ x, z, h = 12 }: { x: number; z: number; h?: number }) {
  const t = useRef(Math.random() * Math.PI * 2)
  const groupRef = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    t.current += dt * 0.08
    if (groupRef.current) {
      groupRef.current.rotation.y = t.current
    }
  })
  return (
    <group position={[x, 0, z]}>
      {/* Vertical cable mast */}
      <mesh position={[0, h + 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 3, 5]} />
        <meshStandardMaterial color="#1a1228" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Cable wires */}
      {[-0.5, 0, 0.5].map((ox, i) => (
        <mesh key={i} position={[ox, h * 0.6 + 1.5, 0]}>
          <cylinderGeometry args={[0.015, 0.015, h * 0.7, 4]} />
          <meshStandardMaterial color="#3a2860" roughness={0.4} metalness={0.85} />
        </mesh>
      ))}
      {/* Sculpture body */}
      <group ref={groupRef} position={[0, h * 0.48 + 1.5, 0]}>
        {/* Orbital rings */}
        {[0, Math.PI/3, (2*Math.PI)/3].map((ry, i) => (
          <mesh key={i} rotation={[Math.PI/4, ry, 0]}>
            <torusGeometry args={[2.2, 0.055, 8, 32]} />
            <meshStandardMaterial color="#c8c0e0" roughness={0.08} metalness={0.97} />
          </mesh>
        ))}
        {/* Core sphere */}
        <mesh>
          <sphereGeometry args={[0.6, 12, 8]} />
          <meshStandardMaterial color={COLORS.deepViolet} roughness={0.06} metalness={0.98} />
        </mesh>
      </group>
    </group>
  )
}

/* ─── Deep Violet district colliders (for Player.tsx) ────────────────────── */
export const DEEP_VIOLET_COLLIDERS = [
  // Access path from plaza (center corridor, x: -8 to 8)
  // Stepped entry plaza
  { x: 0, z: -175, hw: 22, hd: 2 },       // north boundary of DV zone
  // Resonance chamber
  { x: -22, z: -200, hw: 11, hd: 11 },
  // Dream archive
  { x: 14,  z: -205, hw: 13, hd: 9  },
  // Observatory
  { x: -10, z: -240, hw: 8,  hd: 8  },
  // District south wall
  { x: 0,   z: -268, hw: 30, hd: 2  },
  // East wall
  { x: 30,  z: -222, hw: 2,  hd: 50 },
  // West wall
  { x: -30, z: -222, hw: 2,  hd: 50 },
]

/* ─── DeepVioletDistrict — main export ───────────────────────────────────── */
export function DeepVioletDistrict() {
  const wetTex   = useMemo(() => { const t = makeWetStoneTex(); t.repeat.set(8, 8); return t }, [])
  const stoneTex = useMemo(() => makeBlackStoneTex(), [])
  const plumTex  = useMemo(() => { const t = makePlumConcreteTex(); t.repeat.set(4, 2); return t }, [])
  const dvSign   = useMemo(() => makeSignTex("DEEP VIOLET", "COMPOUND · SONIC RESEARCH"), [])
  useEffect(() => () => { wetTex.dispose(); stoneTex.dispose(); plumTex.dispose(); dvSign.dispose() }, [wetTex, stoneTex, plumTex, dvSign])

  return (
    <group>
      {/* ── Atmospheric particles ── */}
      <VioletParticles x={0} z={-220} />

      {/* ── Wet stone ground ── */}
      <mesh position={[0, -0.01, -222]} receiveShadow>
        <boxGeometry args={[60, 0.05, 98]} />
        <meshStandardMaterial color="#080610" roughness={0.68} metalness={0.08} map={wetTex} />
      </mesh>
      {/* Moonlit shimmer layer */}
      <mesh position={[0, 0.002, -222]}>
        <boxGeometry args={[60, 0.002, 98]} />
        <meshStandardMaterial color="#2a1860" roughness={0.04} metalness={0.55} transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* ── Access path from central plaza ── */}
      {/* Splits the plaza rim wall at x: -10 to 10 */}
      <mesh position={[0, 0, -159]} receiveShadow>
        <boxGeometry args={[20, 0.05, 14]} />
        <meshStandardMaterial color="#080610" roughness={0.7} metalness={0.06} />
      </mesh>
      {/* Path lit with ground-flush violet markers */}
      {[-168, -172, -176, -180].map((pz, i) => (
        <group key={i}>
          <mesh position={[-5, 0.01, pz]}>
            <boxGeometry args={[0.4, 0.03, 0.4]} />
            <meshStandardMaterial color={COLORS.deepViolet} emissive={COLORS.deepViolet} emissiveIntensity={3} />
          </mesh>
          <mesh position={[5, 0.01, pz]}>
            <boxGeometry args={[0.4, 0.03, 0.4]} />
            <meshStandardMaterial color={COLORS.deepViolet} emissive={COLORS.deepViolet} emissiveIntensity={3} />
          </mesh>
        </group>
      ))}

      {/* ── District entrance gate ── */}
      <group position={[0, 0, -184]}>
        {/* Two monolith gate posts */}
        {[-8, 8].map((ox, i) => (
          <mesh key={i} position={[ox, 9, 0]} castShadow>
            <boxGeometry args={[1.6, 18, 1.6]} />
            <meshStandardMaterial color="#06040c" roughness={0.7} metalness={0.12} map={stoneTex} />
          </mesh>
        ))}
        {/* Lintel */}
        <mesh position={[0, 18.4, 0]} castShadow>
          <boxGeometry args={[18.4, 0.8, 1.6]} />
          <meshStandardMaterial color="#0a0814" roughness={0.8} />
        </mesh>
        {/* DEEP VIOLET sign on lintel */}
        <mesh position={[0, 18.4, 0.82]}>
          <planeGeometry args={[12, 0.7]} />
          <meshStandardMaterial
            color="#000"
            emissiveMap={dvSign}
            emissive={COLORS.deepViolet}
            emissiveIntensity={1.8}
          />
        </mesh>
        {/* Gate light */}
        <pointLight position={[0, 17, 0]} color={COLORS.deepViolet} intensity={20} distance={16} decay={2} />
      </group>

      {/* ── DEEP VIOLET sign monolith (district marker) ── */}
      <group position={[0, 0, -190]}>
        <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[10, 7, 1.0]} />
          <meshStandardMaterial color="#060408" roughness={0.88} metalness={0.08} map={stoneTex} />
        </mesh>
        <mesh position={[0, 3.5, 0.52]}>
          <planeGeometry args={[8.5, 5.8]} />
          <meshStandardMaterial
            color="#000"
            emissiveMap={dvSign}
            emissive={COLORS.deepViolet}
            emissiveIntensity={2.0}
          />
        </mesh>
      </group>

      {/* ── Sound monolith — central focal piece ── */}
      <SoundMonolith x={0} z={-210} h={16} />

      {/* ── Resonance chamber ── */}
      <ResonanceChamber x={-22} z={-200} r={10} h={16} />

      {/* ── Dream archive ── */}
      <DreamArchive x={16} z={-206} />

      {/* ── Listening garden ── */}
      <ListeningGarden x={-14} z={-240} />

      {/* ── Observatory ── */}
      <Observatory x={18} z={-244} />

      {/* ── Hanging sculptures ── */}
      <HangingSculpture x={-28} z={-188} h={10} />
      <HangingSculpture x={24} z={-196} h={12} />
      <HangingSculpture x={-6} z={-230} h={14} />

      {/* ── Black stone boundary walls ── */}
      {/* West */}
      <mesh position={[-29.5, 6, -222]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 12, 98]} />
        <meshStandardMaterial color="#060408" roughness={0.88} metalness={0.06} map={stoneTex} />
      </mesh>
      {/* East */}
      <mesh position={[29.5, 6, -222]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 12, 98]} />
        <meshStandardMaterial color="#060408" roughness={0.88} metalness={0.06} map={stoneTex} />
      </mesh>
      {/* South */}
      <mesh position={[0, 5, -266]} castShadow receiveShadow>
        <boxGeometry args={[60, 10, 2]} />
        <meshStandardMaterial color="#060408" roughness={0.9} map={stoneTex} />
      </mesh>

      {/* ── Additional black monoliths scattered ── */}
      {[
        [-24, -196, 3, 7], [22, -218, 2.4, 9], [-18, -228, 2, 5.5],
        [24, -234, 1.8, 6.5], [-8, -258, 2.6, 8], [12, -252, 2.2, 7],
      ].map(([mx, mz, mw, mh], i) => (
        <mesh key={i} position={[mx, mh/2, mz]} castShadow>
          <boxGeometry args={[mw, mh, mw * 0.65]} />
          <meshStandardMaterial color="#06040a" roughness={0.75} metalness={0.15} map={stoneTex} />
        </mesh>
      ))}

      {/* ── Reflective pools ── */}
      {[[-8, -196], [8, -226], [-16, -254]].map(([px, pz], i) => (
        <group key={i} position={[px, 0, pz]}>
          <mesh position={[0, -0.1, 0]} receiveShadow>
            <boxGeometry args={[4, 0.2, 4]} />
            <meshStandardMaterial color="#08060e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[3.8, 0.03, 3.8]} />
            <meshStandardMaterial color="#1a0840" roughness={0.02} metalness={0.65} transparent opacity={0.9} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* ── Meditation structures (low curved forms) ── */}
      {[[-20, -216], [16, -232], [0, -250]].map(([mx, mz], i) => (
        <group key={i} position={[mx, 0, mz]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[3, 3.4, 0.7, 18]} />
            <meshStandardMaterial color="#0c0a18" roughness={0.9} map={plumTex} />
          </mesh>
          {/* Low curved back rest */}
          <mesh position={[0, 0.7, -2.5]} castShadow>
            <cylinderGeometry args={[3.2, 3.2, 0.9, 14, 1, true, -Math.PI*0.4, Math.PI*0.8]} />
            <meshStandardMaterial color="#0e0a1a" roughness={0.88} side={THREE.BackSide} />
          </mesh>
        </group>
      ))}

      {/* ── Stepped quiet plaza ── */}
      {[0.6, 0.35, 0.12].map((y, i) => (
        <mesh key={i} position={[0, y, -200]} receiveShadow castShadow>
          <boxGeometry args={[16 - i*2.5, 0.25, 8 - i*1.5]} />
          <meshStandardMaterial color={`#${(12-i*2).toString(16).padStart(2,"0")}0a${(22-i*3).toString(16).padStart(2,"0")}`} roughness={0.85} />
        </mesh>
      ))}

      {/* ── District lighting ── */}
      {/* Perimeter uplight posts — decorative only, emissive spheres */}
      {[-195, -215, -235, -255].flatMap(pz => (
        [-24, 24].map(px => (
          <group key={`${px}-${pz}`} position={[px, 0, pz]}>
            <mesh position={[0, 3, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.065, 6, 6]} />
              <meshStandardMaterial color="#0e0a18" roughness={0.6} metalness={0.8} />
            </mesh>
            <mesh position={[0, 6.2, 0]}>
              <sphereGeometry args={[0.1, 6, 4]} />
              <meshStandardMaterial color={COLORS.deepViolet} emissive={COLORS.deepViolet} emissiveIntensity={5} />
            </mesh>
          </group>
        ))
      ))}

      {/* Master fill */}
      <pointLight position={[0, 25, -222]} color="#4020a0" intensity={45} distance={120} decay={1.2} />
    </group>
  )
}
