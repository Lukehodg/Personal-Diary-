export interface WorkoutSet {
  reps: number
  weight: number
}

export interface Exercise {
  id: string
  name: string
  sets: WorkoutSet[]
}

export type WorkoutType =
  | "strength"
  | "cardio"
  | "flexibility"
  | "sports"
  | "other"

export interface WorkoutStats {
  distanceKm?: number
  calories?: number
  avgHr?: number
  maxHr?: number
}

export interface Workout {
  id: string
  date: string // ISO yyyy-mm-dd
  name: string
  type: WorkoutType
  durationMin: number
  exercises: Exercise[]
  notes: string
  source?: "manual" | "garmin"
  startTime?: string // full ISO datetime, when known (e.g. Garmin imports)
  stats?: WorkoutStats
}

export type Mood = "great" | "good" | "okay" | "low" | "rough"

export interface DiaryEntry {
  id: string
  date: string // ISO yyyy-mm-dd
  title: string
  content: string
  mood: Mood
}

export interface WorkoutTemplate {
  id: string
  name: string
  type: WorkoutType
  exerciseNames: string[]
}

/**
 * Body tracking, modelled on wger's measurements app: a user-defined category
 * carries a name and a unit, and entries are just a date and a value. Body
 * weight is seeded as a category rather than special-cased.
 */
export interface MeasurementCategory {
  id: string
  name: string
  unit: string
}

export interface MeasurementEntry {
  id: string
  categoryId: string
  date: string // ISO yyyy-mm-dd
  value: number
  notes: string
}

export const DEFAULT_MEASUREMENT_CATEGORIES: MeasurementCategory[] = [
  { id: "body-weight", name: "Body weight", unit: "kg" },
  { id: "body-fat", name: "Body fat", unit: "%" },
  { id: "waist", name: "Waist", unit: "cm" },
]

export const MOODS: {
  value: Mood
  label: string
  emoji: string
  score: number
}[] = [
  { value: "great", label: "Great", emoji: "😄", score: 5 },
  { value: "good", label: "Good", emoji: "🙂", score: 4 },
  { value: "okay", label: "Okay", emoji: "😐", score: 3 },
  { value: "low", label: "Low", emoji: "😕", score: 2 },
  { value: "rough", label: "Rough", emoji: "😞", score: 1 },
]

export function moodScore(mood: Mood): number {
  return MOODS.find((m) => m.value === mood)?.score ?? 3
}

export const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
]
