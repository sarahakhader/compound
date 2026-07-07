"use client"
import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/* ── Collision ── */
interface Collider { x: number; z: number; hw: number; hd: number }

function blocked(px: number, pz: number, r: number, cs: Collider[], interior: boolean): boolean {
  if (interior) {
    if (px < 187 || px > 213 || pz < -8.5 || pz > 8.5) return true
  } else {
    const onMain       = px >= -16 && px <= 18  && pz <= 14   && pz >= -168
    const onEast       = px >   16 && px <= 88  && pz >= -109 && pz <= -91
    const inChrome     = px >   16 && px <= 98  && pz >= -122 && pz <= -70
    const inBedrock    = px >= -80 && px <  -16 && pz >= -115 && pz <= -50
    const inGlacier    = px >= -90 && px <  -14 && pz >= -240 && pz <= -140
    const inDeepViolet = px >= -30 && px <= 30  && pz >= -270 && pz <= -160
    if (!onMain && !onEast && !inChrome && !inBedrock && !inGlacier && !inDeepViolet) return true
  }
  for (const c of cs) {
    if (Math.abs(px - c.x) < c.hw + r && Math.abs(pz - c.z) < c.hd + r) return true
  }
  return false
}

/* ── Interior trigger / spawn ── */
const TRIGGER_POS     = new THREE.Vector3(65, 0, -100)
const INTERIOR_POS    = new THREE.Vector3(200, 0, 0)
const EXTERIOR_RETURN = new THREE.Vector3(65, 0, -100)

/* ── Constants ── */
const WALK_SPEED    = 16.0
const RUN_SPEED     = 30.0
const CAM_DIST      = 5.2
const CAM_LOOK_Y    = 1.35
const CAM_STIFFNESS = 24
const CAM_MIN_Y     = 0.8
const ARROW_TURN    = 3.2   // radians/sec for arrow key camera rotation
const PITCH_TURN    = 1.8   // radians/sec for arrow key pitch
const GAMEPAD_SENS  = 2.2
const GAMEPAD_DEAD  = 0.12
const PLAYER_R      = 0.42
const PLAYER_Y      = 0

/* Persistent vectors — no allocation in hot path */
const _fwd       = new THREE.Vector3()
const _right     = new THREE.Vector3()
const _camTarget = new THREE.Vector3()

function computeCamTarget(px: number, pz: number, yaw: number, pitch: number): THREE.Vector3 {
  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  return _camTarget.set(
    px + Math.sin(yaw) * cosP * CAM_DIST,
    Math.max(CAM_MIN_Y, CAM_LOOK_Y - sinP * CAM_DIST),
    pz + Math.cos(yaw) * cosP * CAM_DIST,
  )
}

export interface PlayerSharedState {
  pos:    THREE.Vector3
  yaw:    number
  moving: boolean
}

export interface PlayerProps {
  colliders:    Collider[]
  onExit:       () => void
  onPrompt:     (text: string | null) => void
  playerState?: React.MutableRefObject<PlayerSharedState>
}

/* ── Shared materials (avoid recreating per render) ── */
const MAT_SKIN   = new THREE.MeshStandardMaterial({ color: "#C68A52", roughness: 0.60, metalness: 0.0 })
const MAT_JACKET = new THREE.MeshStandardMaterial({ color: "#0d0f16", roughness: 0.72, metalness: 0.10 })
const MAT_PANTS  = new THREE.MeshStandardMaterial({ color: "#0e1018", roughness: 0.82, metalness: 0.04 })
const MAT_BOOT   = new THREE.MeshStandardMaterial({ color: "#0a0b0e", roughness: 0.45, metalness: 0.30 })
const MAT_HAIR   = new THREE.MeshStandardMaterial({ color: "#1e0e06", roughness: 0.94, metalness: 0.0 })
const MAT_EYE    = new THREE.MeshStandardMaterial({ color: "#060606", roughness: 0.05, metalness: 0.6 })
const MAT_WHITE  = new THREE.MeshStandardMaterial({ color: "#dde8ff", roughness: 0.3,  metalness: 0.0, emissive: "#dde8ff", emissiveIntensity: 0.15 })
const MAT_SOLE   = new THREE.MeshStandardMaterial({ color: "#1a1a1f", roughness: 0.85, metalness: 0.05 })
const MAT_SHIRT  = new THREE.MeshStandardMaterial({ color: "#1c2535", roughness: 0.80, metalness: 0.05 })

export function Player({ colliders, onExit, onPrompt, playerState }: PlayerProps) {
  const { camera } = useThree()

  const pos         = useRef(new THREE.Vector3(0, PLAYER_Y, 8))
  const yaw         = useRef(0)
  const pitch       = useRef(-0.22)
  const keys        = useRef<Record<string, boolean>>({})
  const interior    = useRef(false)
  const nearTrigger = useRef(false)

  const rootRef     = useRef<THREE.Group>(null!)
  const leftLegRef  = useRef<THREE.Group>(null!)
  const rightLegRef = useRef<THREE.Group>(null!)
  const leftArmRef  = useRef<THREE.Group>(null!)
  const rightArmRef = useRef<THREE.Group>(null!)
  const walkPhase   = useRef(0)
  const idlePhase   = useRef(0)

  useEffect(() => {
    camera.position.copy(computeCamTarget(pos.current.x, pos.current.z, yaw.current, pitch.current))
    camera.lookAt(pos.current.x, CAM_LOOK_Y, pos.current.z)
  }, [camera])

  /* ── Input — keyboard only, no pointer lock ── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true

      if (e.code === "KeyE" && nearTrigger.current && !interior.current) {
        interior.current = true
        pos.current.copy(INTERIOR_POS)
        yaw.current = Math.PI
        nearTrigger.current = false
        onPrompt(null)
        camera.position.copy(computeCamTarget(INTERIOR_POS.x, INTERIOR_POS.z, Math.PI, pitch.current))
        window.dispatchEvent(new CustomEvent("compound-interior", { detail: { active: true } }))
      }

      if (e.code === "Escape") {
        if (interior.current) {
          interior.current = false
          pos.current.copy(EXTERIOR_RETURN)
          yaw.current = Math.PI / 2
          camera.position.copy(computeCamTarget(EXTERIOR_RETURN.x, EXTERIOR_RETURN.z, Math.PI / 2, pitch.current))
          window.dispatchEvent(new CustomEvent("compound-interior", { detail: { active: false } }))
        } else {
          onExit()
        }
      }

      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code))
        e.preventDefault()
    }

    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup",   onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup",   onKeyUp)
    }
  }, [camera, onExit, onPrompt])

  /* ── Frame loop ── */
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.04)
    const k  = keys.current

    /* Arrow keys rotate camera — independent of movement */
    if (k["ArrowLeft"])  yaw.current   += ARROW_TURN  * dt
    if (k["ArrowRight"]) yaw.current   -= ARROW_TURN  * dt
    if (k["ArrowUp"])    pitch.current  = Math.max(-0.50, pitch.current - PITCH_TURN * dt)
    if (k["ArrowDown"])  pitch.current  = Math.min( 0.28, pitch.current + PITCH_TURN * dt)

    const y = yaw.current

    /* WASD movement direction — relative to camera yaw */
    _fwd.set(-Math.sin(y), 0, -Math.cos(y))
    _right.set(Math.cos(y), 0, -Math.sin(y))

    let dx = 0, dz = 0
    let run = k["ShiftLeft"] || k["ShiftRight"]
    if (k["KeyW"]) { dx += _fwd.x;   dz += _fwd.z   }
    if (k["KeyS"]) { dx -= _fwd.x;   dz -= _fwd.z   }
    if (k["KeyA"]) { dx -= _right.x; dz -= _right.z }
    if (k["KeyD"]) { dx += _right.x; dz += _right.z }

    /* Gamepad — left stick move, right stick camera */
    const pads = navigator.getGamepads?.()
    if (pads) {
      for (const pad of pads) {
        if (!pad?.connected) continue
        const dead = (v: number) => (Math.abs(v) > GAMEPAD_DEAD ? v : 0)
        dx += _right.x * dead(pad.axes[0]) - _fwd.x * dead(pad.axes[1])
        dz += _right.z * dead(pad.axes[0]) - _fwd.z * dead(pad.axes[1])
        yaw.current   += dead(pad.axes[2]) * GAMEPAD_SENS * dt
        pitch.current  = Math.max(-0.50, Math.min(0.28, pitch.current - dead(pad.axes[3]) * GAMEPAD_SENS * dt))
        if (pad.buttons[5]?.pressed || (pad.buttons[7]?.value ?? 0) > 0.5) run = true
        break
      }
    }

    const len    = Math.hypot(dx, dz)
    const moving = len > 0.01
    if (moving) { dx /= len; dz /= len }

    const spd  = run ? RUN_SPEED : WALK_SPEED
    const step = spd * dt
    const p    = pos.current
    const intr = interior.current
    const nx = p.x + dx * step
    const nz = p.z + dz * step
    if (!blocked(nx, p.z, PLAYER_R, colliders, intr)) p.x = nx
    if (!blocked(p.x, nz, PLAYER_R, colliders, intr)) p.z = nz

    /* Estate entrance trigger */
    if (!intr) {
      const dist    = Math.hypot(p.x - TRIGGER_POS.x, p.z - TRIGGER_POS.z)
      const nowNear = dist < 5
      if (nowNear !== nearTrigger.current) {
        nearTrigger.current = nowNear
        onPrompt(nowNear ? "[ E ]  ENTER COMPOUND ESTATE" : null)
      }
    }

    /* Animation phases */
    if (moving) { walkPhase.current += dt * (run ? 22 : 14); idlePhase.current = 0 }
    else        { idlePhase.current += dt }
    const wp = walkPhase.current
    const ip = idlePhase.current

    const walkBob = moving ? Math.sin(wp) * 0.038 : 0
    const idleBob = moving ? 0 : Math.sin(ip * 1.1 * Math.PI * 2) * 0.005

    const swing     = moving ? Math.sin(wp) * 0.40 : 0
    const idleSwayL = moving ? 0 :  Math.sin(ip * 0.85 * Math.PI * 2) * 0.035
    const idleSwayR = moving ? 0 : -Math.sin(ip * 0.85 * Math.PI * 2) * 0.035

    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing
    if (leftArmRef.current)  leftArmRef.current.rotation.x  = moving ? -swing * 0.5 : idleSwayL
    if (rightArmRef.current) rightArmRef.current.rotation.x = moving ?  swing * 0.5 : idleSwayR

    if (rootRef.current) {
      rootRef.current.position.set(p.x, walkBob + idleBob, p.z)
      rootRef.current.rotation.y = y
    }

    if (playerState?.current) {
      playerState.current.pos.copy(p)
      playerState.current.yaw    = y
      playerState.current.moving = moving
    }

    camera.position.lerp(computeCamTarget(p.x, p.z, y, pitch.current), 1 - Math.exp(-CAM_STIFFNESS * dt))
    const lookX = moving ? p.x + dx * 1.8 : p.x
    const lookZ = moving ? p.z + dz * 1.8 : p.z
    camera.lookAt(lookX, CAM_LOOK_Y, lookZ)
  })

  /* ── Realistic character mesh ── */
  return (
    <group ref={rootRef}>

      {/* ════ LOWER BODY ════ */}

      {/* Left leg group — pivots at hip */}
      <group ref={leftLegRef} position={[-0.13, 0.62, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.115, 0.105, 0.44, 12]} />
          <primitive object={MAT_PANTS} attach="material" />
        </mesh>
        {/* Knee cap */}
        <mesh position={[0, -0.455, 0.015]}>
          <sphereGeometry args={[0.082, 8, 6]} />
          <primitive object={MAT_PANTS} attach="material" />
        </mesh>
        {/* Shin */}
        <mesh position={[0, -0.64, 0]}>
          <cylinderGeometry args={[0.085, 0.072, 0.37, 10]} />
          <primitive object={MAT_PANTS} attach="material" />
        </mesh>
        {/* Boot body */}
        <mesh position={[0, -0.875, 0.024]}>
          <boxGeometry args={[0.145, 0.22, 0.245]} />
          <primitive object={MAT_BOOT} attach="material" />
        </mesh>
        {/* Boot toe cap */}
        <mesh position={[0, -0.895, 0.135]}>
          <boxGeometry args={[0.13, 0.18, 0.08]} />
          <primitive object={MAT_BOOT} attach="material" />
        </mesh>
        {/* Boot sole */}
        <mesh position={[0, -0.99, 0.034]}>
          <boxGeometry args={[0.155, 0.03, 0.28]} />
          <primitive object={MAT_SOLE} attach="material" />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={rightLegRef} position={[0.13, 0.62, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.115, 0.105, 0.44, 12]} />
          <primitive object={MAT_PANTS} attach="material" />
        </mesh>
        <mesh position={[0, -0.455, 0.015]}>
          <sphereGeometry args={[0.082, 8, 6]} />
          <primitive object={MAT_PANTS} attach="material" />
        </mesh>
        <mesh position={[0, -0.64, 0]}>
          <cylinderGeometry args={[0.085, 0.072, 0.37, 10]} />
          <primitive object={MAT_PANTS} attach="material" />
        </mesh>
        <mesh position={[0, -0.875, 0.024]}>
          <boxGeometry args={[0.145, 0.22, 0.245]} />
          <primitive object={MAT_BOOT} attach="material" />
        </mesh>
        <mesh position={[0, -0.895, 0.135]}>
          <boxGeometry args={[0.13, 0.18, 0.08]} />
          <primitive object={MAT_BOOT} attach="material" />
        </mesh>
        <mesh position={[0, -0.99, 0.034]}>
          <boxGeometry args={[0.155, 0.03, 0.28]} />
          <primitive object={MAT_SOLE} attach="material" />
        </mesh>
      </group>

      {/* ════ TORSO ════ */}

      {/* Hips */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.275, 0.265, 0.18, 12]} />
        <primitive object={MAT_PANTS} attach="material" />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.278, 0.278, 0.055, 12]} />
        <meshStandardMaterial color="#0a0b0d" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, 0.72, -0.28]}>
        <boxGeometry args={[0.06, 0.048, 0.012]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Undershirt visible at waist */}
      <mesh position={[0, 0.80, 0]}>
        <cylinderGeometry args={[0.265, 0.275, 0.12, 12]} />
        <primitive object={MAT_SHIRT} attach="material" />
      </mesh>

      {/* Main jacket torso — tapered, wider shoulders */}
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.285, 0.268, 0.48, 12]} />
        <primitive object={MAT_JACKET} attach="material" />
      </mesh>

      {/* Chest / pectoral volume */}
      <mesh position={[0, 1.05, -0.19]}>
        <boxGeometry args={[0.38, 0.28, 0.10]} />
        <primitive object={MAT_JACKET} attach="material" />
      </mesh>

      {/* Left jacket lapel */}
      <mesh position={[-0.09, 1.16, -0.27]} rotation={[0.18, 0.18, 0.25]}>
        <boxGeometry args={[0.10, 0.20, 0.025]} />
        <primitive object={MAT_JACKET} attach="material" />
      </mesh>
      {/* Right jacket lapel */}
      <mesh position={[0.09, 1.16, -0.27]} rotation={[0.18, -0.18, -0.25]}>
        <boxGeometry args={[0.10, 0.20, 0.025]} />
        <primitive object={MAT_JACKET} attach="material" />
      </mesh>

      {/* Shirt visible between lapels */}
      <mesh position={[0, 1.10, -0.29]}>
        <boxGeometry args={[0.09, 0.22, 0.012]} />
        <primitive object={MAT_SHIRT} attach="material" />
      </mesh>

      {/* Shoulder pads — slight width */}
      <mesh position={[-0.30, 1.24, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <primitive object={MAT_JACKET} attach="material" />
      </mesh>
      <mesh position={[0.30, 1.24, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <primitive object={MAT_JACKET} attach="material" />
      </mesh>

      {/* Jacket collar */}
      <mesh position={[0, 1.28, -0.05]}>
        <cylinderGeometry args={[0.14, 0.19, 0.10, 10]} />
        <primitive object={MAT_JACKET} attach="material" />
      </mesh>

      {/* ════ ARMS ════ */}

      {/* Left arm — pivots at shoulder */}
      <group ref={leftArmRef} position={[-0.35, 1.22, 0]}>
        {/* Upper arm (jacket sleeve) */}
        <mesh position={[0, -0.19, 0]}>
          <cylinderGeometry args={[0.092, 0.082, 0.36, 10]} />
          <primitive object={MAT_JACKET} attach="material" />
        </mesh>
        {/* Elbow */}
        <mesh position={[0, -0.40, 0]}>
          <sphereGeometry args={[0.074, 8, 6]} />
          <primitive object={MAT_JACKET} attach="material" />
        </mesh>
        {/* Forearm (skin — sleeve rolled or short) */}
        <mesh position={[0, -0.58, 0]}>
          <cylinderGeometry args={[0.070, 0.060, 0.34, 10]} />
          <primitive object={MAT_SKIN} attach="material" />
        </mesh>
        {/* Wrist */}
        <mesh position={[0, -0.76, 0]}>
          <sphereGeometry args={[0.058, 8, 6]} />
          <primitive object={MAT_SKIN} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.86, 0.01]}>
          <boxGeometry args={[0.088, 0.095, 0.065]} />
          <primitive object={MAT_SKIN} attach="material" />
        </mesh>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.35, 1.22, 0]}>
        <mesh position={[0, -0.19, 0]}>
          <cylinderGeometry args={[0.092, 0.082, 0.36, 10]} />
          <primitive object={MAT_JACKET} attach="material" />
        </mesh>
        <mesh position={[0, -0.40, 0]}>
          <sphereGeometry args={[0.074, 8, 6]} />
          <primitive object={MAT_JACKET} attach="material" />
        </mesh>
        <mesh position={[0, -0.58, 0]}>
          <cylinderGeometry args={[0.070, 0.060, 0.34, 10]} />
          <primitive object={MAT_SKIN} attach="material" />
        </mesh>
        <mesh position={[0, -0.76, 0]}>
          <sphereGeometry args={[0.058, 8, 6]} />
          <primitive object={MAT_SKIN} attach="material" />
        </mesh>
        <mesh position={[0, -0.86, 0.01]}>
          <boxGeometry args={[0.088, 0.095, 0.065]} />
          <primitive object={MAT_SKIN} attach="material" />
        </mesh>
      </group>

      {/* ════ HEAD & FACE ════ */}

      {/* Neck */}
      <mesh position={[0, 1.36, 0]}>
        <cylinderGeometry args={[0.082, 0.095, 0.14, 10]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* Head base */}
      <mesh position={[0, 1.60, 0]}>
        <sphereGeometry args={[0.195, 18, 14]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* Brow ridge — subtle protrusion above eyes */}
      <mesh position={[0, 1.685, -0.168]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[0.22, 0.035, 0.055]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* Nose bridge + tip */}
      <mesh position={[0, 1.624, -0.187]}>
        <boxGeometry args={[0.042, 0.095, 0.052]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>
      <mesh position={[0, 1.572, -0.196]}>
        <sphereGeometry args={[0.028, 7, 5]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* Cheekbones — subtle volume */}
      <mesh position={[-0.115, 1.605, -0.152]}>
        <sphereGeometry args={[0.055, 7, 5]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>
      <mesh position={[0.115, 1.605, -0.152]}>
        <sphereGeometry args={[0.055, 7, 5]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* Jaw / chin */}
      <mesh position={[0, 1.505, -0.148]}>
        <boxGeometry args={[0.145, 0.055, 0.065]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* Lips */}
      <mesh position={[0, 1.545, -0.189]}>
        <boxGeometry args={[0.080, 0.022, 0.018]} />
        <meshStandardMaterial color="#8a4040" roughness={0.75} />
      </mesh>

      {/* Left eye */}
      <mesh position={[-0.065, 1.660, -0.178]}>
        <sphereGeometry args={[0.026, 8, 6]} />
        <meshStandardMaterial color="#f0ece8" roughness={0.2} />
      </mesh>
      <mesh position={[-0.065, 1.660, -0.195]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <primitive object={MAT_EYE} attach="material" />
      </mesh>
      {/* Eye catch-light */}
      <mesh position={[-0.058, 1.666, -0.208]}>
        <sphereGeometry args={[0.005, 5, 4]} />
        <primitive object={MAT_WHITE} attach="material" />
      </mesh>

      {/* Right eye */}
      <mesh position={[0.065, 1.660, -0.178]}>
        <sphereGeometry args={[0.026, 8, 6]} />
        <meshStandardMaterial color="#f0ece8" roughness={0.2} />
      </mesh>
      <mesh position={[0.065, 1.660, -0.195]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <primitive object={MAT_EYE} attach="material" />
      </mesh>
      <mesh position={[0.072, 1.666, -0.208]}>
        <sphereGeometry args={[0.005, 5, 4]} />
        <primitive object={MAT_WHITE} attach="material" />
      </mesh>

      {/* Ear left */}
      <mesh position={[-0.196, 1.608, 0.008]}>
        <sphereGeometry args={[0.038, 7, 5]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>
      {/* Ear right */}
      <mesh position={[0.196, 1.608, 0.008]}>
        <sphereGeometry args={[0.038, 7, 5]} />
        <primitive object={MAT_SKIN} attach="material" />
      </mesh>

      {/* ════ HAIR ════ */}

      {/* Main hair mass — covers crown and back */}
      <mesh position={[0, 1.77, 0.018]}>
        <sphereGeometry args={[0.208, 14, 10]} />
        <primitive object={MAT_HAIR} attach="material" />
      </mesh>
      {/* Side volume — left temple to ear */}
      <mesh position={[-0.155, 1.695, 0.020]}>
        <sphereGeometry args={[0.118, 10, 7]} />
        <primitive object={MAT_HAIR} attach="material" />
      </mesh>
      {/* Side volume — right */}
      <mesh position={[0.155, 1.695, 0.020]}>
        <sphereGeometry args={[0.118, 10, 7]} />
        <primitive object={MAT_HAIR} attach="material" />
      </mesh>
      {/* Back — tapers down nape */}
      <mesh position={[0, 1.660, 0.145]}>
        <sphereGeometry args={[0.130, 10, 7]} />
        <primitive object={MAT_HAIR} attach="material" />
      </mesh>
      {/* Forehead strand / fringe */}
      <mesh position={[0, 1.762, -0.135]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.04]} />
        <primitive object={MAT_HAIR} attach="material" />
      </mesh>

    </group>
  )
}
