import { todayISO } from "@/lib/store"
import type {
  DiaryEntry,
  MeasurementCategory,
  MeasurementEntry,
  PlannedWorkout,
  Workout,
  WorkoutTemplate,
} from "@/lib/types"

export const BACKUP_VERSION = 3

export interface BackupData {
  workouts: Workout[]
  entries: DiaryEntry[]
  templates: WorkoutTemplate[]
  measurementCategories: MeasurementCategory[]
  measurements: MeasurementEntry[]
  plannedWorkouts: PlannedWorkout[]
}

export interface BackupFile extends BackupData {
  app: "workout-tracker-diary"
  version: number
  exportedAt: string
}

export function exportBackup(data: BackupData) {
  const payload: BackupFile = {
    app: "workout-tracker-diary",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `workout-diary-backup-${todayISO()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ImportCounts {
  workouts: number
  entries: number
  templates: number
  measurementCategories: number
  measurements: number
  plannedWorkouts: number
}

export interface ImportResult {
  ok: boolean
  error?: string
  data?: BackupData
  added: ImportCounts
  skipped: ImportCounts
}

export function totalOf(counts: ImportCounts): number {
  return (
    counts.workouts +
    counts.entries +
    counts.templates +
    counts.measurementCategories +
    counts.measurements +
    counts.plannedWorkouts
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function validWorkout(value: unknown): value is Workout {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.exercises)
  )
}

function validEntry(value: unknown): value is DiaryEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.content === "string"
  )
}

function validTemplate(value: unknown): value is WorkoutTemplate {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.exerciseNames) &&
    (value.exerciseTargets === undefined || isRecord(value.exerciseTargets))
  )
}

function validPlannedWorkout(value: unknown): value is PlannedWorkout {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.exerciseNames)
  )
}

function validMeasurementCategory(
  value: unknown
): value is MeasurementCategory {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.unit === "string"
  )
}

function validMeasurement(value: unknown): value is MeasurementEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.categoryId === "string" &&
    typeof value.date === "string" &&
    typeof value.value === "number"
  )
}

/**
 * Merge a backup into the current data, keyed by id so importing the same
 * file twice never duplicates anything.
 */
export function parseBackup(text: string, current: BackupData): ImportResult {
  const empty: ImportCounts = {
    workouts: 0,
    entries: 0,
    templates: 0,
    measurementCategories: 0,
    measurements: 0,
    plannedWorkouts: 0,
  }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return {
      ok: false,
      error: "That file isn't valid JSON.",
      added: { ...empty },
      skipped: { ...empty },
    }
  }

  if (!isRecord(raw) || raw.app !== "workout-tracker-diary") {
    return {
      ok: false,
      error: "That doesn't look like a backup from this app.",
      added: { ...empty },
      skipped: { ...empty },
    }
  }

  if (typeof raw.version === "number" && raw.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: `That backup was made by a newer version of the app (v${raw.version}).`,
      added: { ...empty },
      skipped: { ...empty },
    }
  }

  const incomingWorkouts = Array.isArray(raw.workouts)
    ? raw.workouts.filter(validWorkout)
    : []
  const incomingEntries = Array.isArray(raw.entries)
    ? raw.entries.filter(validEntry)
    : []
  const incomingTemplates = Array.isArray(raw.templates)
    ? raw.templates.filter(validTemplate)
    : []
  // Measurements arrived in v2; a v1 backup simply has none.
  const incomingCategories = Array.isArray(raw.measurementCategories)
    ? raw.measurementCategories.filter(validMeasurementCategory)
    : []
  const incomingMeasurements = Array.isArray(raw.measurements)
    ? raw.measurements.filter(validMeasurement)
    : []
  // Planned workouts arrived in v3; older backups simply have none.
  const incomingPlanned = Array.isArray(raw.plannedWorkouts)
    ? raw.plannedWorkouts.filter(validPlannedWorkout)
    : []

  const workoutIds = new Set(current.workouts.map((w) => w.id))
  const entryIds = new Set(current.entries.map((e) => e.id))
  const templateIds = new Set(current.templates.map((t) => t.id))
  const categoryIds = new Set(current.measurementCategories.map((c) => c.id))
  const measurementIds = new Set(current.measurements.map((m) => m.id))
  const plannedIds = new Set(current.plannedWorkouts.map((p) => p.id))

  const newWorkouts = incomingWorkouts.filter((w) => !workoutIds.has(w.id))
  const newEntries = incomingEntries.filter((e) => !entryIds.has(e.id))
  const newTemplates = incomingTemplates.filter((t) => !templateIds.has(t.id))
  const newCategories = incomingCategories.filter((c) => !categoryIds.has(c.id))
  const newMeasurements = incomingMeasurements.filter(
    (m) => !measurementIds.has(m.id)
  )
  const newPlanned = incomingPlanned.filter((p) => !plannedIds.has(p.id))

  return {
    ok: true,
    data: {
      workouts: [...current.workouts, ...newWorkouts],
      entries: [...current.entries, ...newEntries],
      templates: [...current.templates, ...newTemplates],
      measurementCategories: [
        ...current.measurementCategories,
        ...newCategories,
      ],
      measurements: [...current.measurements, ...newMeasurements],
      plannedWorkouts: [...current.plannedWorkouts, ...newPlanned],
    },
    added: {
      workouts: newWorkouts.length,
      entries: newEntries.length,
      templates: newTemplates.length,
      measurementCategories: newCategories.length,
      measurements: newMeasurements.length,
      plannedWorkouts: newPlanned.length,
    },
    skipped: {
      workouts: incomingWorkouts.length - newWorkouts.length,
      entries: incomingEntries.length - newEntries.length,
      templates: incomingTemplates.length - newTemplates.length,
      measurementCategories:
        incomingCategories.length - newCategories.length,
      measurements: incomingMeasurements.length - newMeasurements.length,
      plannedWorkouts: incomingPlanned.length - newPlanned.length,
    },
  }
}
