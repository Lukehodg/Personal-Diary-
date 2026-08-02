import type { CategoryId, EquipmentId, MuscleId } from "@/lib/wger"

/**
 * Common exercises mapped onto wger's taxonomy (see `wger.ts`). Primary
 * muscles are the ones the lift is for; secondary muscles get half weighting
 * when volume is totted up, which is the usual convention.
 *
 * `aliases` catch the shorthand people actually type — "ohp", "rdl", "bp".
 */
export interface CatalogExercise {
  name: string
  category: CategoryId
  primary: MuscleId[]
  secondary: MuscleId[]
  equipment: EquipmentId[]
  aliases?: string[]
}

// Muscle ids: 1 biceps, 2 front delt, 3 serratus, 4 pecs, 5 triceps, 6 abs,
// 7 gastroc, 8 glutes, 9 traps, 10 quads, 11 hamstrings, 12 lats,
// 13 brachialis, 14 obliques, 15 soleus, 16 erector spinae
// Categories: 8 arms, 9 legs, 10 abs, 11 chest, 12 back, 13 shoulders,
// 14 calves, 15 cardio
// Equipment: 1 barbell, 2 sz-bar, 3 dumbbell, 4 mat, 5 swiss ball,
// 6 pull-up bar, 7 bodyweight, 8 bench, 9 incline bench, 10 kettlebell,
// 11 band, 12 cable

export const EXERCISE_CATALOG: CatalogExercise[] = [
  /* ---------------------------- Chest ---------------------------- */
  { name: "Bench press", category: 11, primary: [4], secondary: [5, 2], equipment: [1, 8], aliases: ["bp", "barbell bench press", "flat bench"] },
  { name: "Incline bench press", category: 11, primary: [4], secondary: [2, 5], equipment: [1, 9], aliases: ["incline press", "incline barbell press"] },
  { name: "Decline bench press", category: 11, primary: [4], secondary: [5], equipment: [1, 8] },
  { name: "Dumbbell bench press", category: 11, primary: [4], secondary: [5, 2], equipment: [3, 8], aliases: ["db bench", "db bench press"] },
  { name: "Incline dumbbell press", category: 11, primary: [4], secondary: [2, 5], equipment: [3, 9] },
  { name: "Dumbbell fly", category: 11, primary: [4], secondary: [2], equipment: [3, 8], aliases: ["chest fly", "flye", "dumbbell flye"] },
  { name: "Cable fly", category: 11, primary: [4], secondary: [2], equipment: [12], aliases: ["cable crossover", "crossover"] },
  { name: "Push up", category: 11, primary: [4], secondary: [5, 2, 6], equipment: [7], aliases: ["pushup", "press up", "pressup"] },
  { name: "Dip", category: 11, primary: [4], secondary: [5, 2], equipment: [7], aliases: ["chest dip", "dips", "parallel bar dip"] },
  { name: "Machine chest press", category: 11, primary: [4], secondary: [5, 2], equipment: [12] },
  { name: "Pec deck", category: 11, primary: [4], secondary: [], equipment: [12], aliases: ["machine fly"] },
  { name: "Svend press", category: 11, primary: [4], secondary: [2], equipment: [7] },

  /* ---------------------------- Back ----------------------------- */
  { name: "Deadlift", category: 12, primary: [16, 8, 11], secondary: [9, 12, 10], equipment: [1], aliases: ["conventional deadlift", "dl"] },
  { name: "Sumo deadlift", category: 12, primary: [8, 10, 16], secondary: [11, 9], equipment: [1] },
  { name: "Barbell row", category: 12, primary: [12], secondary: [1, 9, 16], equipment: [1], aliases: ["bent over row", "bent-over row", "pendlay row"] },
  { name: "Dumbbell row", category: 12, primary: [12], secondary: [1, 9], equipment: [3], aliases: ["single arm row", "one arm row", "db row"] },
  { name: "Seated cable row", category: 12, primary: [12], secondary: [1, 9], equipment: [12], aliases: ["cable row", "seated row"] },
  { name: "Pull up", category: 12, primary: [12], secondary: [1, 13, 9], equipment: [6], aliases: ["pullup", "pull-up"] },
  { name: "Chin up", category: 12, primary: [12, 1], secondary: [13, 9], equipment: [6], aliases: ["chinup", "chin-up"] },
  { name: "Lat pulldown", category: 12, primary: [12], secondary: [1, 13], equipment: [12], aliases: ["pulldown", "lat pull down"] },
  { name: "T-bar row", category: 12, primary: [12], secondary: [1, 9, 16], equipment: [1], aliases: ["t bar row", "tbar row"] },
  { name: "Face pull", category: 12, primary: [9], secondary: [2], equipment: [12] },
  { name: "Shrug", category: 12, primary: [9], secondary: [], equipment: [1, 3], aliases: ["barbell shrug", "dumbbell shrug", "shrugs"] },
  { name: "Straight arm pulldown", category: 12, primary: [12], secondary: [5], equipment: [12], aliases: ["pullover"] },
  { name: "Inverted row", category: 12, primary: [12], secondary: [1, 9], equipment: [7], aliases: ["australian pull up", "body row"] },
  { name: "Good morning", category: 12, primary: [16, 11], secondary: [8], equipment: [1] },
  { name: "Back extension", category: 12, primary: [16], secondary: [8, 11], equipment: [7], aliases: ["hyperextension", "hyper extension"] },
  { name: "Rack pull", category: 12, primary: [16, 9], secondary: [12, 8], equipment: [1] },

  /* -------------------------- Shoulders -------------------------- */
  { name: "Overhead press", category: 13, primary: [2], secondary: [5, 9], equipment: [1], aliases: ["ohp", "military press", "shoulder press", "strict press", "barbell shoulder press"] },
  { name: "Dumbbell shoulder press", category: 13, primary: [2], secondary: [5], equipment: [3], aliases: ["db shoulder press", "seated dumbbell press"] },
  { name: "Arnold press", category: 13, primary: [2], secondary: [5], equipment: [3] },
  { name: "Lateral raise", category: 13, primary: [2], secondary: [9], equipment: [3], aliases: ["side raise", "lat raise", "dumbbell lateral raise"] },
  { name: "Front raise", category: 13, primary: [2], secondary: [], equipment: [3] },
  { name: "Rear delt fly", category: 13, primary: [2], secondary: [9], equipment: [3], aliases: ["reverse fly", "rear delt raise", "bent over fly"] },
  { name: "Upright row", category: 13, primary: [2, 9], secondary: [1], equipment: [1], aliases: ["barbell upright row"] },
  { name: "Push press", category: 13, primary: [2], secondary: [5, 10], equipment: [1] },
  { name: "Landmine press", category: 13, primary: [2], secondary: [4, 5], equipment: [1] },

  /* ---------------------------- Arms ----------------------------- */
  { name: "Bicep curl", category: 8, primary: [1], secondary: [13], equipment: [3], aliases: ["dumbbell curl", "curl", "biceps curl", "db curl"] },
  { name: "Barbell curl", category: 8, primary: [1], secondary: [13], equipment: [1] },
  { name: "EZ bar curl", category: 8, primary: [1], secondary: [13], equipment: [2], aliases: ["ez curl", "sz bar curl"] },
  { name: "Hammer curl", category: 8, primary: [13, 1], secondary: [], equipment: [3] },
  { name: "Preacher curl", category: 8, primary: [1], secondary: [13], equipment: [2, 8] },
  { name: "Concentration curl", category: 8, primary: [1], secondary: [], equipment: [3] },
  { name: "Cable curl", category: 8, primary: [1], secondary: [13], equipment: [12] },
  { name: "Tricep pushdown", category: 8, primary: [5], secondary: [], equipment: [12], aliases: ["pushdown", "triceps pushdown", "rope pushdown", "cable pushdown"] },
  { name: "Skull crusher", category: 8, primary: [5], secondary: [], equipment: [2, 8], aliases: ["lying tricep extension", "skullcrusher", "french press"] },
  { name: "Overhead tricep extension", category: 8, primary: [5], secondary: [], equipment: [3], aliases: ["tricep extension", "triceps extension", "overhead extension"] },
  { name: "Close grip bench press", category: 8, primary: [5], secondary: [4, 2], equipment: [1, 8], aliases: ["close-grip bench", "cgbp"] },
  { name: "Tricep dip", category: 8, primary: [5], secondary: [4], equipment: [7], aliases: ["bench dip", "triceps dip"] },
  { name: "Tricep kickback", category: 8, primary: [5], secondary: [], equipment: [3], aliases: ["kickback"] },
  { name: "Wrist curl", category: 8, primary: [13], secondary: [], equipment: [3] },

  /* ---------------------------- Legs ----------------------------- */
  { name: "Back squat", category: 9, primary: [10, 8], secondary: [11, 16], equipment: [1], aliases: ["squat", "barbell squat", "high bar squat", "low bar squat"] },
  { name: "Front squat", category: 9, primary: [10], secondary: [8, 16], equipment: [1] },
  { name: "Goblet squat", category: 9, primary: [10, 8], secondary: [6], equipment: [3, 10] },
  { name: "Leg press", category: 9, primary: [10, 8], secondary: [11], equipment: [12] },
  { name: "Romanian deadlift", category: 9, primary: [11, 8], secondary: [16], equipment: [1], aliases: ["rdl", "romanian dl", "stiff leg deadlift"] },
  { name: "Lunge", category: 9, primary: [10, 8], secondary: [11], equipment: [3, 7], aliases: ["walking lunge", "reverse lunge", "lunges"] },
  { name: "Bulgarian split squat", category: 9, primary: [10, 8], secondary: [11], equipment: [3, 8], aliases: ["split squat", "rear foot elevated split squat"] },
  { name: "Leg curl", category: 9, primary: [11], secondary: [7], equipment: [12], aliases: ["hamstring curl", "lying leg curl", "seated leg curl"] },
  { name: "Leg extension", category: 9, primary: [10], secondary: [], equipment: [12], aliases: ["quad extension"] },
  { name: "Hip thrust", category: 9, primary: [8], secondary: [11], equipment: [1, 8], aliases: ["barbell hip thrust", "glute bridge"] },
  { name: "Step up", category: 9, primary: [10, 8], secondary: [11], equipment: [3, 8], aliases: ["stepup"] },
  { name: "Hack squat", category: 9, primary: [10], secondary: [8], equipment: [12] },
  { name: "Sumo squat", category: 9, primary: [10, 8], secondary: [11], equipment: [3] },
  { name: "Nordic curl", category: 9, primary: [11], secondary: [8], equipment: [7], aliases: ["nordic hamstring curl"] },
  { name: "Pistol squat", category: 9, primary: [10, 8], secondary: [6], equipment: [7] },
  { name: "Kettlebell swing", category: 9, primary: [8, 11], secondary: [16, 6], equipment: [10], aliases: ["kb swing", "swing"] },

  /* --------------------------- Calves ---------------------------- */
  { name: "Standing calf raise", category: 14, primary: [7], secondary: [15], equipment: [7, 12], aliases: ["calf raise", "calves"] },
  { name: "Seated calf raise", category: 14, primary: [15], secondary: [7], equipment: [12] },

  /* ---------------------------- Abs ------------------------------ */
  { name: "Plank", category: 10, primary: [6], secondary: [14, 16], equipment: [4], aliases: ["front plank", "planks"] },
  { name: "Side plank", category: 10, primary: [14], secondary: [6], equipment: [4] },
  { name: "Crunch", category: 10, primary: [6], secondary: [], equipment: [4], aliases: ["crunches", "sit up", "situp"] },
  { name: "Hanging leg raise", category: 10, primary: [6], secondary: [14], equipment: [6], aliases: ["leg raise", "hanging knee raise"] },
  { name: "Russian twist", category: 10, primary: [14], secondary: [6], equipment: [4] },
  { name: "Cable crunch", category: 10, primary: [6], secondary: [], equipment: [12] },
  { name: "Ab wheel rollout", category: 10, primary: [6], secondary: [12, 16], equipment: [4], aliases: ["ab rollout", "ab wheel"] },
  { name: "Dead bug", category: 10, primary: [6], secondary: [14], equipment: [4], aliases: ["deadbug"] },
  { name: "Mountain climber", category: 10, primary: [6], secondary: [14], equipment: [7] },
  { name: "Hollow hold", category: 10, primary: [6], secondary: [], equipment: [4] },
  { name: "Woodchop", category: 10, primary: [14], secondary: [6], equipment: [12], aliases: ["cable woodchop"] },

  /* --------------------------- Cardio ---------------------------- */
  { name: "Running", category: 15, primary: [10, 7], secondary: [11, 8], equipment: [7], aliases: ["run", "jog", "jogging", "treadmill", "morning run", "long run", "easy run", "tempo run"] },
  { name: "Cycling", category: 15, primary: [10], secondary: [7, 8], equipment: [7], aliases: ["cycle", "bike", "biking", "spin", "commute ride", "ride"] },
  { name: "Swimming", category: 15, primary: [12], secondary: [2, 4], equipment: [7], aliases: ["swim", "lap swimming", "pool session"] },
  { name: "Rowing machine", category: 15, primary: [12], secondary: [10, 1], equipment: [12], aliases: ["erg", "rower", "row erg", "concept 2"] },
  { name: "Elliptical", category: 15, primary: [10], secondary: [11], equipment: [12], aliases: ["cross trainer"] },
  { name: "Stair climber", category: 15, primary: [8, 10], secondary: [7], equipment: [12], aliases: ["stairmaster", "stairs"] },
  { name: "Walking", category: 15, primary: [10], secondary: [7], equipment: [7], aliases: ["walk", "hike", "hiking"] },
  { name: "Burpee", category: 15, primary: [4, 10], secondary: [6, 5], equipment: [7], aliases: ["burpees"] },
  { name: "Jump rope", category: 15, primary: [7], secondary: [15], equipment: [7], aliases: ["skipping", "skip rope"] },
  { name: "Box jump", category: 15, primary: [10, 8], secondary: [7], equipment: [7] },

  /* ------------------------- Flexibility ------------------------- */
  { name: "Yoga", category: 15, primary: [6], secondary: [16, 11], equipment: [4], aliases: ["yoga flow", "vinyasa", "evening yoga"] },
  { name: "Stretching", category: 15, primary: [11], secondary: [16], equipment: [4], aliases: ["stretch", "mobility", "cool down"] },
  { name: "Foam rolling", category: 15, primary: [11], secondary: [10], equipment: [4], aliases: ["foam roll"] },
]

/** Lookup keyed by normalised name and by every alias. */
const INDEX = new Map<string, CatalogExercise>()
for (const exercise of EXERCISE_CATALOG) {
  INDEX.set(exercise.name.toLowerCase(), exercise)
  for (const alias of exercise.aliases ?? []) INDEX.set(alias.toLowerCase(), exercise)
}

function key(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Whole-word matchers for every catalogue term, longest first. Word bounds
 * matter: without them the alias "dl" fires inside "midDLe delt raise" and
 * "spin" inside "SPINal twist".
 */
const CONTAINMENT_MATCHERS: {
  pattern: RegExp
  length: number
  exercise: CatalogExercise
}[] = [...INDEX.entries()]
  .map(([term, exercise]) => ({
    pattern: new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(term)}(?:[^a-z0-9]|$)`),
    length: term.length,
    exercise,
  }))
  .sort((a, b) => b.length - a.length)

/** Exact match on a catalogue name or one of its aliases. */
export function lookupExercise(name: string): CatalogExercise | null {
  return INDEX.get(key(name)) ?? null
}

/**
 * Strict resolution, used wherever a name decides *identity* — personal
 * records, progression history, template recall. Only an exact catalogue name
 * or alias counts, so "bp" and "Bench press" share a record while "Bench",
 * "Trap bar deadlift" and any other variant keep their own.
 *
 * Deliberately not fuzzy: a wrong guess here silently files a lift under
 * another exercise's record, which is far worse than no match at all.
 */
export function matchExercise(name: string): CatalogExercise | null {
  return lookupExercise(name)
}

/**
 * Lenient resolution, used only to work out which muscles a name trains.
 * Falls back to the longest catalogue term appearing as whole words, so
 * "Trap bar deadlift" is credited as deadlift work and the Garmin title
 * "Morning Run" as running — without either of them merging into that
 * exercise's records.
 */
export function classifyMatch(name: string): CatalogExercise | null {
  const exact = lookupExercise(name)
  if (exact) return exact

  const needle = key(name)
  if (!needle) return null

  for (const { pattern, exercise } of CONTAINMENT_MATCHERS) {
    if (pattern.test(needle)) return exercise
  }
  return null
}

/** Catalogue search for the picker: name and alias matches, ranked. */
export function searchExercises(
  query: string,
  filters: { category?: CategoryId | null; equipment?: EquipmentId | null } = {}
): CatalogExercise[] {
  const q = key(query)
  return EXERCISE_CATALOG.filter((exercise) => {
    if (filters.category && exercise.category !== filters.category) return false
    if (filters.equipment && !exercise.equipment.includes(filters.equipment))
      return false
    if (!q) return true
    return (
      exercise.name.toLowerCase().includes(q) ||
      (exercise.aliases ?? []).some((a) => a.includes(q))
    )
  })
    .sort((a, b) => {
      if (!q) return a.name.localeCompare(b.name)
      const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1
      const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1
      return aStarts - bStarts || a.name.localeCompare(b.name)
    })
}
