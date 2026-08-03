/**
 * Thin wrapper around the `capacitor-health` plugin (Apple HealthKit on iOS,
 * Health Connect on Android). Every read is converted straight to an Open
 * mHealth point so the rest of the app never has to know a sample came from
 * HealthKit rather than something the user typed in.
 *
 * Only meaningful inside the native app shell — in a browser tab there's no
 * HealthKit to talk to, so `isAvailable()` resolves false and every fetch
 * returns an empty list rather than throwing.
 */
import { Capacitor } from "@capacitor/core"
import { Health, type HealthPermission } from "capacitor-health"

import {
  type OmhDataPoint,
  type PhysicalActivityBody,
  type StepCountBody,
} from "@/lib/openmhealth"
import { newId } from "@/lib/store"

const READ_PERMISSIONS: HealthPermission[] = [
  "READ_STEPS",
  "READ_WORKOUTS",
  "READ_ACTIVE_CALORIES",
  "READ_DISTANCE",
  "READ_HEART_RATE",
]

/** True only when running as the installed native app, not a browser tab. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function isAvailable(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { available } = await Health.isHealthAvailable()
    return available
  } catch {
    return false
  }
}

export async function requestPermissions(): Promise<boolean> {
  if (!isNative()) return false
  const { permissions } = await Health.requestHealthPermissions({
    permissions: READ_PERMISSIONS,
  })
  return permissions.every((p) => Object.values(p).every(Boolean))
}

function sourceProvenance(sourceName: string) {
  return { source_name: sourceName || "Apple Health", modality: "sensed" as const }
}

function omhStepPoint(
  sample: { startDate: string; endDate: string; value: number },
  source: string
): OmhDataPoint<StepCountBody> {
  return {
    header: {
      id: newId(),
      creation_date_time: new Date().toISOString(),
      schema_id: { namespace: "omh", name: "step-count", version: "1.0" },
      acquisition_provenance: sourceProvenance(source),
    },
    body: {
      step_count: Math.round(sample.value),
      effective_time_frame: {
        time_interval: {
          start_date_time: sample.startDate,
          end_date_time: sample.endDate,
        },
      },
    },
  }
}

function omhWorkoutPoint(
  w: Awaited<ReturnType<typeof Health.queryWorkouts>>["workouts"][number]
): OmhDataPoint<PhysicalActivityBody> {
  const body: PhysicalActivityBody = {
    activity_name: w.workoutType,
    effective_time_frame: {
      time_interval: { start_date_time: w.startDate, end_date_time: w.endDate },
    },
  }
  if (w.distance) body.distance = { value: w.distance / 1000, unit: "km" }
  if (w.calories) body.calories_burned = { value: w.calories, unit: "kcal" }
  if (w.heartRate && w.heartRate.length > 0) {
    const avg =
      w.heartRate.reduce((sum, s) => sum + s.bpm, 0) / w.heartRate.length
    body.average_heart_rate = { value: Math.round(avg), unit: "beats/min" }
  }
  return {
    header: {
      id: newId(),
      creation_date_time: new Date().toISOString(),
      schema_id: { namespace: "omh", name: "physical-activity", version: "1.2" },
      acquisition_provenance: sourceProvenance(w.sourceName),
    },
    body,
  }
}

/** Steps and workouts (with a per-workout average heart rate where Apple Health has one), for the last `days` days. */
export async function fetchRecent(
  days: number
): Promise<{
  steps: OmhDataPoint<StepCountBody>[]
  activities: OmhDataPoint<PhysicalActivityBody>[]
}> {
  const empty = { steps: [], activities: [] }
  if (!(await isAvailable())) return empty

  const endDate = new Date().toISOString()
  const startDate = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString()

  const [stepsRes, workoutsRes] = await Promise.all([
    Health.queryAggregated({
      startDate,
      endDate,
      dataType: "steps",
      bucket: "day",
    }),
    Health.queryWorkouts({
      startDate,
      endDate,
      includeHeartRate: true,
      includeRoute: false,
      includeSteps: false,
    }),
  ])

  const steps = stepsRes.aggregatedData
    .filter((s) => s.value > 0)
    .map((s) => omhStepPoint(s, "Apple Health"))
  const activities = workoutsRes.workouts.map(omhWorkoutPoint)

  return { steps, activities }
}
