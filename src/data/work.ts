/* Selected Work — placeholder projects.
   These are conceptual studies, not commissioned work, and are labelled
   as such throughout the site. Replace with real client projects as they
   become available; the shape (slug, category, four stanzas) is designed
   so a real project drops in without any structural changes. */

export type WorkCategory = "weddings" | "events" | "brands" | "spaces"

export type WorkProject = {
  slug: string
  title: string
  category: string
  filterCategory: WorkCategory
  location: string
  year: string
  status: "Conceptual" | "Commissioned"
  hex: string
  concept: string
  direction: string
  material: string
  experience: string
}

export const WORK: WorkProject[] = [
  {
    slug: "a-study-in-ceremony",
    title: "A Study in Ceremony",
    category: "Wedding",
    filterCategory: "weddings",
    location: "Toronto, ON",
    year: "2026",
    status: "Conceptual",
    hex: "#3D2645",
    concept: "A ceremony grounded in ritual, not spectacle: an exploration of how colour and material can hold the weight of a vow.",
    direction: "Deep plum and aged brass, candlelight over daylight, texture over polish.",
    material: "Raw linen, hand thrown ceramics, dried botanicals, unbleached wax.",
    experience: "Guests move through three distinct atmospheres, arrival, ceremony, and gathering, each with its own material language.",
  },
  {
    slug: "the-long-table",
    title: "The Long Table",
    category: "Private Dinner",
    filterCategory: "events",
    location: "Toronto, ON",
    year: "2026",
    status: "Conceptual",
    hex: "#1B3A2D",
    concept: "A single table, thirty feet long, built to hold a conversation that lasts all night.",
    direction: "Low light, deep green, and a table setting that unfolds course by course.",
    material: "Reclaimed oak, hand blown glass, linen napery, foraged greenery.",
    experience: "The table itself becomes the evening's only fixed point. Everything else moves around it.",
  },
  {
    slug: "bloom-and-bone",
    title: "Bloom & Bone",
    category: "Brand World",
    filterCategory: "brands",
    location: "Toronto, ON",
    year: "2026",
    status: "Conceptual",
    hex: "#8B3A1E",
    concept: "A floral studio's entire visual world, built from the tension between something living and something structural.",
    direction: "Terracotta and bone white, botanical but architectural.",
    material: "Pressed flowers, unglazed clay, kraft paper, raw steel fixtures.",
    experience: "From packaging to storefront, every touchpoint carries the same quiet contradiction.",
  },
  {
    slug: "cast-in-cobalt",
    title: "Cast in Cobalt",
    category: "Pop Up",
    filterCategory: "events",
    location: "Toronto, ON",
    year: "2026",
    status: "Conceptual",
    hex: "#0047AB",
    concept: "A five day pop up built entirely around a single colour.",
    direction: "Cobalt blue, saturated and total, used as architecture rather than accent.",
    material: "Powder coated steel, dyed fabric, cast resin objects.",
    experience: "Visitors enter a space with no neutral surfaces. The colour becomes the environment.",
  },
  {
    slug: "a-room-held",
    title: "A Room, Held",
    category: "Spatial Installation",
    filterCategory: "spaces",
    location: "Toronto, ON",
    year: "2026",
    status: "Conceptual",
    hex: "#6ECECE",
    concept: "An installation exploring stillness: a room designed to slow down anyone who enters it.",
    direction: "Glacier blue and soft light, minimal object, maximum atmosphere.",
    material: "Frosted glass, poured concrete, still water, suspended fabric.",
    experience: "No programme, no signage. Just a held moment in the middle of the day.",
  },
]
