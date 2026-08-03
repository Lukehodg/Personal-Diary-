/**
 * A minimal Open mHealth (https://www.openmhealth.org) layer: every data
 * point, whatever it came from, gets wrapped in the same header/body shape
 * the IEEE 1752-style omh schemas use. This is what lets HealthKit samples
 * and the app's own logged workouts and measurements feed the same health
 * score without the score caring which one supplied a given point.
 *
 * Only the fields the score actually reads are modelled — this isn't a full
 * omh schema implementation, just enough of the shape to be a real one.
 */
import { newId } from "@/lib/store"
import type { MeasurementCategory, MeasurementEntry, Workout } from "@/lib/types"

export type OmhSchemaName =
  | "step-count"
  | "heart-rate"
  | "physical-activity"
  | "body-weight"

export interface OmhTimeInterval {
  start_date_time: string
  end_date_time: string
}

export interface OmhDataPoint<TBody> {
  header: {
    id: string
    creation_date_time: string
    schema_id: { namespace: "omh"; name: OmhSchemaName; version: string }
    acquisition_provenance: {
      source_name: string
      modality: "sensed" | "self-reported"
    }
  }
  body: TBody
}

export interface StepCountBody {
  step_count: number
  effective_time_frame: { time_interval: OmhTimeInterval }
}

export interface HeartRateBody {
  heart_rate: { value: number; unit: "beats/min" }
  effective_time_frame: { date_time: string }
}

export interface PhysicalActivityBody {
  activity_name: string
  effective_time_frame: { time_interval: OmhTimeInterval }
  distance?: { value: number; unit: "km" }
  calories_burned?: { value: number; unit: "kcal" }
  average_heart_rate?: { value: number; unit: "beats/min" }
}

export interface BodyWeightBody {
  body_weight: { value: number; unit: "kg" }
  effective_time_frame: { date_time: string }
}

function point<TBody>(
  name: OmhSchemaName,
  version: string,
  body: TBody,
  provenance: { source_name: string; modality: "sensed" | "self-reported" }
): OmhDataPoint<TBody> {
  return {
    header: {
      id: newId(),
      creation_date_time: new Date().toISOString(),
      schema_id: { namespace: "omh", name, version },
      acquisition_provenance: provenance,
    },
    body,
  }
}

/* ------------------------------------------------------------------ */
/* From the app's own logged data                                     */
/* ------------------------------------------------------------------ */

/** A logged workout is, in omh terms, one self-reported physical activity. */
export function workoutToOmh(w: Workout): OmhDataPoint<PhysicalActivityBody> {
  const start = w.startTime ?? `${w.date}T12:00:00`
  const end = new Date(
    new Date(start).getTime() + w.durationMin * 60_000
  ).toISOString()
  const body: PhysicalActivityBody = {
    activity_name: w.type,
    effective_time_frame: {
      time_interval: { start_date_time: start, end_date_time: end },
    },
  }
  if (w.stats?.distanceKm !== undefined)
    body.distance = { value: w.stats.distanceKm, unit: "km" }
  if (w.stats?.calories !== undefined)
    body.calories_burned = { value: w.stats.calories, unit: "kcal" }
  if (w.stats?.avgHr !== undefined)
    body.average_heart_rate = { value: w.stats.avgHr, unit: "beats/min" }
  return point(
    "physical-activity",
    "1.2",
    body,
    w.source === "garmin"
      ? { source_name: "Garmin", modality: "sensed" }
      : { source_name: "Workout Diary", modality: "self-reported" }
  )
}

/** Only measurement entries logged against a kg-denominated category count as body weight. */
export function measurementToOmh(
  entry: MeasurementEntry,
  category: MeasurementCategory | undefined
): OmhDataPoint<BodyWeightBody> | null {
  if (!category || category.unit.toLowerCase() !== "kg") return null
  return point(
    "body-weight",
    "2.0",
    {
      body_weight: { value: entry.value, unit: "kg" },
      effective_time_frame: { date_time: `${entry.date}T08:00:00` },
    },
    { source_name: "Workout Diary", modality: "self-reported" }
  )
}

export function workoutsToOmh(
  workouts: Workout[]
): OmhDataPoint<PhysicalActivityBody>[] {
  return workouts.map(workoutToOmh)
}

export function measurementsToOmh(
  entries: MeasurementEntry[],
  categories: MeasurementCategory[]
): OmhDataPoint<BodyWeightBody>[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const points: OmhDataPoint<BodyWeightBody>[] = []
  for (const entry of entries) {
    const p = measurementToOmh(entry, byId.get(entry.categoryId))
    if (p) points.push(p)
  }
  return points
}
