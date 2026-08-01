import type { Workout } from "@/lib/types"

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function dateOnly(iso: string): string {
  return iso.replace(/-/g, "")
}

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + 1)
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function workoutDescription(w: Workout): string {
  const parts: string[] = []
  if (w.stats?.distanceKm) parts.push(`Distance: ${w.stats.distanceKm} km`)
  if (w.stats?.calories) parts.push(`Calories: ${w.stats.calories} kcal`)
  if (w.stats?.avgHr) parts.push(`Avg HR: ${w.stats.avgHr} bpm`)
  if (w.stats?.maxHr) parts.push(`Max HR: ${w.stats.maxHr} bpm`)
  for (const ex of w.exercises) {
    const sets = ex.sets
      .map((s) => (s.weight > 0 ? `${s.reps}×${s.weight}kg` : `${s.reps} reps`))
      .join(", ")
    parts.push(sets ? `${ex.name}: ${sets}` : ex.name)
  }
  if (w.notes) parts.push(w.notes)
  return parts.join("\n")
}

/** Event window: timed when we know the start, all-day otherwise. */
function eventWindow(w: Workout): { start: string; end: string; allDay: boolean } {
  if (w.startTime) {
    const start = new Date(w.startTime)
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(
        start.getTime() + Math.max(w.durationMin, 15) * 60_000
      )
      return { start: toUtcStamp(start), end: toUtcStamp(end), allDay: false }
    }
  }
  return { start: dateOnly(w.date), end: dateOnly(nextDay(w.date)), allDay: true }
}

export function workoutsToICS(workouts: Workout[]): string {
  const now = toUtcStamp(new Date())
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Workout Tracker & Diary//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Workouts",
  ]
  for (const w of workouts) {
    const { start, end, allDay } = eventWindow(w)
    lines.push(
      "BEGIN:VEVENT",
      `UID:${w.id}@workout-diary`,
      `DTSTAMP:${now}`,
      allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
      allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
      `SUMMARY:${icsEscape(`🏋️ ${w.name}`)}`,
      `CATEGORIES:${icsEscape(w.type)}`,
      `DESCRIPTION:${icsEscape(workoutDescription(w))}`,
      "END:VEVENT"
    )
  }
  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export function downloadICS(workouts: Workout[]) {
  const blob = new Blob([workoutsToICS(workouts)], {
    type: "text/calendar;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "workouts.ics"
  a.click()
  URL.revokeObjectURL(url)
}

export function googleCalendarUrl(w: Workout): string {
  const { start, end } = eventWindow(w)
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `🏋️ ${w.name}`,
    dates: `${start}/${end}`,
    details: workoutDescription(w),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
