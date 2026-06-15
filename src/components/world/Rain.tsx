"use client"
import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const SPREAD_X   = 80
const SPREAD_Z   = 200
const SPREAD_Y   = 60
const FALL_SPEED = 18
const WIND_X     = -0.8

export function Rain({ count = 4000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!)

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * SPREAD_X
      pos[i * 3 + 1] = Math.random() * SPREAD_Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z - 70
      vel[i] = 0.7 + Math.random() * 0.6
    }
    return [pos, vel]
  }, [count])

  useFrame((_, dt) => {
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3]     += WIND_X * dt * velocities[i]
      pos[i * 3 + 1] -= FALL_SPEED * dt * velocities[i]
      if (pos[i * 3 + 1] < -1) {
        pos[i * 3]     = (Math.random() - 0.5) * SPREAD_X
        pos[i * 3 + 1] = SPREAD_Y
        pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z - 70
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color="#aac8e8"
        size={0.08}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
