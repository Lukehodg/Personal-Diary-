import { matchExercise } from "@/lib/exerciseCatalog"
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
 * Fallback for names the catalogue doesn't know. Ordered so specific patterns
 * win: a rowing machine is cardio while a barbell row is back work.
 */
const KEYWORD_RULES: [RegExp, CategoryId][] = [
  [/close.?grip|skull|pushdown|press.?down|tricep|kickback/, 8],
  [/lateral raise|front raise|rear delt|face pull|upright row|arnold|overhead press|shoulder press|military|ohp\b/, 13],
  [/rowing machine|erg\b|treadmill|elliptical|run\b|running|jog|cycl|bike|swim|walk|hike|stair|cardio/, 15],
  [/curl(?!.*leg)|bicep/, 8],
  [/calf|calves/, 14],
  [/bench|chest|pec|fly|flye|push.?up|press.?up/, 11],
  [/row|pull.?up|pull.?down|lat |shrug|pullover|chin|deadlift|back extension/, 12],
  [/squat|lunge|leg press|leg curl|leg extension|hip thrust|glute|rdl|romanian|step.?up|hamstring|quad|bulgarian/, 9],
  [/plank|crunch|sit.?up|abs?\b|russian twist|leg raise|hollow|dead ?bug|oblique/, 10],
  [/press/, 11],
]

/** Rough primary muscles per category, for names we could only guess at. */
const CATEGORY_FALLBACK_MUSCLES: Record<CategoryId, MuscleId[]> = {
  8: [1],
  9: [10, 8],
  10: [6],
  11: [4],
  12: [12],
  13: [2],
  14: [7],
  15: [10],
}

export function classifyExercise(name: string): ExerciseClassification {
  const hit = matchExercise(name)
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
  for (const [pattern, category] of KEYWORD_RULES) {
    if (pattern.test(lower)) {
      const primary = CATEGORY_FALLBACK_MUSCLES[category]
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
 * Collapse spelling variations so "Bench Press", "bench press" and
 * "  Bench  press " all count as the same lift for PR tracking. Names the
 * catalogue recognises collapse onto its canonical name, so "OHP" and
 * "Overhead press" share a record.
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
