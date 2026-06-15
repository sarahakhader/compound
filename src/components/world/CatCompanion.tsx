"use client"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { PlayerSharedState } from "./Player"

/* ── Follow parameters ── */
const OFFSET_RIGHT  = 0.85   // metres to player's right
const OFFSET_BEHIND = 0.60   // metres behind player
const CATCH_UP_DIST = 2.2    // distance at which cat breaks into a trot

const _target = new THREE.Vector3()

interface CatCompanionProps {
  playerState: React.MutableRefObject<PlayerSharedState>
}

export function CatCompanion({ playerState }: CatCompanionProps) {
  /* ── Geometry refs ── */
  const rootRef  = useRef<THREE.Group>(null!)
  const bodyRef  = useRef<THREE.Group>(null!)
  const tailRoot = useRef<THREE.Group>(null!)
  const tailMid  = useRef<THREE.Group>(null!)
  const tailTip  = useRef<THREE.Group>(null!)
  const earLRef  = useRef<THREE.Group>(null!)
  const earRRef  = useRef<THREE.Group>(null!)
  const legFLRef = useRef<THREE.Group>(null!)
  const legFRRef = useRef<THREE.Group>(null!)
  const legBLRef = useRef<THREE.Group>(null!)
  const legBRRef = useRef<THREE.Group>(null!)

  /* ── Internal cat state ── */
  const catPos      = useRef(new THREE.Vector3(0.85, 0, 8.60))
  const catYaw      = useRef(0)
  const tailPhase   = useRef(0)
  const breathPhase = useRef(0)
  const walkPhase   = useRef(0)
  const earTimer    = useRef(3.5)
  const earTwitch   = useRef(0)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { pos: pPos, yaw: pYaw, moving } = playerState.current

    /* World-space follow target: right of and behind player */
    const sinY = Math.sin(pYaw)
    const cosY = Math.cos(pYaw)
    _target.set(
      pPos.x + cosY * OFFSET_RIGHT + sinY * OFFSET_BEHIND,
      0,
      pPos.z - sinY * OFFSET_RIGHT + cosY * OFFSET_BEHIND,
    )

    /* Spring follow — faster when cat falls behind */
    const dist    = catPos.current.distanceTo(_target)
    const rushing = dist > CATCH_UP_DIST
    const lerpK   = rushing ? 0.16 : (moving ? 0.07 : 0.03)
    catPos.current.lerp(_target, lerpK)

    /* Cat yaw: face toward its movement direction */
    if (dist > 0.06) {
      const dx   = _target.x - catPos.current.x
      const dz   = _target.z - catPos.current.z
      const tYaw = Math.atan2(-dx, -dz)
      let dyaw   = tYaw - catYaw.current
      while (dyaw >  Math.PI) dyaw -= Math.PI * 2
      while (dyaw < -Math.PI) dyaw += Math.PI * 2
      catYaw.current += dyaw * 0.10
    }

    /* Animation phases */
    const catMoving = dist > 0.05
    if (catMoving) walkPhase.current  += dt * (rushing ? 22 : 13)
    tailPhase.current   += dt * (catMoving ? 2.1 : 1.0)
    breathPhase.current += dt * 0.88

    /* Ear twitch — random interval 2–7 s */
    earTimer.current -= dt
    if (earTimer.current < 0) {
      earTwitch.current = Math.sin(earTimer.current * 32) * 0.24
      if (earTimer.current < -0.22) {
        earTwitch.current = 0
        earTimer.current  = 2.0 + Math.random() * 5.0
      }
    }

    /* Tail: horizontal sweep + natural arc droop */
    const swing = Math.sin(tailPhase.current * 1.1) * (catMoving ? 0.62 : 0.30)
    if (tailRoot.current) {
      tailRoot.current.rotation.y = swing
      tailRoot.current.rotation.z = -0.22 + Math.cos(tailPhase.current * 0.55) * 0.06
    }
    if (tailMid.current) tailMid.current.rotation.y = swing * 0.50
    if (tailTip.current) tailTip.current.rotation.z = swing * 0.28 - 0.14

    /* Ears */
    if (earLRef.current) earLRef.current.rotation.z =  earTwitch.current
    if (earRRef.current) earRRef.current.rotation.z = -earTwitch.current

    /* Legs — diagonal pairs in sync */
    const legSw = catMoving ? Math.sin(walkPhase.current) * 0.38 : 0
    if (legFLRef.current) legFLRef.current.rotation.x = -legSw
    if (legBRRef.current) legBRRef.current.rotation.x = -legSw
    if (legFRRef.current) legFRRef.current.rotation.x =  legSw
    if (legBLRef.current) legBLRef.current.rotation.x =  legSw

    /* Breathing bob on whole body group */
    const breathBob = Math.sin(breathPhase.current * Math.PI * 2) * 0.005
    if (bodyRef.current) bodyRef.current.position.y = 0.14 + breathBob

    /* Root placement */
    if (rootRef.current) {
      rootRef.current.position.set(catPos.current.x, 0, catPos.current.z)
      rootRef.current.rotation.y = catYaw.current
    }
  })

  /* ── Colours ── */
  const FUR     = "#717278"   // smoke grey base
  const FUR_LT  = "#8E8F96"   // lighter belly / chest / paw pads
  const HARNESS = "#0e0f13"   // matte black
  const CHROME  = "#ADADB1"   // satin chrome emblem
  const NOSE    = "#9C5050"   // cat nose pink

  return (
    <group ref={rootRef}>
      {/* All geometry parented here so breathBob applies uniformly */}
      <group ref={bodyRef} position={[0, 0.14, 0]}>

        {/* ── Body — scaled unit sphere → ellipsoid ── */}
        <mesh castShadow scale={[0.09, 0.072, 0.185]}>
          <sphereGeometry args={[1, 10, 7]} />
          <meshStandardMaterial color={FUR} roughness={0.93} />
        </mesh>
        {/* Belly — lighter, slightly smaller */}
        <mesh scale={[0.072, 0.056, 0.145]} position={[0, -0.038, 0.008]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={FUR_LT} roughness={0.95} />
        </mesh>

        {/* ── Neck ── */}
        <mesh position={[0, 0.038, -0.145]} castShadow>
          <cylinderGeometry args={[0.046, 0.052, 0.09, 7]} />
          <meshStandardMaterial color={FUR} roughness={0.93} />
        </mesh>

        {/* ── Head ── */}
        <mesh position={[0, 0.076, -0.210]} castShadow>
          <sphereGeometry args={[0.100, 10, 7]} />
          <meshStandardMaterial color={FUR} roughness={0.92} />
        </mesh>
        {/* Muzzle — slightly protruding */}
        <mesh position={[0, 0.060, -0.300]} scale={[0.65, 0.55, 0.5]}>
          <sphereGeometry args={[0.058, 7, 5]} />
          <meshStandardMaterial color={FUR_LT} roughness={0.94} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.062, -0.308]}>
          <sphereGeometry args={[0.011, 5, 4]} />
          <meshStandardMaterial color={NOSE} roughness={0.78} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.040, 0.092, -0.293]}>
          <sphereGeometry args={[0.015, 6, 5]} />
          <meshStandardMaterial color="#060607" roughness={0.08} metalness={0.65} />
        </mesh>
        <mesh position={[0.040, 0.092, -0.293]}>
          <sphereGeometry args={[0.015, 6, 5]} />
          <meshStandardMaterial color="#060607" roughness={0.08} metalness={0.65} />
        </mesh>
        {/* Eye catch-light */}
        <mesh position={[-0.034, 0.096, -0.306]}>
          <sphereGeometry args={[0.004, 4, 3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.034, 0.096, -0.306]}>
          <sphereGeometry args={[0.004, 4, 3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>

        {/* ── Left ear ── */}
        <group ref={earLRef} position={[-0.052, 0.162, -0.210]}>
          <mesh>
            <coneGeometry args={[0.028, 0.052, 5]} />
            <meshStandardMaterial color={FUR} roughness={0.93} />
          </mesh>
          <mesh position={[0, 0.003, 0.004]} scale={[0.60, 0.72, 0.45]}>
            <coneGeometry args={[0.028, 0.052, 5]} />
            <meshStandardMaterial color="#3a1414" roughness={0.95} />
          </mesh>
        </group>

        {/* ── Right ear ── */}
        <group ref={earRRef} position={[0.052, 0.162, -0.210]}>
          <mesh>
            <coneGeometry args={[0.028, 0.052, 5]} />
            <meshStandardMaterial color={FUR} roughness={0.93} />
          </mesh>
          <mesh position={[0, 0.003, 0.004]} scale={[0.60, 0.72, 0.45]}>
            <coneGeometry args={[0.028, 0.052, 5]} />
            <meshStandardMaterial color="#3a1414" roughness={0.95} />
          </mesh>
        </group>

        {/* ── Technical harness ── */}
        {/* Main body wrap */}
        <mesh position={[0, 0.028, -0.040]}>
          <boxGeometry args={[0.172, 0.052, 0.215]} />
          <meshStandardMaterial color={HARNESS} roughness={0.62} metalness={0.24} transparent opacity={0.90} />
        </mesh>
        {/* Chest strap */}
        <mesh position={[0, -0.012, -0.155]}>
          <boxGeometry args={[0.130, 0.028, 0.038]} />
          <meshStandardMaterial color={HARNESS} roughness={0.62} metalness={0.24} />
        </mesh>
        {/* Chrome emblem on chest */}
        <mesh position={[0, 0.032, -0.154]}>
          <boxGeometry args={[0.020, 0.020, 0.005]} />
          <meshStandardMaterial color={CHROME} roughness={0.16} metalness={0.95} />
        </mesh>
        {/* Navigation module on back */}
        <mesh position={[0, 0.098, 0.018]} castShadow>
          <boxGeometry args={[0.068, 0.032, 0.095]} />
          <meshStandardMaterial color="#080a0d" roughness={0.36} metalness={0.75} />
        </mesh>
        {/* Nav module status light — glacier teal */}
        <mesh position={[0, 0.116, -0.026]}>
          <boxGeometry args={[0.009, 0.005, 0.005]} />
          <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={6} roughness={0.2} />
        </mesh>

        {/* ── Front-left leg (pivots at shoulder) ── */}
        <group ref={legFLRef} position={[-0.062, 0.018, -0.120]}>
          <mesh position={[0, -0.052, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.020, 0.104, 6]} />
            <meshStandardMaterial color={FUR} roughness={0.93} />
          </mesh>
          <mesh position={[0, -0.110, 0.010]}>
            <sphereGeometry args={[0.025, 6, 4]} />
            <meshStandardMaterial color={FUR_LT} roughness={0.91} />
          </mesh>
        </group>

        {/* ── Front-right leg ── */}
        <group ref={legFRRef} position={[0.062, 0.018, -0.120]}>
          <mesh position={[0, -0.052, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.020, 0.104, 6]} />
            <meshStandardMaterial color={FUR} roughness={0.93} />
          </mesh>
          <mesh position={[0, -0.110, 0.010]}>
            <sphereGeometry args={[0.025, 6, 4]} />
            <meshStandardMaterial color={FUR_LT} roughness={0.91} />
          </mesh>
        </group>

        {/* ── Back-left leg ── */}
        <group ref={legBLRef} position={[-0.064, 0.018, 0.130]}>
          <mesh position={[0, -0.050, 0]} castShadow>
            <cylinderGeometry args={[0.026, 0.022, 0.100, 6]} />
            <meshStandardMaterial color={FUR} roughness={0.93} />
          </mesh>
          <mesh position={[0, -0.106, 0.010]}>
            <sphereGeometry args={[0.027, 6, 4]} />
            <meshStandardMaterial color={FUR_LT} roughness={0.91} />
          </mesh>
        </group>

        {/* ── Back-right leg ── */}
        <group ref={legBRRef} position={[0.064, 0.018, 0.130]}>
          <mesh position={[0, -0.050, 0]} castShadow>
            <cylinderGeometry args={[0.026, 0.022, 0.100, 6]} />
            <meshStandardMaterial color={FUR} roughness={0.93} />
          </mesh>
          <mesh position={[0, -0.106, 0.010]}>
            <sphereGeometry args={[0.027, 6, 4]} />
            <meshStandardMaterial color={FUR_LT} roughness={0.91} />
          </mesh>
        </group>

        {/* ── Tail — three-segment chain animated in useFrame ── */}
        <group ref={tailRoot} position={[0, 0.040, 0.195]}>
          {/* Base segment — rises from rear of body */}
          <mesh position={[0, 0.072, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.048, 0.144, 6]} />
            <meshStandardMaterial color={FUR} roughness={0.94} />
          </mesh>
          {/* Mid segment */}
          <group ref={tailMid} position={[0, 0.144, 0]}>
            <mesh position={[0, 0.060, 0]}>
              <cylinderGeometry args={[0.024, 0.035, 0.120, 5]} />
              <meshStandardMaterial color={FUR} roughness={0.94} />
            </mesh>
            {/* Tip segment */}
            <group ref={tailTip} position={[0, 0.120, 0]}>
              <mesh position={[0, 0.048, 0]}>
                <cylinderGeometry args={[0.009, 0.024, 0.096, 5]} />
                <meshStandardMaterial color={FUR_LT} roughness={0.96} />
              </mesh>
            </group>
          </group>
        </group>

      </group>{/* end bodyRef */}
    </group>
  )
}
