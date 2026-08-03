import { useEffect, useMemo, useState } from "react"
import { HeartPulse, RefreshCw } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { computeHealthScore, type HealthPoints } from "@/lib/healthScore"
import { fetchRecent, isAvailable, requestPermissions } from "@/lib/healthkit"
import {
  measurementsToOmh,
  workoutsToOmh,
  type OmhDataPoint,
  type PhysicalActivityBody,
  type StepCountBody,
} from "@/lib/openmhealth"
import type {
  MeasurementCategory,
  MeasurementEntry,
  Workout,
} from "@/lib/types"

export interface HealthKitSync {
  steps: OmhDataPoint<StepCountBody>[]
  activities: OmhDataPoint<PhysicalActivityBody>[]
  syncedAt: string | null
}

export const EMPTY_HEALTHKIT_SYNC: HealthKitSync = {
  steps: [],
  activities: [],
  syncedAt: null,
}

interface HealthScoreCardProps {
  workouts: Workout[]
  measurements: MeasurementEntry[]
  measurementCategories: MeasurementCategory[]
  healthKit: HealthKitSync
  onSync: (sync: HealthKitSync) => void
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-status-good"
  if (score >= 50) return "text-status-warning"
  return "text-status-critical"
}

export function HealthScoreCard({
  workouts,
  measurements,
  measurementCategories,
  healthKit,
  onSync,
}: HealthScoreCardProps) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    isAvailable().then(setAvailable)
  }, [])

  const points: HealthPoints = useMemo(
    () => ({
      steps: healthKit.steps,
      activities: [...workoutsToOmh(workouts), ...healthKit.activities],
      bodyWeight: measurementsToOmh(measurements, measurementCategories),
    }),
    [workouts, measurements, measurementCategories, healthKit]
  )

  const result = useMemo(() => computeHealthScore(points), [points])

  const handleSync = async () => {
    setSyncing(true)
    setError("")
    try {
      const granted = await requestPermissions()
      if (!granted) {
        setError("Apple Health permissions were denied.")
        return
      }
      const { steps, activities } = await fetchRecent(30)
      onSync({ steps, activities, syncedAt: new Date().toISOString() })
    } catch (err) {
      // Surfaced verbatim (rather than a friendly generic message) while
      // this integration is still being diagnosed against a real device.
      const detail =
        err instanceof Error ? err.message : String(err)
      setError(`Couldn't reach Apple Health: ${detail}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Health score</CardTitle>
          <CardDescription>
            From your logged workouts, weigh-ins
            {available ? ", and Apple Health" : ""}
          </CardDescription>
        </div>
        {available && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={syncing ? "animate-spin" : ""} />
            Sync
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {result.score === null ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <HeartPulse className="h-8 w-8" />
            <p className="text-sm">
              Log a few workouts{available ? " or sync Apple Health" : ""} to
              see your score.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-4xl font-bold tracking-tight tabular ${scoreColor(result.score)}`}
              >
                {result.score}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="space-y-3">
              {result.subscores.map((s) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.detail}</span>
                  </div>
                  <Progress value={s.score} className="h-1.5" />
                </div>
              ))}
            </div>
          </>
        )}

        {healthKit.syncedAt && (
          <p className="text-xs text-muted-foreground">
            Apple Health synced{" "}
            {new Date(healthKit.syncedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
