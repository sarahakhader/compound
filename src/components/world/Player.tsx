"use client"
import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
/* ── Collision helpers ── */
interface Collider { x: number; z: number; hw: number; hd: number }

function checkCollision(
  px: number, pz: number,
  radius: number,
  colliders: Collider[]
): boolean {
  if (px < -16 || px > 16 || pz > 14 || pz < -168) return true
  for (const c of colliders) {
    if (
      Math.abs(px - c.x) < c.hw + radius &&
      Math.abs(pz - c.z) < c.hd + radius
    ) return true
  }
  return false
}

export interface PlayerProps {
  colliders: Collider[]
  onExit: () => void
}

const WALK_SPEED = 4.2
const RUN_SPEED  = 7.2
const CAM_BEHIND = 4.5
const CAM_ABOVE  = 2.8
const CAM_LERP   = 0.09
const MOUSE_SENS = 0.0022

export function Player({ colliders, onExit }: PlayerProps) {
  const { camera, gl } = useThree()

  const posRef  = useRef(new THREE.Vector3(0, 0, 8))
  const yawRef  = useRef(0)         // face -Z (into the city) on start
  const pitchRef = useRef(-0.10)
  const keysRef = useRef<Record<string, boolean>>({})
  const lockRef = useRef(false)
  const meshRef = useRef<THREE.Group>(null!)

  /* ── Pointer lock ── */
  useEffect(() => {
    const canvas = gl.domElement

    const onPointerLockChange = () => {
      lockRef.current = document.pointerLockElement === canvas
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!lockRef.current) return
      yawRef.current  += e.movementX * MOUSE_SENS
      pitchRef.current = Math.max(-0.4, Math.min(0.35,
        pitchRef.current - e.movementY * MOUSE_SENS
      ))
    }
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true
      if (e.code === "Escape") {
        if (lockRef.current) {
          document.exitPointerLock()
        } else {
          onExit()
        }
      }
      if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) {
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }
    const onClick = () => {
      if (!lockRef.current) canvas.requestPointerLock()
    }

    canvas.addEventListener("click", onClick)
    document.addEventListener("pointerlockchange", onPointerLockChange)
    document.addEventListener("mousemove", onMouseMove)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)

    return () => {
      canvas.removeEventListener("click", onClick)
      document.removeEventListener("pointerlockchange", onPointerLockChange)
      document.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      if (document.pointerLockElement === canvas) document.exitPointerLock()
    }
  }, [gl, onExit])

  /* ── Frame loop ── */
  const camPos = useRef(new THREE.Vector3())
  const camTarget = useRef(new THREE.Vector3())
  const walkPhase = useRef(0)

  useFrame((_, dt) => {
    const k = keysRef.current
    const speed = k["ShiftLeft"] || k["ShiftRight"] ? RUN_SPEED : WALK_SPEED
    const yaw = yawRef.current

    /* Direction vectors flat on XZ */
    const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw))
    const right = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw))

    let dx = 0, dz = 0
    if (k["KeyW"] || k["ArrowUp"])    { dx += fwd.x; dz += fwd.z }
    if (k["KeyS"] || k["ArrowDown"])  { dx -= fwd.x; dz -= fwd.z }
    if (k["KeyA"] || k["ArrowLeft"])  { dx -= right.x; dz -= right.z }
    if (k["KeyD"] || k["ArrowRight"]) { dx += right.x; dz += right.z }

    const len = Math.hypot(dx, dz)
    const moving = len > 0.01
    if (moving) { dx /= len; dz /= len }

    const step = speed * Math.min(dt, 0.05)
    const pos = posRef.current

    /* Slide collision on X then Z separately */
    const nx = pos.x + dx * step
    const nz = pos.z + dz * step
    if (!checkCollision(nx, pos.z, 0.42, colliders)) pos.x = nx
    if (!checkCollision(pos.x, nz, 0.42, colliders)) pos.z = nz

    /* Walk bob */
    if (moving) walkPhase.current += dt * 7.5
    const bob = moving ? Math.sin(walkPhase.current) * 0.055 : 0

    /* Place player mesh */
    if (meshRef.current) {
      meshRef.current.position.set(pos.x, bob, pos.z)
      meshRef.current.rotation.y = yaw
    }

    /* Camera position: behind and above */
    const targetCamPos = new THREE.Vector3(
      pos.x + Math.sin(yaw) * CAM_BEHIND,
      CAM_ABOVE,
      pos.z + Math.cos(yaw) * CAM_BEHIND
    )
    camPos.current.lerp(targetCamPos, CAM_LERP)
    camera.position.copy(camPos.current)

    /* Look target: player chest height, ahead slightly */
    const lookTarget = new THREE.Vector3(
      pos.x - Math.sin(yaw) * 0.5,
      1.0,
      pos.z - Math.cos(yaw) * 0.5
    )
    camTarget.current.lerp(lookTarget, CAM_LERP * 1.5)

    /* Apply pitch via look direction (no matrix gymnastics needed) */
    const pitchOffset = pitchRef.current
    camera.position.y += pitchOffset * 1.2
    camera.lookAt(camTarget.current)
  })

  return (
    <group ref={meshRef}>
      {/* Capsule body */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.9, 4, 12]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 8]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.65} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.78, -0.02]} castShadow>
        <sphereGeometry args={[0.22, 10, 6]} />
        <meshStandardMaterial color="#2c1810" roughness={0.9} />
      </mesh>
      {/* Acid crop top */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.32, 0.45, 10]} />
        <meshStandardMaterial color="#97D700" roughness={0.55} emissive="#97D700" emissiveIntensity={0.15} />
      </mesh>
      {/* Plum trousers */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.31, 0.3, 0.65, 10]} />
        <meshStandardMaterial color="#3D2645" roughness={0.75} />
      </mesh>
    </group>
  )
}
