/**
 * A single 0–100 health score built entirely on top of the Open mHealth
 * layer (openmhealth.ts) — it never looks at Workout[] or MeasurementEntry[]
 * directly, only the omh points derived from them (plus whatever HealthKit
 * contributed). That's what lets a self-logged workout and an Apple Watch
 * workout count the same way.
 *
 * Each subscore is only included once there's enough of the right kind of
 * point to say something real — same "hasEnoughData" gating the rest of the
 * analytics module uses — and the total is the average of whichever
 * subscores cleared that bar, so a user with no weigh-ins isn't punished for
 * data they never chose to track.
 */
import { daysAgoISO, isoOf } from "@/lib/analytics"
import type {
  BodyWeightBody,
  OmhDataPoint,
  PhysicalActivityBody,
  StepCountBody,
} from "@/lib/openmhealth"

export interface HealthPoints {
  steps: OmhDataPoint<StepCountBody>[]
  activities: OmhDataPoint<PhysicalActivityBody>[]
  bodyWeight: OmhDataPoint<BodyWeightBody>[]
}

export interface Subscore {
  key: "activity" | "consistency" | "load" | "tracking"
  label: string
  score: number
  detail: string
}

export interface HealthScore {
  score: number | null
  subscores: Subscore[]
  hasEnoughData: boolean
}

const STEP_TARGET_PER_DAY = 8000
const ACTIVE_MINUTES_TARGET_PER_WEEK = 150 // WHO guideline
const CONSISTENCY_TARGET_DAYS = 4 // matches the dashboard's weekly workout goal
const WEIGH_IN_TARGET_PER_4_WEEKS = 8 // roughly twice a week

/** Same duration-scaled-by-intensity idea as analytics.ts's workoutLoad, over an omh activity. */
const TYPE_INTENSITY: Record<string, number> = {
  strength: 1.1,
  cardio: 1.3,
  sports: 1.2,
  flexibility: 0.6,
  running: 1.3,
  cycling: 1.2,
  walking: 0.9,
  swimming: 1.3,
  hiit: 1.4,
}

function activityIntensity(a: PhysicalActivityBody): number {
  if (a.average_heart_rate) return a.average_heart_rate.value / 100
  const name = a.activity_name.toLowerCase()
  for (const [key, intensity] of Object.entries(TYPE_INTENSITY)) {
    if (name.includes(key)) return intensity
  }
  return 1.0
}

function activityMinutes(a: PhysicalActivityBody): number {
  const { start_date_time, end_date_time } = a.effective_time_frame.time_interval
  return (
    (new Date(end_date_time).getTime() - new Date(start_date_time).getTime()) /
    60_000
  )
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

export function computeHealthScore(points: HealthPoints): HealthScore {
  const weekAgo = daysAgoISO(7)
  const monthAgo = daysAgoISO(28)
  const subscores: Subscore[] = []

  /* Activity: steps + active minutes against weekly targets. */
  const recentSteps = points.steps.filter(
    (p) => isoOf(new Date(p.body.effective_time_frame.time_interval.start_date_time)) > weekAgo
  )
  const recentActivities = points.activities.filter(
    (p) => isoOf(new Date(p.body.effective_time_frame.time_interval.start_date_time)) > weekAgo
  )
  if (recentSteps.length > 0 || recentActivities.length > 0) {
    const avgDailySteps =
      recentSteps.length > 0
        ? recentSteps.reduce((sum, p) => sum + p.body.step_count, 0) /
          recentSteps.length
        : null
    const activeMinutes = recentActivities.reduce(
      (sum, p) => sum + activityMinutes(p.body),
      0
    )
    const stepPct = avgDailySteps !== null ? (avgDailySteps / STEP_TARGET_PER_DAY) * 100 : null
    const minutesPct = (activeMinutes / ACTIVE_MINUTES_TARGET_PER_WEEK) * 100
    const parts = [stepPct, minutesPct].filter((n): n is number => n !== null)
    const score = clampScore(parts.reduce((a, b) => a + b, 0) / parts.length)
    subscores.push({
      key: "activity",
      label: "Activity",
      score,
      detail:
        avgDailySteps !== null
          ? `${Math.round(avgDailySteps).toLocaleString()} steps/day avg · ${Math.round(activeMinutes)} active min this week`
          : `${Math.round(activeMinutes)} active min this week`,
    })
  }

  /* Consistency: distinct active days this week against the weekly goal. */
  const monthActivities = points.activities.filter(
    (p) => isoOf(new Date(p.body.effective_time_frame.time_interval.start_date_time)) > monthAgo
  )
  if (monthActivities.length >= 2) {
    const activeDays = new Set(
      recentActivities.map((p) =>
        isoOf(new Date(p.body.effective_time_frame.time_interval.start_date_time))
      )
    )
    const score = clampScore((activeDays.size / CONSISTENCY_TARGET_DAYS) * 100)
    subscores.push({
      key: "consistency",
      label: "Consistency",
      score,
      detail: `Active ${activeDays.size} of the last 7 days`,
    })
  }

  /* Load balance: acute (7d) vs chronic (28d avg) load, same bands as the training-load card. */
  if (monthActivities.length >= 4) {
    const load = (p: OmhDataPoint<PhysicalActivityBody>) =>
      activityMinutes(p.body) * activityIntensity(p.body)
    const acute = recentActivities.reduce((sum, p) => sum + load(p), 0)
    const chronic = monthActivities.reduce((sum, p) => sum + load(p), 0) / 4
    const ratio = chronic > 0 ? acute / chronic : 0
    let score: number
    let detail: string
    if (ratio < 0.8) {
      score = 65
      detail = "Lighter than usual this week"
    } else if (ratio <= 1.3) {
      score = 100
      detail = "Building load without overreaching"
    } else if (ratio <= 1.5) {
      score = 70
      detail = "Ramping up quickly — watch recovery"
    } else {
      score = 40
      detail = "Sharp spike in load this week"
    }
    subscores.push({ key: "load", label: "Load balance", score, detail })
  }

  /* Body tracking: how often weigh-ins happen, not what they say. */
  const monthWeighIns = points.bodyWeight.filter(
    (p) => isoOf(new Date(p.body.effective_time_frame.date_time)) > monthAgo
  )
  if (monthWeighIns.length >= 2) {
    const score = clampScore(
      (monthWeighIns.length / WEIGH_IN_TARGET_PER_4_WEEKS) * 100
    )
    subscores.push({
      key: "tracking",
      label: "Body tracking",
      score,
      detail: `${monthWeighIns.length} weigh-ins in the last 4 weeks`,
    })
  }

  if (subscores.length === 0) {
    return { score: null, subscores: [], hasEnoughData: false }
  }

  const score = Math.round(
    subscores.reduce((sum, s) => sum + s.score, 0) / subscores.length
  )
  return { score, subscores, hasEnoughData: true }
}
