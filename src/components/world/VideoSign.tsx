"use client"
import { useRef, useEffect } from "react"
import * as THREE from "three"

interface VideoSignProps {
  src:        string              // public/-relative path, e.g. "/sign-concrete.mp4"
  width:      number              // screen width in world units
  height:     number              // screen height in world units
  position:   [number, number, number]
  rotation?:  [number, number, number]
  intensity?: number              // emissiveIntensity (default 1.5)
  fallback?:  string              // emissive colour shown before video loads
}

export function VideoSign({
  src, width, height, position,
  rotation   = [0, 0, 0],
  intensity  = 1.5,
  fallback   = "#111318",
}: VideoSignProps) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    /* Create video element — muted so autoplay is never blocked */
    const vid = document.createElement("video")
    vid.src         = src
    vid.loop        = true
    vid.muted       = true
    vid.playsInline = true
    vid.play().catch(() => {/* autoplay blocked — video stays paused, fallback colour shows */})

    /* VideoTexture polls readyState each frame; Three.js updates it automatically */
    const tex = new THREE.VideoTexture(vid)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter  = THREE.LinearFilter
    tex.magFilter  = THREE.LinearFilter

    const mat = mesh.material as THREE.MeshStandardMaterial
    mat.emissiveMap       = tex
    mat.emissive.set("#ffffff")
    mat.emissiveIntensity = intensity
    mat.needsUpdate       = true

    return () => {
      vid.pause()
      vid.src = ""
      tex.dispose()
      if (mesh.material) {
        const m = mesh.material as THREE.MeshStandardMaterial
        m.emissiveMap       = null
        m.emissive.set(fallback)
        m.emissiveIntensity = 0.3
        m.needsUpdate       = true
      }
    }
  }, [src, intensity, fallback])

  return (
    <group position={position} rotation={rotation}>
      {/* Physical backing — dark metal frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[width + 0.35, height + 0.35, 0.08]} />
        <meshStandardMaterial color="#080a0d" roughness={0.82} metalness={0.22} />
      </mesh>

      {/* Inner bezel */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[width + 0.10, height + 0.10, 0.04]} />
        <meshStandardMaterial color="#050608" roughness={0.88} metalness={0.14} />
      </mesh>

      {/* Screen surface — emissiveMap set in useEffect */}
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#000000"
          emissive={fallback}
          emissiveIntensity={0.3}
          roughness={0.18}
          metalness={0.04}
        />
      </mesh>

      {/* Thin emissive accent bar along bottom edge */}
      <mesh position={[0, -(height / 2 + 0.08), 0]}>
        <boxGeometry args={[width + 0.1, 0.06, 0.04]} />
        <meshStandardMaterial color="#C8C9C7" emissive="#C8C9C7" emissiveIntensity={1.2} roughness={0.3} />
      </mesh>
    </group>
  )
}
