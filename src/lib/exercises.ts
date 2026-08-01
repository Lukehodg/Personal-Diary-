import type { Workout } from "@/lib/types"

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Legs"
  | "Core"
  | "Cardio"
  | "Other"

export type MovementPattern = "Push" | "Pull" | "Legs" | "Core" | "Cardio" | "Other"

/**
 * Ordered longest-match-first so specific names win: "close grip bench" is
 * triceps work, not chest, and a rowing machine is cardio while a barbell
 * row is back.
 */
const MUSCLE_RULES: [RegExp, MuscleGroup][] = [
  [/close.?grip|skull|pushdown|press.?down|tricep|kickback|dip\b/, "Triceps"],
  [/lateral raise|front raise|rear delt|face pull|upright row|arnold|overhead press|shoulder press|military|ohp\b/, "Shoulders"],
  [/rowing machine|erg\b|treadmill|elliptical|run\b|running|jog|cycle|cycling|bike|swim|walk|hike|stair/, "Cardio"],
  [/curl(?!.*leg)|chin.?up|bicep/, "Biceps"],
  [/bench|chest|pec |pec$|fly|flye|push.?up|press.?up/, "Chest"],
  [/row|pull.?up|pull.?down|lat |lat$|shrug|pullover|chin/, "Back"],
  [/squat|lunge|leg press|leg curl|leg extension|calf|hip thrust|glute|rdl|romanian|deadlift|step.?up|hamstring|quad|bulgarian/, "Legs"],
  [/plank|crunch|sit.?up|ab |abs\b|russian twist|leg raise|hanging|hollow|dead ?bug|oblique/, "Core"],
  [/press/, "Chest"],
]

const PATTERN_OF: Record<MuscleGroup, MovementPattern> = {
  Chest: "Push",
  Shoulders: "Push",
  Triceps: "Push",
  Back: "Pull",
  Biceps: "Pull",
  Legs: "Legs",
  Core: "Core",
  Cardio: "Cardio",
  Other: "Other",
}

export function muscleGroupFor(exerciseName: string): MuscleGroup {
  const name = exerciseName.toLowerCase()
  for (const [pattern, group] of MUSCLE_RULES) {
    if (pattern.test(name)) return group
  }
  return "Other"
}

export function movementPatternFor(exerciseName: string): MovementPattern {
  return PATTERN_OF[muscleGroupFor(exerciseName)]
}

/**
 * Collapse spelling variations so "Bench Press", "bench press" and
 * "  Bench  press " all count as the same lift for PR tracking.
 */
export function normalizeExercise(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Every distinct exercise name in the log, most recently used first. */
export function exerciseHistory(workouts: Workout[]): string[] {
  const seen = new Map<string, string>()
  const byDate = [...workouts].sort((a, b) => b.date.localeCompare(a.date))
  for (const w of byDate) {
    for (const ex of w.exercises) {
      const key = normalizeExercise(ex.name)
      if (key && !seen.has(key)) seen.set(key, ex.name.trim())
    }
  }
  return [...seen.values()]
}
