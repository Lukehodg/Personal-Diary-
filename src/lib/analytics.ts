import { classifyExercise, normalizeExercise } from "@/lib/exercises"
import { muscleLabel, type MovementPattern, type MuscleId } from "@/lib/wger"
import { todayISO } from "@/lib/store"
import {
  moodScore,
  type DiaryEntry,
  type Workout,
  type WorkoutSet,
  type WorkoutType,
} from "@/lib/types"

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function isoOf(d: Date): string {
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function daysAgoISO(days: number): string {
  const d = new Date(`${todayISO()}T00:00:00`)
  d.setDate(d.getDate() - days)
  return isoOf(d)
}

export function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return isoOf(d)
}

/** The Monday that starts the week containing `date` (defaults to today). */
export function startOfWeekISO(date: string = todayISO()): string {
  const d = new Date(`${date}T00:00:00`)
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1
  return addDaysISO(date, -diff)
}

/* ------------------------------------------------------------------ */
/* Personal records                                                    */
/* ------------------------------------------------------------------ */

/**
 * Estimated one-rep max via the Epley formula. Widely used and accurate
 * enough in the 1–10 rep range; beyond that it drifts optimistic.
 */
export function e1rm(set: WorkoutSet): number {
  if (set.weight <= 0 || set.reps <= 0) return 0
  if (set.reps === 1) return set.weight
  return set.weight * (1 + set.reps / 30)
}

export interface PRPoint {
  date: string
  e1rm: number
}

export interface ExercisePR {
  key: string
  name: string
  bestE1rm: number
  bestSet: WorkoutSet
  bestDate: string
  sessions: number
  totalSets: number
  history: PRPoint[]
  /** Percent change from the first recorded session to the best. */
  progressPct: number
  muscle: string
}

export function personalRecords(workouts: Workout[]): ExercisePR[] {
  const byExercise = new Map<
    string,
    { name: string; points: Map<string, number>; sets: WorkoutSet[] }
  >()

  for (const w of workouts) {
    for (const ex of w.exercises) {
      const key = normalizeExercise(ex.name)
      if (!key) continue
      const scored = ex.sets.filter((s) => e1rm(s) > 0)
      if (scored.length === 0) continue
      const entry =
        byExercise.get(key) ??
        { name: ex.name.trim(), points: new Map<string, number>(), sets: [] }
      const sessionBest = Math.max(...scored.map(e1rm))
      entry.points.set(
        w.date,
        Math.max(entry.points.get(w.date) ?? 0, sessionBest)
      )
      entry.sets.push(...scored)
      byExercise.set(key, entry)
    }
  }

  const records: ExercisePR[] = []
  for (const [key, entry] of byExercise) {
    const history = [...entry.points.entries()]
      .map(([date, value]) => ({ date, e1rm: Math.round(value * 10) / 10 }))
      .sort((a, b) => a.date.localeCompare(b.date))
    if (history.length === 0) continue

    let bestSet = entry.sets[0]
    for (const s of entry.sets) if (e1rm(s) > e1rm(bestSet)) bestSet = s
    const bestE1rm = e1rm(bestSet)
    const bestDate =
      history.find((p) => Math.abs(p.e1rm - Math.round(bestE1rm * 10) / 10) < 0.05)
        ?.date ?? history[history.length - 1].date
    const first = history[0].e1rm

    records.push({
      key,
      name: entry.name,
      bestE1rm: Math.round(bestE1rm * 10) / 10,
      bestSet,
      bestDate,
      sessions: history.length,
      totalSets: entry.sets.length,
      history,
      progressPct: first > 0 ? Math.round(((bestE1rm - first) / first) * 100) : 0,
      muscle: (() => {
        const primary = classifyExercise(entry.name).primary[0]
        return primary ? muscleLabel(primary) : "Other"
      })(),
    })
  }

  return records.sort((a, b) => b.bestE1rm - a.bestE1rm)
}

/** True if this set is the best the log has ever seen for that exercise. */
export function isNewPR(
  workouts: Workout[],
  exerciseName: string,
  set: WorkoutSet
): boolean {
  const value = e1rm(set)
  if (value <= 0) return false
  const key = normalizeExercise(exerciseName)
  let best = 0
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (normalizeExercise(ex.name) !== key) continue
      for (const s of ex.sets) best = Math.max(best, e1rm(s))
    }
  }
  return value > best
}

/* ------------------------------------------------------------------ */
/* Progressive overload                                                */
/* ------------------------------------------------------------------ */

export interface LastSession {
  date: string
  sets: WorkoutSet[]
  suggestion: string
}

const TOP_OF_RANGE = 8
const SMALLEST_PLATE_JUMP = 2.5

/**
 * Double progression: work up the rep range at a fixed weight, then add
 * the smallest jump and start again.
 */
export function lastSessionFor(
  workouts: Workout[],
  exerciseName: string
): LastSession | null {
  const key = normalizeExercise(exerciseName)
  if (!key) return null
  const candidates = workouts
    .filter((w) => w.exercises.some((ex) => normalizeExercise(ex.name) === key))
    .sort((a, b) => b.date.localeCompare(a.date))
  const last = candidates[0]
  if (!last) return null
  const ex = last.exercises.find((e) => normalizeExercise(e.name) === key)!
  const sets = ex.sets.filter((s) => s.reps > 0)
  if (sets.length === 0) return null

  const weighted = sets.filter((s) => s.weight > 0)
  let suggestion: string
  if (weighted.length === 0) {
    const bestReps = Math.max(...sets.map((s) => s.reps))
    suggestion = `Try for ${bestReps + 1} reps`
  } else {
    const topWeight = Math.max(...weighted.map((s) => s.weight))
    const atTopWeight = weighted.filter((s) => s.weight === topWeight)
    const short = atTopWeight.filter((s) => s.reps < TOP_OF_RANGE)
    if (short.length === 0) {
      suggestion = `Add weight — try ${topWeight + SMALLEST_PLATE_JUMP} kg`
    } else if (short.length === atTopWeight.length) {
      suggestion = `Stay at ${topWeight} kg — work every set up to ${TOP_OF_RANGE} reps`
    } else {
      suggestion = `Stay at ${topWeight} kg — ${short.length} more ${
        short.length === 1 ? "set" : "sets"
      } to reach ${TOP_OF_RANGE} reps`
    }
  }

  return { date: last.date, sets, suggestion }
}

/* ------------------------------------------------------------------ */
/* Training load                                                       */
/* ------------------------------------------------------------------ */

/**
 * Load is duration scaled by intensity. Heart rate drives intensity when
 * Garmin supplied it; otherwise the workout type stands in. Units are
 * arbitrary, which is fine — every use below is a ratio, so they cancel.
 */
const TYPE_INTENSITY: Record<WorkoutType, number> = {
  strength: 1.1,
  cardio: 1.3,
  sports: 1.2,
  flexibility: 0.6,
  other: 1.0,
}

export function workoutLoad(w: Workout): number {
  const intensity = w.stats?.avgHr ? w.stats.avgHr / 100 : TYPE_INTENSITY[w.type]
  return w.durationMin * intensity
}

export type LoadZone = "detraining" | "optimal" | "caution" | "high risk"

export interface TrainingLoad {
  acute: number
  chronic: number
  ratio: number
  zone: LoadZone
  message: string
  hasEnoughData: boolean
}

/**
 * Acute:chronic workload ratio — this week's load against the average of
 * the last four. Ramping too fast is the classic way to get injured.
 */
export function trainingLoad(workouts: Workout[]): TrainingLoad {
  const weekAgo = daysAgoISO(7)
  const monthAgo = daysAgoISO(28)
  const acute = workouts
    .filter((w) => w.date > weekAgo)
    .reduce((sum, w) => sum + workoutLoad(w), 0)
  const chronicTotal = workouts
    .filter((w) => w.date > monthAgo)
    .reduce((sum, w) => sum + workoutLoad(w), 0)
  const chronic = chronicTotal / 4
  const ratio = chronic > 0 ? acute / chronic : 0
  const hasEnoughData = workouts.filter((w) => w.date > monthAgo).length >= 4

  let zone: LoadZone
  let message: string
  if (ratio < 0.8) {
    zone = "detraining"
    message = "Lighter than usual — fine for a deload, but fitness slips if it lasts."
  } else if (ratio <= 1.3) {
    zone = "optimal"
    message = "Right in the sweet spot: building load without overreaching."
  } else if (ratio <= 1.5) {
    zone = "caution"
    message = "Ramping up quickly. Keep an eye on aches and sleep this week."
  } else {
    zone = "high risk"
    message = "A sharp spike in load. This is where injuries tend to happen — ease off."
  }

  return {
    acute: Math.round(acute),
    chronic: Math.round(chronic),
    ratio: Math.round(ratio * 100) / 100,
    zone,
    message,
    hasEnoughData,
  }
}

/* ------------------------------------------------------------------ */
/* Mood vs training                                                    */
/* ------------------------------------------------------------------ */

export interface MoodCorrelation {
  trainingAvg: number
  restAvg: number
  trainingDays: number
  restDays: number
  delta: number
  hasEnoughData: boolean
}

export function moodCorrelation(
  workouts: Workout[],
  entries: DiaryEntry[]
): MoodCorrelation {
  const trainedOn = new Set(workouts.map((w) => w.date))
  const trained: number[] = []
  const rested: number[] = []
  for (const entry of entries) {
    ;(trainedOn.has(entry.date) ? trained : rested).push(moodScore(entry.mood))
  }
  const mean = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
  const trainingAvg = Math.round(mean(trained) * 10) / 10
  const restAvg = Math.round(mean(rested) * 10) / 10
  return {
    trainingAvg,
    restAvg,
    trainingDays: trained.length,
    restDays: rested.length,
    delta: Math.round((trainingAvg - restAvg) * 10) / 10,
    hasEnoughData: trained.length >= 3 && rested.length >= 3,
  }
}

/* ------------------------------------------------------------------ */
/* Recurring words on rough days                                       */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set(
  `a about after again all also am an and any are as at be because been before being
   but by can cant could did do does doing done dont down during each even feel felt
   few for from get got had has have having he her here hers him his how i id if ill
   im in into is it its ive just keep kept like ll long m me more most much must my
   no nor not now of off on once only or other our out over own re really s same she
   should so some still such t than that the their them then there these they this
   those through to today too up very was we well went were what when where which
   while who why will with would you your yours`
    .split(/\s+/)
    .filter(Boolean)
)

export interface WordSignal {
  word: string
  roughCount: number
  totalCount: number
  share: number
}

/**
 * Words that show up disproportionately on low-mood days. A crude signal,
 * but it surfaces recurring niggles ("knee", "sleep") you'd never spot by
 * scrolling back through months of entries.
 */
export function roughDayWords(entries: DiaryEntry[]): WordSignal[] {
  const rough = new Set(["low", "rough"])
  const roughCounts = new Map<string, number>()
  const totalCounts = new Map<string, number>()
  let roughEntries = 0

  for (const entry of entries) {
    const isRough = rough.has(entry.mood)
    if (isRough) roughEntries++
    const words = new Set(
      `${entry.title} ${entry.content}`
        .toLowerCase()
        .split(/[^a-z']+/)
        .map((w) => w.replace(/^'+|'+$/g, ""))
        .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    )
    for (const word of words) {
      totalCounts.set(word, (totalCounts.get(word) ?? 0) + 1)
      if (isRough) roughCounts.set(word, (roughCounts.get(word) ?? 0) + 1)
    }
  }

  if (roughEntries < 2) return []

  return [...roughCounts.entries()]
    .map(([word, roughCount]) => {
      const totalCount = totalCounts.get(word) ?? roughCount
      return { word, roughCount, totalCount, share: roughCount / totalCount }
    })
    .filter((w) => w.roughCount >= 2 && w.share >= 0.6)
    .sort((a, b) => b.roughCount - a.roughCount || b.share - a.share)
    .slice(0, 8)
}

/* ------------------------------------------------------------------ */
/* Muscle balance                                                      */
/* ------------------------------------------------------------------ */

export interface MuscleVolume {
  muscle: MuscleId
  label: string
  /** Direct sets, where this muscle is the point of the lift. */
  primarySets: number
  /** Sets where it assists — counted at half weight, the usual convention. */
  secondarySets: number
  effectiveSets: number
}

export interface BalanceReport {
  volumes: MuscleVolume[]
  patterns: { pattern: MovementPattern; sets: number }[]
  pushSets: number
  pullSets: number
  legSets: number
  totalSets: number
  /** Sets whose exercise name the catalogue didn't recognise. */
  unclassifiedSets: number
  warning: string | null
}

export function muscleBalance(
  workouts: Workout[],
  windowDays = 30
): BalanceReport {
  const since = daysAgoISO(windowDays)
  const primaryCounts = new Map<MuscleId, number>()
  const secondaryCounts = new Map<MuscleId, number>()
  const patternCounts = new Map<MovementPattern, number>()
  let totalSets = 0
  let unclassifiedSets = 0

  for (const w of workouts) {
    if (w.date <= since) continue
    for (const ex of w.exercises) {
      const sets = ex.sets.length
      if (sets === 0) continue
      totalSets += sets
      const info = classifyExercise(ex.name)
      if (!info.category) {
        unclassifiedSets += sets
        continue
      }
      for (const m of info.primary) {
        primaryCounts.set(m, (primaryCounts.get(m) ?? 0) + sets)
      }
      for (const m of info.secondary) {
        secondaryCounts.set(m, (secondaryCounts.get(m) ?? 0) + sets)
      }
      if (info.pattern) {
        patternCounts.set(
          info.pattern,
          (patternCounts.get(info.pattern) ?? 0) + sets
        )
      }
    }
  }

  const muscleIds = new Set<MuscleId>([
    ...primaryCounts.keys(),
    ...secondaryCounts.keys(),
  ])
  const volumes: MuscleVolume[] = [...muscleIds]
    .map((muscle) => {
      const primarySets = primaryCounts.get(muscle) ?? 0
      const secondarySets = secondaryCounts.get(muscle) ?? 0
      return {
        muscle,
        label: muscleLabel(muscle),
        primarySets,
        secondarySets,
        effectiveSets: primarySets + secondarySets * 0.5,
      }
    })
    .sort((a, b) => b.effectiveSets - a.effectiveSets)

  const patterns = [...patternCounts.entries()]
    .map(([pattern, sets]) => ({ pattern, sets }))
    .sort((a, b) => b.sets - a.sets)

  const patternSets = (p: MovementPattern) => patternCounts.get(p) ?? 0
  const pushSets = patternSets("Push")
  const pullSets = patternSets("Pull")
  const legSets = patternSets("Legs")

  let warning: string | null = null
  if (pushSets + pullSets >= 8) {
    if (pushSets >= pullSets * 1.75) {
      warning = `Pressing volume is well ahead of pulling (${pushSets} vs ${pullSets} sets). More rows or pull-ups would even that out.`
    } else if (pullSets >= pushSets * 1.75) {
      warning = `Pulling volume is well ahead of pressing (${pullSets} vs ${pushSets} sets).`
    }
  }
  if (!warning && pushSets + pullSets >= 12 && legSets === 0) {
    warning = "No leg work logged in this window."
  }

  return {
    volumes,
    patterns,
    pushSets,
    pullSets,
    legSets,
    totalSets,
    unclassifiedSets,
    warning,
  }
}

/* ------------------------------------------------------------------ */
/* Heatmap                                                             */
/* ------------------------------------------------------------------ */

export interface HeatmapDay {
  date: string
  count: number
  minutes: number
  level: 0 | 1 | 2 | 3 | 4
}

/** Day-by-day training activity for the last `weeks` weeks, oldest first. */
export function heatmapData(workouts: Workout[], weeks = 26): HeatmapDay[] {
  const byDate = new Map<string, { count: number; minutes: number }>()
  for (const w of workouts) {
    const cur = byDate.get(w.date) ?? { count: 0, minutes: 0 }
    cur.count++
    cur.minutes += w.durationMin
    byDate.set(w.date, cur)
  }

  // Start on the Monday that begins the window so columns line up as weeks.
  const end = new Date(`${todayISO()}T00:00:00`)
  const start = new Date(end)
  start.setDate(start.getDate() - weeks * 7 + 1)
  const dow = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - dow)

  const days: HeatmapDay[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = isoOf(d)
    const hit = byDate.get(date)
    const minutes = hit?.minutes ?? 0
    let level: HeatmapDay["level"] = 0
    if (minutes > 0) level = 1
    if (minutes >= 30) level = 2
    if (minutes >= 60) level = 3
    if (minutes >= 90) level = 4
    days.push({ date, count: hit?.count ?? 0, minutes, level })
  }
  return days
}
