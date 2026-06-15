"use client"
import { useEffect } from "react"

interface Props { interior: boolean }

export function CityAmbience({ interior }: Props) {
  useEffect(() => {
    let ctx: AudioContext | null = null
    let stopped = false

    const start = () => {
      if (stopped || ctx) return
      ctx = new AudioContext()

      const master = ctx.createGain()
      master.gain.setValueAtTime(0, ctx.currentTime)
      master.gain.linearRampToValueAtTime(interior ? 0.04 : 0.08, ctx.currentTime + 2.5)
      master.connect(ctx.destination)

      // ── Low drone ──────────────────────────────────────────
      const drone = ctx.createOscillator()
      const droneGain = ctx.createGain()
      drone.type = "sine"
      drone.frequency.value = interior ? 72 : 55
      droneGain.gain.value = interior ? 0.22 : 0.38
      drone.connect(droneGain)
      droneGain.connect(master)
      drone.start()

      // Second harmonic for richness
      const drone2 = ctx.createOscillator()
      const drone2Gain = ctx.createGain()
      drone2.type = "sine"
      drone2.frequency.value = interior ? 144 : 110
      drone2Gain.gain.value = 0.08
      drone2.connect(drone2Gain)
      drone2Gain.connect(master)
      drone2.start()

      // ── City noise (bandpass-filtered white noise) ─────────
      const bufferSize = ctx.sampleRate * 4
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.value = interior ? 600 : 180
      filter.Q.value = interior ? 1.2 : 0.6

      const noiseGain = ctx.createGain()
      noiseGain.gain.value = interior ? 0.06 : 0.14

      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(master)
      noise.start()

      // ── Slow LFO to modulate gain (gives "breathing" quality) ──
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = "sine"
      lfo.frequency.value = 0.05
      lfoGain.gain.value = 0.012
      lfo.connect(lfoGain)
      lfoGain.connect(master.gain)
      lfo.start()

      return { master, drone, drone2, noise, lfo }
    }

    // Defer until first user interaction (browser autoplay policy)
    let nodes: ReturnType<typeof start> | null = null
    const onInteract = () => {
      nodes = start()
      window.removeEventListener("click", onInteract)
      window.removeEventListener("keydown", onInteract)
    }
    window.addEventListener("click", onInteract)
    window.addEventListener("keydown", onInteract)

    return () => {
      stopped = true
      window.removeEventListener("click", onInteract)
      window.removeEventListener("keydown", onInteract)
      if (ctx && nodes) {
        nodes.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
        setTimeout(() => {
          try {
            nodes!.drone.stop()
            nodes!.drone2.stop()
            nodes!.noise.stop()
            nodes!.lfo.stop()
            ctx?.close()
          } catch {}
        }, 700)
      }
    }
  }, [interior])

  return null
}
