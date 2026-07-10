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
    coat:   "#1c1f26",
    leg:    "#0f1014",
    skin:   "#8B5E3C",
    hair:   "#1e1208",
    speed:  2.0,
  },
  observer: {
    coat:   "#1e2024",
    leg:    "#171a1e",
    skin:   "#6B4430",
    hair:   "#0f0c08",
    speed:  0.8,
  },
  worker: {
    coat:   "#1a2115",
    leg:    "#161d11",
    skin:   "#9B6948",
    hair:   "#201810",
    speed:  2.7,
  },
} as const

/* Shared materials — created once, never recreated, shared across all NPC instances */
const _matCache = new Map<string, THREE.MeshStandardMaterial>()
function mat(color: string, roughness = 0.82, metalness = 0.04): THREE.MeshStandardMaterial {
  const key = `${color}:${roughness}:${metalness}`
  if (!_matCache.has(key)) {
    _matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }))
  }
  return _matCache.get(key)!
}

/* ── Single NPC unit — 7 meshes per NPC (vs 17 before) ── */
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
  const walkPhase = useRef(Math.random() * Math.PI * 2)
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

  /* 7 meshes: head, hair, torso, leg-L, leg-R, arm-L, arm-R */
  return (
    <group ref={rootRef}>
      {/* Head */}
      <mesh position={[0, 1.52, 0]}>
        <sphereGeometry args={[0.185, 8, 6]} />
        <primitive object={mat(style.skin, 0.68)} attach="material" />
      </mesh>
      {/* Hair cap */}
      <mesh position={[0, 1.64, 0]}>
        <sphereGeometry args={[0.192, 7, 5]} />
        <primitive object={mat(style.hair, 0.92)} attach="material" />
      </mesh>
      {/* Torso — single capsule-like cylinder covers neck+chest+hips */}
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.20, 0.23, 1.22, 8]} />
        <primitive object={mat(style.coat, 0.86, 0.04)} attach="material" />
      </mesh>
      {/* Left leg */}
      <group ref={legLRef} position={[-0.10, 0.62, 0]}>
        <mesh position={[0, -0.36, 0.01]}>
          <boxGeometry args={[0.16, 0.72, 0.15]} />
          <primitive object={mat(style.leg, 0.86)} attach="material" />
        </mesh>
      </group>
      {/* Right leg */}
      <group ref={legRRef} position={[0.10, 0.62, 0]}>
        <mesh position={[0, -0.36, 0.01]}>
          <boxGeometry args={[0.16, 0.72, 0.15]} />
          <primitive object={mat(style.leg, 0.86)} attach="material" />
        </mesh>
      </group>
      {/* Left arm */}
      <group ref={armLRef} position={[-0.26, 1.08, 0]}>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.065, 0.058, 0.58, 7]} />
          <primitive object={mat(style.coat, 0.86)} attach="material" />
        </mesh>
      </group>
      {/* Right arm */}
      <group ref={armRRef} position={[0.26, 1.08, 0]}>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.065, 0.058, 0.58, 7]} />
          <primitive object={mat(style.coat, 0.86)} attach="material" />
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
