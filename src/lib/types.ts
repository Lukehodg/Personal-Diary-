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

export const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "great", label: "Great", emoji: "😄" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "low", label: "Low", emoji: "😕" },
  { value: "rough", label: "Rough", emoji: "😞" },
]

export const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
]
