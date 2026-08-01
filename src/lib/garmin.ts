import { newId } from "@/lib/store"
import type { Workout, WorkoutStats, WorkoutType } from "@/lib/types"

/** Map a Garmin activity type string to our workout categories. */
function mapActivityType(garminType: string): WorkoutType {
  const t = garminType.toLowerCase()
  if (/strength|weight/.test(t)) return "strength"
  if (/yoga|pilates|stretch|mobility|breathwork/.test(t)) return "flexibility"
  if (
    /run|cycl|bik|swim|walk|hik|cardio|elliptical|row|ski|stair|tread/.test(t)
  )
    return "cardio"
  if (/tennis|soccer|football|basketball|golf|badminton|squash|padel/.test(t))
    return "sports"
  return "other"
}

/** Parse "1:02:33", "45:12" or "45" into whole minutes. */
function parseDuration(value: string): number {
  const parts = value
    .trim()
    .split(":")
    .map((p) => Number.parseFloat(p.replace(",", ".")))
  if (parts.some(Number.isNaN) || parts.length === 0) return 0
  if (parts.length === 3) return Math.round(parts[0] * 60 + parts[1] + parts[2] / 60)
  if (parts.length === 2) return Math.round(parts[0] + parts[1] / 60)
  return Math.round(parts[0])
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number.parseFloat(value.replace(/,(?=\d{3})/g, "").replace(",", "."))
  return Number.isNaN(n) || n <= 0 ? undefined : n
}

/** Minimal CSV parser handling quoted fields with embedded commas/newlines. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(field)
      field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      field = ""
      if (row.some((f) => f.trim() !== "")) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.some((f) => f.trim() !== "")) rows.push(row)
  return rows
}

/**
 * Parse the "Export CSV" file from Garmin Connect's activities list
 * (Activities → All Activities → Export CSV).
 */
export function parseGarminCSV(text: string): Workout[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim().toLowerCase())
  const col = (...names: string[]) => {
    for (const name of names) {
      const idx = headers.indexOf(name)
      if (idx !== -1) return idx
    }
    return -1
  }
  const iType = col("activity type")
  const iDate = col("date")
  const iTitle = col("title")
  const iDistance = col("distance")
  const iCalories = col("calories")
  const iTime = col("time", "total time", "elapsed time")
  const iAvgHr = col("avg hr", "average hr")
  const iMaxHr = col("max hr")
  if (iDate === -1) return []

  const workouts: Workout[] = []
  for (const row of rows.slice(1)) {
    const rawDate = row[iDate]?.trim()
    if (!rawDate) continue
    // Garmin dates look like "2026-07-30 18:23:11"
    const date = rawDate.slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    const hasTime = /\d{2}:\d{2}/.test(rawDate.slice(11))
    const garminType = row[iType]?.trim() ?? ""
    const title = row[iTitle]?.trim() || garminType || "Garmin activity"
    const stats: WorkoutStats = {}
    const distance = parseNumber(iDistance >= 0 ? row[iDistance] : undefined)
    if (distance) stats.distanceKm = Math.round(distance * 100) / 100
    const calories = parseNumber(iCalories >= 0 ? row[iCalories] : undefined)
    if (calories) stats.calories = Math.round(calories)
    const avgHr = parseNumber(iAvgHr >= 0 ? row[iAvgHr] : undefined)
    if (avgHr) stats.avgHr = Math.round(avgHr)
    const maxHr = parseNumber(iMaxHr >= 0 ? row[iMaxHr] : undefined)
    if (maxHr) stats.maxHr = Math.round(maxHr)

    workouts.push({
      id: newId(),
      date,
      name: title,
      type: mapActivityType(garminType),
      durationMin: iTime >= 0 && row[iTime] ? parseDuration(row[iTime]) : 0,
      exercises: [],
      notes: "",
      source: "garmin",
      startTime: hasTime ? rawDate.replace(" ", "T") : undefined,
      stats,
    })
  }
  return workouts
}

/**
 * Parse a TCX file exported from a single Garmin Connect activity
 * (activity page → gear icon → Export to TCX).
 */
export function parseGarminTCX(text: string): Workout[] {
  const doc = new DOMParser().parseFromString(text, "application/xml")
  if (doc.querySelector("parsererror")) return []
  const workouts: Workout[] = []
  for (const activity of Array.from(doc.querySelectorAll("Activity"))) {
    const sport = activity.getAttribute("Sport") ?? "Other"
    const startIso = activity.querySelector("Id")?.textContent?.trim()
    if (!startIso) continue
    const start = new Date(startIso)
    if (Number.isNaN(start.getTime())) continue
    const offset = start.getTimezoneOffset()
    const date = new Date(start.getTime() - offset * 60_000)
      .toISOString()
      .slice(0, 10)

    let totalSec = 0
    let distanceM = 0
    let calories = 0
    let hrWeighted = 0
    let hrSec = 0
    let maxHr = 0
    for (const lap of Array.from(activity.querySelectorAll("Lap"))) {
      const sec = Number.parseFloat(
        lap.querySelector("TotalTimeSeconds")?.textContent ?? "0"
      )
      totalSec += sec || 0
      distanceM += Number.parseFloat(
        lap.querySelector("DistanceMeters")?.textContent ?? "0"
      ) || 0
      calories += Number.parseFloat(
        lap.querySelector("Calories")?.textContent ?? "0"
      ) || 0
      const avg = Number.parseFloat(
        lap.querySelector("AverageHeartRateBpm > Value")?.textContent ?? "0"
      )
      if (avg > 0 && sec > 0) {
        hrWeighted += avg * sec
        hrSec += sec
      }
      const max = Number.parseFloat(
        lap.querySelector("MaximumHeartRateBpm > Value")?.textContent ?? "0"
      )
      if (max > maxHr) maxHr = max
    }

    const stats: WorkoutStats = {}
    if (distanceM > 0) stats.distanceKm = Math.round(distanceM / 10) / 100
    if (calories > 0) stats.calories = Math.round(calories)
    if (hrSec > 0) stats.avgHr = Math.round(hrWeighted / hrSec)
    if (maxHr > 0) stats.maxHr = Math.round(maxHr)

    workouts.push({
      id: newId(),
      date,
      name: sport === "Other" ? "Garmin activity" : sport,
      type: mapActivityType(sport),
      durationMin: Math.round(totalSec / 60),
      exercises: [],
      notes: "",
      source: "garmin",
      startTime: startIso,
      stats,
    })
  }
  return workouts
}

export function parseGarminFile(name: string, text: string): Workout[] {
  if (name.toLowerCase().endsWith(".tcx") || text.trimStart().startsWith("<"))
    return parseGarminTCX(text)
  return parseGarminCSV(text)
}

/** Key used to detect activities that were already imported. */
export function workoutKey(w: Workout): string {
  return `${w.date}|${w.name.toLowerCase()}|${w.durationMin}`
}
