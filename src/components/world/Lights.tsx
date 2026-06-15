"use client"
import { useMemo } from "react"
import * as THREE from "three"

/* Sculptural streetlight positions along the boulevard */
const LAMP_POSITIONS: [number, number, number][] = []
for (let z = 8; z > -148; z -= 18) {
  LAMP_POSITIONS.push([-13.2, 0, z])
  LAMP_POSITIONS.push([13.2, 0, z])
}

function StreetLight({ position, lit }: { position: [number, number, number]; lit: boolean }) {
  const [x] = position
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 4.25, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 8.5, 8]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.6} metalness={0.8} />
      </mesh>
      {/* Arm */}
      <mesh position={[x < 0 ? 0.7 : -0.7, 8.4, 0]} rotation={[0, 0, x < 0 ? -0.18 : 0.18]}>
        <boxGeometry args={[1.4, 0.06, 0.06]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.6} metalness={0.8} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[x < 0 ? 1.35 : -1.35, 8.3, 0]}>
        <boxGeometry args={[0.5, 0.18, 0.28]} />
        <meshStandardMaterial color="#252830" roughness={0.4} metalness={0.9} />
      </mesh>
      {/* Emissive lamp element */}
      <mesh position={[x < 0 ? 1.35 : -1.35, 8.2, 0]}>
        <boxGeometry args={[0.38, 0.05, 0.22]} />
        <meshStandardMaterial color="#E6B87A" emissive="#E6B87A" emissiveIntensity={3} roughness={0.4} />
      </mesh>
      {/* Point light — only every 3rd pair to limit GPU light count */}
      {lit && (
        <pointLight
          position={[x < 0 ? 1.35 : -1.35, 7.9, 0]}
          color="#E6B87A"
          intensity={42}
          distance={32}
          decay={2}
        />
      )}
    </group>
  )
}

export function Lights() {
  return (
    <>
      {/* Overcast moon */}
      <directionalLight position={[30, 80, 20]} intensity={0.85} color="#c0cce0" />

      {/* Hemisphere fill */}
      <hemisphereLight args={["#1a2a40", "#07100D", 0.65]} />

      {/* Ambient base */}
      <ambientLight intensity={0.14} color="#0e1428" />

      {/* Boulevard streetlights — emissive mesh at all positions, point light every 3rd pair */}
      {LAMP_POSITIONS.map((pos, i) => (
        <StreetLight key={i} position={pos} lit={i % 6 < 2} />
      ))}

      {/* Plaza flood — Glacier accent */}
      <spotLight
        position={[0, 25, -145]}
        angle={0.55}
        penumbra={0.6}
        intensity={80}
        color="#55D9D2"
        distance={80}
        decay={2}
        castShadow={false}
      />

      {/* Mansion warm interior spill */}
      <pointLight
        position={[70, 6, -60]}
        color="#E6B87A"
        intensity={60}
        distance={40}
        decay={2}
      />

      {/* Far atmospheric fill — slight violet */}
      <pointLight
        position={[0, 40, -180]}
        color="#2B153F"
        intensity={30}
        distance={120}
        decay={1.5}
      />
    </>
  )
}
