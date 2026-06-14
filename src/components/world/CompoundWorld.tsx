"use client"
import { Suspense, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import * as THREE from "three"
import { Player } from "./Player"
import { City, COLLIDERS } from "./City"
import { Skyline } from "./Skyline"
import { Rain } from "./Rain"
import { Lights } from "./Lights"

interface Props { onExit: () => void }

function Scene({ onExit }: Props) {
  return (
    <>
      <color attach="background" args={["#05070B"]} />
      <fogExp2 attach="fog" args={["#07100D", 0.011]} />

      <Lights />

      <Suspense fallback={null}>
        <City />
        <Skyline />
        <Rain />
        <Player colliders={COLLIDERS} onExit={onExit} />
      </Suspense>

      <EffectComposer>
        <Bloom
          intensity={0.45}
          luminanceThreshold={0.75}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}

export function CompoundWorld({ onExit }: Props) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99998,
        background: "#05070B", overflow: "hidden",
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.88,
        }}
        camera={{ fov: 72, near: 0.1, far: 700, position: [0, 1.6, 12] }}
      >
        <Scene onExit={onExit} />
      </Canvas>

      {/* HUD */}
      <div style={{
        position: "absolute", top: 16, left: 20,
        fontFamily: "'Courier New', monospace",
        fontSize: 9, letterSpacing: "0.28em", color: "#B5CC45",
        pointerEvents: "none",
      }}>
        <span style={{ opacity: 0.5 }}>COMPOUND</span>{" "}
        <span style={{ color: "rgba(237,228,216,0.25)" }}>WORLD</span>
      </div>

      <div style={{
        position: "absolute", bottom: 20, left: "50%",
        transform: "translateX(-50%)",
        fontFamily: "'Courier New', monospace",
        fontSize: 8.5, letterSpacing: "0.18em",
        color: "rgba(237,228,216,0.22)",
        pointerEvents: "none", whiteSpace: "nowrap",
      }}>
        CLICK TO LOOK   ·   WASD MOVE   ·   SHIFT RUN   ·   ESC EXIT
      </div>

      <button
        onClick={onExit}
        style={{
          position: "absolute", top: 14, right: 16,
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(237,228,216,0.14)",
          color: "rgba(237,228,216,0.4)",
          fontFamily: "'Courier New', monospace",
          fontSize: 8.5, letterSpacing: "0.2em",
          padding: "6px 14px", cursor: "pointer",
        }}
      >
        ✕ EXIT
      </button>
    </div>
  )
}
