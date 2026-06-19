"use client"
import { useMemo, useEffect } from "react"
import * as THREE from "three"

/* Generate a window-pattern emissive texture on a canvas */
function makeWindowTex(cols: number, rows: number): THREE.CanvasTexture {
  const W = cols * 14, H = rows * 12
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, W, H)
  for (let r = 0; r < rows; r++) {
    for (let cl = 0; cl < cols; cl++) {
      if (Math.random() > 0.38) {
        const warm = Math.random() > 0.3
        ctx.fillStyle = warm ? "#E6B87A" : "#55D9D2"
        ctx.globalAlpha = 0.25 + Math.random() * 0.55
        ctx.fillRect(cl * 14 + 2, r * 12 + 2, 10, 8)
      }
    }
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/* Far background tower */
function SkyTower({
  x, z, w, d, h, accentColor,
}: {
  x: number; z: number; w: number; d: number; h: number; accentColor: string
}) {
  const winTex = useMemo(() => makeWindowTex(
    Math.max(2, Math.round(w / 3)),
    Math.max(4, Math.round(h / 6))
  ), [w, h])
  useEffect(() => () => { winTex.dispose() }, [winTex])

  return (
    <group position={[x, 0, z]}>
      {/* Tower body */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#0d0e12" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Front face emissive windows */}
      <mesh position={[0, h / 2, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.85, h * 0.85]} />
        <meshStandardMaterial
          color="#000"
          emissive="#ffffff"
          emissiveIntensity={0.9}
          emissiveMap={winTex}
          roughness={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Roofline accent */}
      <mesh position={[0, h + 0.3, 0]}>
        <boxGeometry args={[w + 0.6, 0.6, d + 0.6]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.8}
          roughness={0.4}
        />
      </mesh>
    </group>
  )
}

const SKYLINE_DATA = [
  // Distant (north, behind plaza)
  { x: -55, z: -210, w: 22, d: 12, h: 85,  accentColor: "#55D9D2" },
  { x: -30, z: -220, w: 16, d: 10, h: 110, accentColor: "#97D700" },
  { x:  -8, z: -230, w: 24, d: 14, h: 65,  accentColor: "#2B153F" },
  { x:  20, z: -215, w: 18, d: 12, h: 95,  accentColor: "#55D9D2" },
  { x:  48, z: -205, w: 20, d: 12, h: 75,  accentColor: "#A74B2A" },

  // Far left (west)
  { x: -80, z: -120, w: 28, d: 16, h: 90,  accentColor: "#55D9D2" },
  { x: -105,z: -80,  w: 18, d: 12, h: 120, accentColor: "#97D700" },
  { x: -90, z: -160, w: 22, d: 14, h: 70,  accentColor: "#2B153F" },
  { x: -120,z: -130, w: 14, d: 10, h: 55,  accentColor: "#55D9D2" },

  // Far right (east)
  { x:  80, z: -120, w: 28, d: 16, h: 88,  accentColor: "#A74B2A" },
  { x:  108,z: -80,  w: 18, d: 12, h: 115, accentColor: "#55D9D2" },
  { x:  92, z: -160, w: 22, d: 14, h: 68,  accentColor: "#97D700" },
  { x:  125,z: -130, w: 14, d: 10, h: 52,  accentColor: "#2B153F" },

  // Mansion hill backdrop
  { x: 75,  z: -50,  w: 20, d: 14, h: 42,  accentColor: "#E6B87A" },
  { x: 95,  z: -80,  w: 16, d: 10, h: 60,  accentColor: "#55D9D2" },

  // Elevated transit silhouette (bridge pillars)
  { x: -40, z: -190, w: 4, d: 4,  h: 28, accentColor: "#55D9D2" },
  { x: -20, z: -195, w: 4, d: 4,  h: 28, accentColor: "#55D9D2" },
  { x:  0,  z: -198, w: 4, d: 4,  h: 28, accentColor: "#55D9D2" },
  { x:  20, z: -195, w: 4, d: 4,  h: 28, accentColor: "#55D9D2" },
  { x:  40, z: -190, w: 4, d: 4,  h: 28, accentColor: "#55D9D2" },
]

/* Bridge beam connecting the pillars */
function ElevatedTransit() {
  return (
    <group>
      {/* Deck */}
      <mesh position={[0, 28, -194]}>
        <boxGeometry args={[88, 0.6, 3]} />
        <meshStandardMaterial color="#0e1016" roughness={0.9} />
      </mesh>
      {/* Underside glow strip */}
      <mesh position={[0, 27.5, -194]}>
        <boxGeometry args={[86, 0.12, 2.6]} />
        <meshStandardMaterial color="#55D9D2" emissive="#55D9D2" emissiveIntensity={1.2} roughness={0.4} />
      </mesh>
    </group>
  )
}

export function Skyline() {
  return (
    <group>
      {SKYLINE_DATA.map((b, i) => (
        <SkyTower key={i} {...b} />
      ))}
      <ElevatedTransit />
    </group>
  )
}
