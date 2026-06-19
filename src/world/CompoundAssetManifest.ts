import { cwVideoPath, cwReferencePath, type CWAssetName } from "./CompoundAssetNaming";

const v = (name: CWAssetName) => cwVideoPath(name);
const r = (name: CWAssetName) => cwReferencePath(name);

export const COMPOUND_ASSETS = {
  buildings: {
    bedrockResidence:
      "/compound-world/models/buildings/bedrock-residence.glb",
    acidCanopyLab:
      "/compound-world/models/buildings/acid-canopy-lab.glb",
    chromeWorkshop:
      "/compound-world/models/buildings/chrome-workshop.glb",
    glacierBath:
      "/compound-world/models/buildings/glacier-bath.glb",
    crimsonHall:
      "/compound-world/models/buildings/crimson-performance-hall.glb",
    violetArchive:
      "/compound-world/models/buildings/deep-violet-archive.glb",
  },

  character: {
    player: "/compound-world/models/characters/player.glb",
    cat:    "/compound-world/models/characters/cat-companion.glb",
  },

  video: {
    compoundSign:     "/compound-world/video-textures/neon-compound-loop.mp4",
    universeOfDesign: v("CW_SIGN_UNIVERSE_LOOP_V05"),
    portal:           "/compound-world/video-textures/portal-loop.mp4",
    districtMap:      "/compound-world/video-textures/holographic-map-loop.mp4",
    workshop:         v("CW_CHROME_WORKSHOP_WINDOW_LOOP_V04"),
  },

  references: {
    bedrockResidenceFront:    r("CW_BEDROCK_RESIDENCE_FRONT_DAY_V01"),
    bedrockStreetGameplay:    r("CW_BEDROCK_STREET_GAMEPLAY_NIGHT_V03"),
    acidCanopyGreenhouseInt:  r("CW_ACIDCANOPY_GREENHOUSE_INTERIOR_V02"),
    playerWalkRef:            r("CW_PLAYER_WALK_REFERENCE_SIDE_V01"),
    catIdleRef:               r("CW_CAT_IDLE_REFERENCE_SIDE_V02"),
  },
} as const;
