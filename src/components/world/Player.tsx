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
const WALK_SPEED    = 12.0
const RUN_SPEED     = 22.0
const CAM_DIST      = 5.0    // orbital arm length (metres)
const CAM_LOOK_Y    = 1.25   // look-at height on player body
const CAM_STIFFNESS = 18     // framerate-independent spring (larger = tighter)
const CAM_MIN_Y    = 0.8    // camera never clips below this world height
const MOUSE_SENS   = 0.0022
const GAMEPAD_SENS = 2.2    // radians/sec for stick camera
const GAMEPAD_DEAD = 0.12
const PLAYER_R     = 0.42
const PLAYER_Y     = 0

/* Persistent vectors — no allocation in hot path */
const _fwd       = new THREE.Vector3()
const _right     = new THREE.Vector3()
const _camTarget = new THREE.Vector3()

/* Compute spherical orbital camera target from player state */
function computeCamTarget(px: number, pz: number, yaw: number, pitch: number): THREE.Vector3 {
  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  return _camTarget.set(
    px + Math.sin(yaw) * cosP * CAM_DIST,
    Math.max(CAM_MIN_Y, CAM_LOOK_Y - sinP * CAM_DIST),
    pz + Math.cos(yaw) * cosP * CAM_DIST,
  )
}

/* Shared player state — written every frame, read by CatCompanion with zero re-renders */
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

export function Player({ colliders, onExit, onPrompt, playerState }: PlayerProps) {
  const { camera, gl } = useThree()

  const pos         = useRef(new THREE.Vector3(0, PLAYER_Y, 8))
  const yaw         = useRef(0)
  const pitch       = useRef(-0.18)   // slight downward look → camera sits above player
  const keys        = useRef<Record<string, boolean>>({})
  const locked      = useRef(false)
  const interior    = useRef(false)
  const nearTrigger = useRef(false)

  const rootRef     = useRef<THREE.Group>(null!)
  const leftLegRef  = useRef<THREE.Group>(null!)
  const rightLegRef = useRef<THREE.Group>(null!)
  const leftArmRef  = useRef<THREE.Group>(null!)
  const rightArmRef = useRef<THREE.Group>(null!)
  const walkPhase   = useRef(0)
  const idlePhase   = useRef(0)

  /* ── Snap camera immediately on mount (no lerp drift on first frame) ── */
  useEffect(() => {
    camera.position.copy(
      computeCamTarget(pos.current.x, pos.current.z, yaw.current, pitch.current)
    )
    camera.lookAt(pos.current.x, CAM_LOOK_Y, pos.current.z)
  }, [camera])

  /* ── Input / pointer lock ── */
  useEffect(() => {
    const canvas = gl.domElement

    const onLockChange = () => { locked.current = document.pointerLockElement === canvas }

    const onMouseMove = (e: MouseEvent) => {
      if (!locked.current) return
      yaw.current  += e.movementX * MOUSE_SENS
      pitch.current = Math.max(-0.50, Math.min(0.25, pitch.current - e.movementY * MOUSE_SENS))
    }

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
          locked.current ? document.exitPointerLock() : onExit()
        }
      }

      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code))
        e.preventDefault()
    }

    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false }
    const onClick = () => {
      if (!locked.current) {
        // Chrome 116+ returns a Promise — must be caught or it becomes an unhandled rejection
        const p = canvas.requestPointerLock()
        if (p && typeof p.catch === "function") p.catch(() => undefined)
      }
    }

    canvas.addEventListener("click", onClick)
    document.addEventListener("pointerlockchange", onLockChange)
    document.addEventListener("mousemove", onMouseMove)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    return () => {
      canvas.removeEventListener("click", onClick)
      document.removeEventListener("pointerlockchange", onLockChange)
      document.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      if (document.pointerLockElement === canvas) document.exitPointerLock()
    }
  }, [gl, onExit])

  /* ── Frame loop ── */
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const k  = keys.current
    const y  = yaw.current

    /* Orientation basis */
    _fwd.set(-Math.sin(y), 0, -Math.cos(y))
    _right.set(Math.cos(y), 0, -Math.sin(y))

    /* Keyboard movement input */
    let dx = 0, dz = 0
    let run = k["ShiftLeft"] || k["ShiftRight"]
    if (k["KeyW"] || k["ArrowUp"])    { dx += _fwd.x;   dz += _fwd.z   }
    if (k["KeyS"] || k["ArrowDown"])  { dx -= _fwd.x;   dz -= _fwd.z   }
    if (k["KeyA"] || k["ArrowLeft"])  { dx -= _right.x; dz -= _right.z }
    if (k["KeyD"] || k["ArrowRight"]) { dx += _right.x; dz += _right.z }

    /* Gamepad input — polled each frame */
    const pads = navigator.getGamepads?.()
    if (pads) {
      for (const pad of pads) {
        if (!pad?.connected) continue
        const dead = (v: number) => (Math.abs(v) > GAMEPAD_DEAD ? v : 0)
        const lx = dead(pad.axes[0])
        const ly = dead(pad.axes[1])
        /* Left stick → movement */
        dx += _right.x * lx - _fwd.x * ly
        dz += _right.z * lx - _fwd.z * ly
        /* Right stick → camera orbit */
        yaw.current   += dead(pad.axes[2]) * GAMEPAD_SENS * dt
        pitch.current  = Math.max(-0.50, Math.min(0.25,
          pitch.current - dead(pad.axes[3]) * GAMEPAD_SENS * dt))
        /* RB or R-trigger → run */
        if (pad.buttons[5]?.pressed || (pad.buttons[7]?.value ?? 0) > 0.5) run = true
        break
      }
    }

    const len    = Math.hypot(dx, dz)
    const moving = len > 0.01
    if (moving) { dx /= len; dz /= len }

    /* Slide-collision movement */
    const spd = run ? RUN_SPEED : WALK_SPEED
    const step = spd * dt
    const p    = pos.current
    const intr = interior.current
    const nx = p.x + dx * step
    const nz = p.z + dz * step
    if (!blocked(nx, p.z, PLAYER_R, colliders, intr)) p.x = nx
    if (!blocked(p.x, nz, PLAYER_R, colliders, intr)) p.z = nz

    /* Trigger proximity */
    if (!intr) {
      const dist = Math.hypot(p.x - TRIGGER_POS.x, p.z - TRIGGER_POS.z)
      const nowNear = dist < 5
      if (nowNear !== nearTrigger.current) {
        nearTrigger.current = nowNear
        onPrompt(nowNear ? "[ E ]  ENTER COMPOUND ESTATE" : null)
      }
    }

    /* Animation phases — walk and idle are mutually exclusive */
    if (moving) {
      walkPhase.current += dt * (run ? 22 : 14)
      idlePhase.current  = 0
    } else {
      idlePhase.current += dt
    }
    const wp = walkPhase.current
    const ip = idlePhase.current

    /* Vertical body displacement */
    const walkBob = moving ? Math.sin(wp) * 0.045 : 0
    const idleBob = moving ? 0 : Math.sin(ip * 1.1 * Math.PI * 2) * 0.006

    /* Limb swing — walk swing or idle arm sway */
    const swing      = moving ? Math.sin(wp) * 0.42 : 0
    const idleSwayL  = moving ? 0 : Math.sin(ip * 0.85 * Math.PI * 2) * 0.04
    const idleSwayR  = moving ? 0 : -Math.sin(ip * 0.85 * Math.PI * 2) * 0.04

    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing
    if (leftArmRef.current)  leftArmRef.current.rotation.x  = moving ? -swing * 0.55 : idleSwayL
    if (rightArmRef.current) rightArmRef.current.rotation.x = moving ?  swing * 0.55 : idleSwayR

    if (rootRef.current) {
      rootRef.current.position.set(p.x, walkBob + idleBob, p.z)
      rootRef.current.rotation.y = y
    }

    /* Broadcast to shared state (CatCompanion, future HUD, etc.) */
    if (playerState?.current) {
      playerState.current.pos.copy(p)
      playerState.current.yaw    = y
      playerState.current.moving = moving
    }

    /* ── Orbital camera — spherical coordinates around player ── */
    camera.position.lerp(
      computeCamTarget(p.x, p.z, y, pitch.current),
      1 - Math.exp(-CAM_STIFFNESS * dt),
    )
    camera.lookAt(p.x, CAM_LOOK_Y, p.z)
  })

  /* ── Player mesh (unchanged) ── */
  return (
    <group ref={rootRef}>
      {/* Torso — structured black jacket */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.55, 10]} />
        <meshStandardMaterial color="#0d0e12" roughness={0.62} metalness={0.08} />
      </mesh>
      {/* Skin — exposed midriff strip */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.26, 0.18, 10]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.65} />
      </mesh>

      {/* Pelvis / waist */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.27, 0.26, 0.2, 10]} />
        <meshStandardMaterial color="#0e0f14" roughness={0.80} />
      </mesh>

      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.14, 0.55, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.1, 0.38, 8]} />
          <meshStandardMaterial color="#0e0f14" roughness={0.80} />
        </mesh>
        <mesh position={[0, -0.48, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.34, 8]} />
          <meshStandardMaterial color="#0e0f14" roughness={0.80} />
        </mesh>
        <mesh position={[0, -0.67, 0.04]} castShadow>
          <boxGeometry args={[0.14, 0.1, 0.22]} />
          <meshStandardMaterial color="#111" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={rightLegRef} position={[0.14, 0.55, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.1, 0.38, 8]} />
          <meshStandardMaterial color="#0e0f14" roughness={0.80} />
        </mesh>
        <mesh position={[0, -0.48, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.34, 8]} />
          <meshStandardMaterial color="#0e0f14" roughness={0.80} />
        </mesh>
        <mesh position={[0, -0.67, 0.04]} castShadow>
          <boxGeometry args={[0.14, 0.1, 0.22]} />
          <meshStandardMaterial color="#111" roughness={0.5} metalness={0.2} />
        </mesh>
      </group>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.32, 1.12, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.32, 8]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.65} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.07, 0.28, 8]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.65} />
        </mesh>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.32, 1.12, 0]}>
        <mesh position={[0, -0.17, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.08, 0.32, 8]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.65} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.07, 0.28, 8]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.65} />
        </mesh>
      </group>

      {/* Head */}
      <mesh position={[0, 1.58, 0]} castShadow>
        <sphereGeometry args={[0.21, 14, 10]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.6} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.76, -0.01]} castShadow>
        <sphereGeometry args={[0.225, 12, 8]} />
        <meshStandardMaterial color="#2c1810" roughness={0.92} />
      </mesh>
      <mesh position={[-0.14, 1.64, 0.04]} castShadow>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#2c1810" roughness={0.92} />
      </mesh>
      <mesh position={[0.14, 1.64, 0.04]} castShadow>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#2c1810" roughness={0.92} />
      </mesh>
    </group>
  )
}
