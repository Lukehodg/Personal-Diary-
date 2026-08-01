/**
 * Taxonomy adopted from the wger project (https://github.com/wger-project/wger),
 * an AGPL-licensed self-hosted fitness manager. The muscle, category and
 * equipment identifiers below match wger's own fixtures, so exercises logged
 * here line up with a wger instance rather than using an invented scheme.
 *
 * Only the taxonomy is taken from wger. The exercise catalogue in
 * `exerciseCatalog.ts` is our own mapping of common exercise names onto it.
 */

export type MuscleId =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16

export interface Muscle {
  id: MuscleId
  /** Anatomical name, as wger stores it. */
  name: string
  /** Everyday name shown in the UI. */
  label: string
  isFront: boolean
}

/** wger/exercises/fixtures/muscles.json */
export const MUSCLES: Muscle[] = [
  { id: 1, name: "Biceps brachii", label: "Biceps", isFront: true },
  { id: 2, name: "Anterior deltoid", label: "Shoulders", isFront: true },
  { id: 3, name: "Serratus anterior", label: "Serratus", isFront: true },
  { id: 4, name: "Pectoralis major", label: "Chest", isFront: true },
  { id: 5, name: "Triceps brachii", label: "Triceps", isFront: false },
  { id: 6, name: "Rectus abdominis", label: "Abs", isFront: true },
  { id: 7, name: "Gastrocnemius", label: "Calves", isFront: false },
  { id: 8, name: "Gluteus maximus", label: "Glutes", isFront: false },
  { id: 9, name: "Trapezius", label: "Traps", isFront: false },
  { id: 10, name: "Quadriceps femoris", label: "Quads", isFront: true },
  { id: 11, name: "Biceps femoris", label: "Hamstrings", isFront: false },
  { id: 12, name: "Latissimus dorsi", label: "Lats", isFront: false },
  { id: 13, name: "Brachialis", label: "Brachialis", isFront: true },
  { id: 14, name: "Obliquus externus abdominis", label: "Obliques", isFront: true },
  { id: 15, name: "Soleus", label: "Soleus", isFront: false },
  { id: 16, name: "Erector spinae", label: "Lower back", isFront: false },
]

export const MUSCLE_BY_ID = new Map(MUSCLES.map((m) => [m.id, m]))

export function muscleLabel(id: MuscleId): string {
  return MUSCLE_BY_ID.get(id)?.label ?? "Unknown"
}

export type CategoryId = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

/** wger/exercises/fixtures/categories.json */
export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: 8, name: "Arms" },
  { id: 9, name: "Legs" },
  { id: 10, name: "Abs" },
  { id: 11, name: "Chest" },
  { id: 12, name: "Back" },
  { id: 13, name: "Shoulders" },
  { id: 14, name: "Calves" },
  { id: 15, name: "Cardio" },
]

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))

export function categoryName(id: CategoryId): string {
  return CATEGORY_BY_ID.get(id)?.name ?? "Other"
}

export type EquipmentId =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** wger/exercises/fixtures/equipment.json */
export const EQUIPMENT: { id: EquipmentId; name: string }[] = [
  { id: 1, name: "Barbell" },
  { id: 2, name: "SZ-Bar" },
  { id: 3, name: "Dumbbell" },
  { id: 4, name: "Gym mat" },
  { id: 5, name: "Swiss Ball" },
  { id: 6, name: "Pull-up bar" },
  { id: 7, name: "Bodyweight" },
  { id: 8, name: "Bench" },
  { id: 9, name: "Incline bench" },
  { id: 10, name: "Kettlebell" },
  { id: 11, name: "Resistance band" },
  { id: 12, name: "Cable machine" },
]

export const EQUIPMENT_BY_ID = new Map(EQUIPMENT.map((e) => [e.id, e]))

export function equipmentName(id: EquipmentId): string {
  return EQUIPMENT_BY_ID.get(id)?.name ?? "Other"
}

/**
 * Push / pull / legs grouping, derived from wger's categories. Used for the
 * balance check, where the useful question is whether pressing volume has run
 * away from pulling volume.
 */
export type MovementPattern = "Push" | "Pull" | "Legs" | "Core" | "Cardio"

export function patternForCategory(
  category: CategoryId,
  primary: MuscleId[]
): MovementPattern {
  switch (category) {
    case 11: // Chest
    case 13: // Shoulders
      return "Push"
    case 12: // Back
      return "Pull"
    case 9: // Legs
    case 14: // Calves
      return "Legs"
    case 10: // Abs
      return "Core"
    case 15: // Cardio
      return "Cardio"
    case 8: // Arms splits by which head of the arm does the work
      return primary.includes(5) ? "Push" : "Pull"
    default:
      return "Push"
  }
}
