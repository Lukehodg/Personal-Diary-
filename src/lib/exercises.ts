import { classifyMatch, matchExercise } from "@/lib/exerciseCatalog"
import {
  patternForCategory,
  type CategoryId,
  type MovementPattern,
  type MuscleId,
} from "@/lib/wger"
import type { Workout } from "@/lib/types"

export interface ExerciseClassification {
  category: CategoryId | null
  primary: MuscleId[]
  secondary: MuscleId[]
  pattern: MovementPattern | null
  /** True when the name matched the catalogue rather than a keyword guess. */
  known: boolean
}

/**
 * Last-resort keyword rules for names the catalogue can't place at all.
 * Ordered so specific patterns win: a rowing machine is cardio while a
 * barbell row is back work.
 *
 * Each rule carries its own primary muscles. Deriving them from the category
 * alone doesn't work — Arms covers both triceps (pressing) and biceps
 * (pulling), and guessing wrong flips the push/pull balance warning.
 */
const KEYWORD_RULES: [RegExp, CategoryId, MuscleId[]][] = [
  [/close.?grip|skull|pushdown|press.?down|tricep|kickback/, 8, [5]],
  [/lateral raise|front raise|delt|face pull|upright row|arnold|overhead press|shoulder press|military|ohp\b/, 13, [2]],
  [/rowing machine|erg\b|treadmill|elliptical|run\b|running|jog|cycl|bike|swim|walk|hike|stair|cardio/, 15, [10]],
  [/curl(?!.*leg)|bicep/, 8, [1]],
  [/calf|calves/, 14, [7]],
  [/bench|chest|pec|fly|flye|push.?up|press.?up/, 11, [4]],
  [/row|pull.?up|pull.?down|lat |shrug|pullover|chin|deadlift|back extension/, 12, [12]],
  [/squat|lunge|leg press|leg curl|leg extension|hip thrust|glute|rdl|romanian|step.?up|hamstring|quad|bulgarian/, 9, [10, 8]],
  [/plank|crunch|sit.?up|abs?\b|twist|leg raise|hollow|dead ?bug|oblique|carry/, 10, [6]],
  [/press/, 11, [4]],
]

export function classifyExercise(name: string): ExerciseClassification {
  // Lenient on purpose: this only decides which muscles get credited, so
  // crediting "Trap bar deadlift" as deadlift work is right even though it
  // keeps its own PR record.
  const hit = classifyMatch(name)
  if (hit) {
    return {
      category: hit.category,
      primary: hit.primary,
      secondary: hit.secondary,
      pattern: patternForCategory(hit.category, hit.primary),
      known: true,
    }
  }

  const lower = name.trim().toLowerCase()
  for (const [pattern, category, primary] of KEYWORD_RULES) {
    if (pattern.test(lower)) {
      return {
        category,
        primary,
        secondary: [],
        pattern: patternForCategory(category, primary),
        known: false,
      }
    }
  }

  return {
    category: null,
    primary: [],
    secondary: [],
    pattern: null,
    known: false,
  }
}

/**
 * The identity key for a lift: personal records, progression history and
 * last-session recall all group by this.
 *
 * Collapses spelling variations so "Bench Press", "bench press" and
 * "  Bench  press " are one lift, and recognised aliases fold onto their
 * canonical name so "OHP" and "Overhead press" share a record. Anything the
 * catalogue doesn't know keeps its own name — a near-miss must never file a
 * lift under a different exercise's record.
 */
export function normalizeExercise(name: string): string {
  const cleaned = name.trim().toLowerCase().replace(/\s+/g, " ")
  if (!cleaned) return ""
  const hit = matchExercise(cleaned)
  return hit ? hit.name.toLowerCase() : cleaned
}

/** Display name for a lift — the catalogue's spelling when it knows it. */
export function canonicalName(name: string): string {
  return matchExercise(name)?.name ?? name.trim()
}

/** Every distinct exercise name in the log, most recently used first. */
export function exerciseHistory(workouts: Workout[]): string[] {
  const seen = new Map<string, string>()
  const byDate = [...workouts].sort((a, b) => b.date.localeCompare(a.date))
  for (const w of byDate) {
    for (const ex of w.exercises) {
      const key = normalizeExercise(ex.name)
      if (key && !seen.has(key)) seen.set(key, canonicalName(ex.name))
    }
  }
  return [...seen.values()]
}
