"use client"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

/* ── Types ── */
export interface NPCDef {
  id:         string
  type:       "walker" | "observer" | "worker"
  waypoints:  [number, number][]   // [x, z] world positions
  speed?:     number               // m/s (type default if omitted)
}

/* ── Per-type appearance ── */
const STYLES = {
  walker: {
    coat:   "#1c1f26",   // dark waxed charcoal
    leg:    "#0f1014",
    skin:   "#8B5E3C",
    hair:   "#1e1208",
    speed:  2.0,
    coatExtra: true,     // show long-coat hem extension
  },
  observer: {
    coat:   "#1e2024",   // technical dark grey
    leg:    "#171a1e",
    skin:   "#6B4430",
    hair:   "#0f0c08",
    speed:  0.8,
    coatExtra: false,
  },
  worker: {
    coat:   "#1a2115",   // dark olive overalls
    leg:    "#161d11",
    skin:   "#9B6948",
    hair:   "#201810",
    speed:  2.7,
    coatExtra: false,
  },
} as const

/* ── Single NPC unit ── */
function NPCUnit({ def }: { def: NPCDef }) {
  const style = STYLES[def.type]
  const spd   = def.speed ?? style.speed
  const wp    = def.waypoints

  const rootRef = useRef<THREE.Group>(null!)
  const legLRef = useRef<THREE.Group>(null!)
  const legRRef = useRef<THREE.Group>(null!)
  const armLRef = useRef<THREE.Group>(null!)
  const armRRef = useRef<THREE.Group>(null!)

  const pos       = useRef(new THREE.Vector3(wp[0][0], 0, wp[0][1]))
  const yaw       = useRef(0)
  const wpIdx     = useRef(wp.length > 1 ? 1 : 0)
  const walkPhase = useRef(Math.random() * Math.PI * 2)  // stagger so NPCs desync
  const idle      = useRef(0)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)

    if (idle.current > 0) {
      idle.current -= dt
    } else if (wp.length > 1) {
      const target = wp[wpIdx.current]
      const dx = target[0] - pos.current.x
      const dz = target[1] - pos.current.z
      const dist = Math.hypot(dx, dz)

      if (dist < 0.5) {
        wpIdx.current = (wpIdx.current + 1) % wp.length
        idle.current  = def.type === "observer"
          ? 2.0 + Math.random() * 3.5
          : 0.15 + Math.random() * 0.25
      } else {
        pos.current.x += (dx / dist) * spd * dt
        pos.current.z += (dz / dist) * spd * dt
        /* Smooth yaw toward movement direction */
        const tYaw = Math.atan2(-dx, -dz)
        let dyaw   = tYaw - yaw.current
        while (dyaw >  Math.PI) dyaw -= Math.PI * 2
        while (dyaw < -Math.PI) dyaw += Math.PI * 2
        yaw.current += dyaw * 0.09
      }

      walkPhase.current += dt * 11
    }

    const moving = idle.current <= 0 && wp.length > 1
    const swing  = moving ? Math.sin(walkPhase.current) * 0.36 : 0

    if (legLRef.current) legLRef.current.rotation.x  =  swing
    if (legRRef.current) legRRef.current.rotation.x  = -swing
    if (armLRef.current) armLRef.current.rotation.x  = -swing * 0.44
    if (armRRef.current) armRRef.current.rotation.x  =  swing * 0.44

    if (rootRef.current) {
      rootRef.current.position.copy(pos.current)
      rootRef.current.rotation.y = yaw.current
    }
  })

  return (
    <group ref={rootRef}>
      {/* Head */}
      <mesh position={[0, 1.50, 0]}>
        <sphereGeometry args={[0.182, 10, 7]} />
        <meshStandardMaterial color={style.skin} roughness={0.68} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.625, 0]}>
        <sphereGeometry args={[0.190, 8, 6]} />
        <meshStandardMaterial color={style.hair} roughness={0.92} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.30, 0]}>
        <cylinderGeometry args={[0.062, 0.068, 0.14, 7]} />
        <meshStandardMaterial color={style.skin} roughness={0.68} />
      </mesh>

      {/* Torso / jacket (y=0.60 → 1.22) */}
      <mesh position={[0, 0.91, 0]}>
        <cylinderGeometry args={[0.195, 0.215, 0.62, 8]} />
        <meshStandardMaterial color={style.coat} roughness={0.86} metalness={0.04} />
      </mesh>

      {/* Long-coat hem extension (walker only) */}
      {style.coatExtra && (
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.175, 0.21, 0.24, 8]} />
          <meshStandardMaterial color={style.coat} roughness={0.88} metalness={0.02} />
        </mesh>
      )}

      {/* Worker bib (chest panel) */}
      {def.type === "worker" && (
        <mesh position={[0, 0.95, 0.20]}>
          <boxGeometry args={[0.20, 0.22, 0.03]} />
          <meshStandardMaterial color="#222d1a" roughness={0.90} />
        </mesh>
      )}

      {/* Left leg (hip pivot at y=0.62) */}
      <group ref={legLRef} position={[-0.10, 0.62, 0]}>
        {/* Upper leg */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.072, 0.068, 0.36, 7]} />
          <meshStandardMaterial color={style.leg} roughness={0.86} />
        </mesh>
        {/* Lower leg */}
        <mesh position={[0, -0.44, 0]}>
          <cylinderGeometry args={[0.062, 0.057, 0.30, 7]} />
          <meshStandardMaterial color={style.leg} roughness={0.86} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.615, 0.028]}>
          <boxGeometry args={[0.115, 0.10, 0.21]} />
          <meshStandardMaterial color="#0d0e12" roughness={0.44} metalness={0.28} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={legRRef} position={[0.10, 0.62, 0]}>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.072, 0.068, 0.36, 7]} />
          <meshStandardMaterial color={style.leg} roughness={0.86} />
        </mesh>
        <mesh position={[0, -0.44, 0]}>
          <cylinderGeometry args={[0.062, 0.057, 0.30, 7]} />
          <meshStandardMaterial color={style.leg} roughness={0.86} />
        </mesh>
        <mesh position={[0, -0.615, 0.028]}>
          <boxGeometry args={[0.115, 0.10, 0.21]} />
          <meshStandardMaterial color="#0d0e12" roughness={0.44} metalness={0.28} />
        </mesh>
      </group>

      {/* Left arm (shoulder pivot at y=1.10) */}
      <group ref={armLRef} position={[-0.265, 1.10, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.068, 0.062, 0.30, 7]} />
          <meshStandardMaterial color={style.coat} roughness={0.86} />
        </mesh>
        {/* Forearm — skin visible for observer/worker */}
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.058, 0.052, 0.26, 7]} />
          <meshStandardMaterial color={def.type === "walker" ? style.coat : style.skin} roughness={0.72} />
        </mesh>
      </group>

      {/* Right arm */}
      <group ref={armRRef} position={[0.265, 1.10, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.068, 0.062, 0.30, 7]} />
          <meshStandardMaterial color={style.coat} roughness={0.86} />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.058, 0.052, 0.26, 7]} />
          <meshStandardMaterial color={def.type === "walker" ? style.coat : style.skin} roughness={0.72} />
        </mesh>
      </group>
    </group>
  )
}

/* ── Scene-level NPC population ── */
export function NPCs({ defs }: { defs: NPCDef[] }) {
  return (
    <>
      {defs.map(d => <NPCUnit key={d.id} def={d} />)}
    </>
  )
}
