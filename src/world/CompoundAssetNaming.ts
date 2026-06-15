/**
 * Compound World asset naming convention.
 *
 * Schema:  CW_[DISTRICT]_[ASSET]_[ANGLE]_[TIME]_[VERSION]
 *
 * Segments are underscore-delimited, SCREAMING_SNAKE_CASE.
 * Trailing segments are optional when not applicable to the asset type.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DISTRICT — world zone or cross-cutting category
 * ─────────────────────────────────────────────────────────────────────────────
 *   BEDROCK      Bedrock Residence district
 *   ACIDCANOPY   Acid Canopy biophilic corridor
 *   CHROME       Chrome Works industrial district
 *   GLACIER      Glacier district
 *   CRIMSON      Crimson Hall performance district
 *   DEEPVIOLET   Deep Violet archive district
 *   WORLD        Global / multi-district
 *   SIGN         Signage / billboard (any district)
 *   PLAYER       Player character
 *   CAT          Cat companion character
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ASSET — specific subject or structure within the district
 * ─────────────────────────────────────────────────────────────────────────────
 *   RESIDENCE    Residential building
 *   WORKSHOP     Workshop / fabrication building
 *   GREENHOUSE   Greenhouse structure
 *   STREET       Street / boulevard scene
 *   MAP          District or world map display
 *   PORTAL       Portal aperture
 *   SIGN         Specific sign face
 *   UNIVERSE     Universe of Design branding
 *   COMPOUND     COMPOUND studio branding
 *   WALK         Walking animation / reference
 *   IDLE         Idle animation / reference
 *   WINDOW       Window surface / transparency
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ANGLE — framing or view type (omit for ambience/loops)
 * ─────────────────────────────────────────────────────────────────────────────
 *   FRONT        Front elevation
 *   SIDE         Side elevation / profile
 *   INTERIOR     Interior perspective
 *   AERIAL       Top-down or bird's-eye
 *   GAMEPLAY     Low third-person gameplay camera
 *   LOOP         Seamless looping content (video)
 *   REFERENCE    Production reference sheet (image)
 *   WINDOW       Window / aperture view
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TIME — lighting / temporal context (omit for neutral / loop content)
 * ─────────────────────────────────────────────────────────────────────────────
 *   DAY          Daylight / overcast
 *   NIGHT        Night / artificial light
 *   BLUEHOUR     Blue hour / civil twilight
 *   LOOP         Neutral / timeless (used in ANGLE slot when appropriate)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VERSION — iteration counter, zero-padded to 2 digits
 * ─────────────────────────────────────────────────────────────────────────────
 *   V01 … V99
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Examples from the spec
 * ─────────────────────────────────────────────────────────────────────────────
 *   CW_BEDROCK_RESIDENCE_FRONT_DAY_V01         building reference image
 *   CW_BEDROCK_STREET_GAMEPLAY_NIGHT_V03       gameplay screenshot reference
 *   CW_ACIDCANOPY_GREENHOUSE_INTERIOR_V02      interior reference image
 *   CW_CHROME_WORKSHOP_WINDOW_LOOP_V04         video texture loop
 *   CW_PLAYER_WALK_REFERENCE_SIDE_V01          character walk reference image
 *   CW_CAT_IDLE_REFERENCE_SIDE_V02             character idle reference image
 *   CW_SIGN_UNIVERSE_LOOP_V05                  video texture loop
 */

/** Full asset name with extension, e.g. "CW_SIGN_UNIVERSE_LOOP_V05.mp4" */
export type CWAssetName = `CW_${string}`;

export const CW_DISTRICTS = [
  "BEDROCK", "ACIDCANOPY", "CHROME", "GLACIER",
  "CRIMSON", "DEEPVIOLET", "WORLD", "SIGN", "PLAYER", "CAT",
] as const;

export const CW_ANGLES = [
  "FRONT", "SIDE", "INTERIOR", "AERIAL",
  "GAMEPLAY", "LOOP", "REFERENCE", "WINDOW",
] as const;

export const CW_TIMES = ["DAY", "NIGHT", "BLUEHOUR", "LOOP"] as const;

export type CWDistrict = typeof CW_DISTRICTS[number];
export type CWAngle    = typeof CW_ANGLES[number];
export type CWTime     = typeof CW_TIMES[number];

/** Derive the public path for a CW-named video texture. */
export function cwVideoPath(name: CWAssetName): string {
  return `/compound-world/video-textures/${name}.mp4`;
}

/** Derive the public path for a CW-named reference image. */
export function cwReferencePath(name: CWAssetName): string {
  return `/compound-world/references/${name}.png`;
}

/** Derive the public path for a CW-named GLB model. */
export function cwModelPath(name: CWAssetName): string {
  return `/compound-world/models/${name}.glb`;
}
