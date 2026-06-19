/* ─────────────────────────────────────────────────────────────────────────────
   COMPOUND WORLD — Master Configuration
   Single source of truth for palette, districts, scale, and material tokens.
───────────────────────────────────────────────────────────────────────────── */

/* ── Color system ─────────────────────────────────────────────────────────── */
export const COLORS = {
  // Structural darks
  nightSky:      "#05070B",
  deepJungle:    "#07100D",
  // Neutrals
  chrome:        "#C8C9C7",
  concrete:      "#3A3C42",
  concreteLight: "#6B6C70",
  // Accents
  glacier:       "#55D9D2",
  acidCanopy:    "#97D700",
  crimson:       "#BA0C2F",
  terracotta:    "#A74B2A",
  deepViolet:    "#2B153F",
  // Warm
  warmInterior:  "#E6B87A",
  amber:         "#C87A20",
} as const

export type ColorKey = keyof typeof COLORS

/* ── District registry ────────────────────────────────────────────────────── */
export interface DistrictConfig {
  id:       string
  name:     string
  /** World-space centre of district */
  center:   [number, number, number]
  /** Primary accent colour */
  accent:   string
  /** Architectural identity tag */
  identity: "geological" | "biophilic" | "industrial" | "aquatic" | "cultural" | "experimental"
  /** Ambient light color override for district */
  ambientColor: string
  ambientIntensity: number
}

export const DISTRICTS: Record<string, DistrictConfig> = {
  bedrock: {
    id:               "bedrock",
    name:             "BEDROCK",
    center:           [-55, 0, -60],
    accent:           COLORS.terracotta,
    identity:         "geological",
    ambientColor:     "#3a1a08",
    ambientIntensity: 0.55,
  },
  acidCanopy: {
    id:               "acidCanopy",
    name:             "ACID CANOPY",
    center:           [0, 0, -120],
    accent:           COLORS.acidCanopy,
    identity:         "biophilic",
    ambientColor:     "#0a1f05",
    ambientIntensity: 0.45,
  },
  chrome: {
    id:               "chrome",
    name:             "CHROME WORKS",
    center:           [60, 0, -80],
    accent:           COLORS.chrome,
    identity:         "industrial",
    ambientColor:     "#1a1e28",
    ambientIntensity: 0.4,
  },
  glacier: {
    id:               "glacier",
    name:             "GLACIER",
    center:           [-60, 0, -160],
    accent:           COLORS.glacier,
    identity:         "aquatic",
    ambientColor:     "#051828",
    ambientIntensity: 0.5,
  },
  crimson: {
    id:               "crimson",
    name:             "CRIMSON QUARTER",
    center:           [0, 0, -50],
    accent:           COLORS.crimson,
    identity:         "cultural",
    ambientColor:     "#200508",
    ambientIntensity: 0.45,
  },
  deepViolet: {
    id:               "deepViolet",
    name:             "DEEP VIOLET",
    center:           [0, 40, -200],
    accent:           COLORS.deepViolet,
    identity:         "experimental",
    ambientColor:     "#0d0518",
    ambientIntensity: 0.42,
  },
}

/* ── World scale constants ────────────────────────────────────────────────── */
export const WORLD = {
  /** Main boulevard Z range */
  boulevardStart: 14,
  boulevardEnd:   -168,
  /** Road half-width */
  roadHW:         11,
  /** Sidewalk offset from road centre */
  sidewalkX:      12.8,
  /** Player walk / run speeds (m/s) */
  walkSpeed:      4.2,
  runSpeed:       7.2,
  /** Camera offset */
  camBehind:      4.5,
  camAbove:       2.6,
} as const

/* ── Material tokens ──────────────────────────────────────────────────────── */
export const MAT = {
  asphalt:      { color: "#0c0d12", roughness: 0.22, metalness: 0.08 },
  concrete:     { color: "#22242e", roughness: 0.90, metalness: 0.02 },
  terracotta:   { color: "#5c2a14", roughness: 0.88, metalness: 0.02 },
  basalt:       { color: "#111215", roughness: 0.92, metalness: 0.04 },
  darkMetal:    { color: "#15171e", roughness: 0.55, metalness: 0.85 },
  chromeMetal:  { color: "#C8C9C7", roughness: 0.22, metalness: 0.92 },
  smoked:       { color: "#1a2535", roughness: 0.04, metalness: 0.90 },
  warmGlass:    { color: "#E6B87A", roughness: 0.06, metalness: 0.15 },
} as const
