import { todayISO } from "@/lib/store"
import type { DiaryEntry, Workout, WorkoutTemplate } from "@/lib/types"

export const BACKUP_VERSION = 1

export interface BackupFile {
  app: "workout-tracker-diary"
  version: number
  exportedAt: string
  workouts: Workout[]
  entries: DiaryEntry[]
  templates: WorkoutTemplate[]
}

export interface BackupData {
  workouts: Workout[]
  entries: DiaryEntry[]
  templates: WorkoutTemplate[]
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

export interface ImportResult {
  ok: boolean
  error?: string
  data?: BackupData
  added: { workouts: number; entries: number; templates: number }
  skipped: { workouts: number; entries: number; templates: number }
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
    Array.isArray(value.exerciseNames)
  )
}

/**
 * Merge a backup into the current data, keyed by id so importing the same
 * file twice never duplicates anything.
 */
export function parseBackup(text: string, current: BackupData): ImportResult {
  const empty = { workouts: 0, entries: 0, templates: 0 }
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

  const workoutIds = new Set(current.workouts.map((w) => w.id))
  const entryIds = new Set(current.entries.map((e) => e.id))
  const templateIds = new Set(current.templates.map((t) => t.id))

  const newWorkouts = incomingWorkouts.filter((w) => !workoutIds.has(w.id))
  const newEntries = incomingEntries.filter((e) => !entryIds.has(e.id))
  const newTemplates = incomingTemplates.filter((t) => !templateIds.has(t.id))

  return {
    ok: true,
    data: {
      workouts: [...current.workouts, ...newWorkouts],
      entries: [...current.entries, ...newEntries],
      templates: [...current.templates, ...newTemplates],
    },
    added: {
      workouts: newWorkouts.length,
      entries: newEntries.length,
      templates: newTemplates.length,
    },
    skipped: {
      workouts: incomingWorkouts.length - newWorkouts.length,
      entries: incomingEntries.length - newEntries.length,
      templates: incomingTemplates.length - newTemplates.length,
    },
  }
}
