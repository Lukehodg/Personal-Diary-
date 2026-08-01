import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react"

import { Heatmap } from "@/components/Heatmap"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  moodCorrelation,
  muscleBalance,
  personalRecords,
  roughDayWords,
  trainingLoad,
  type ExercisePR,
  type LoadZone,
} from "@/lib/analytics"
import { formatDate } from "@/lib/store"
import type { DiaryEntry, Workout } from "@/lib/types"

interface InsightsProps {
  workouts: Workout[]
  entries: DiaryEntry[]
}

/* ---------------------------------------------------------------- */
/* Sparkline: one series, so no legend — the tile title names it.    */
/* ---------------------------------------------------------------- */

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const width = 120
  const height = 32
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const coords = points.map((value, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((value - min) / span) * (height - 4) - 2
    return [x, y] as const
  })
  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ")
  const [lastX, lastY] = coords[coords.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill="currentColor" />
    </svg>
  )
}

/* ---------------------------------------------------------------- */
/* Training load meter                                               */
/* ---------------------------------------------------------------- */

const ZONE_STYLE: Record<
  LoadZone,
  { color: string; icon: typeof CheckCircle2; label: string }
> = {
  detraining: { color: "text-muted-foreground", icon: TrendingDown, label: "Detraining" },
  optimal: { color: "text-status-good", icon: CheckCircle2, label: "Optimal" },
  caution: { color: "text-status-warning", icon: AlertTriangle, label: "Caution" },
  "high risk": { color: "text-status-critical", icon: AlertTriangle, label: "High risk" },
}

function LoadMeter({ workouts }: { workouts: Workout[] }) {
  const load = trainingLoad(workouts)
  const style = ZONE_STYLE[load.zone]
  const Icon = style.icon
  // The meter tops out at 2.0 — beyond that the exact number stops mattering.
  const position = Math.min(load.ratio / 2, 1) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training load</CardTitle>
        <CardDescription>
          This week's workload against your four-week average
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!load.hasEnoughData ? (
          <p className="text-sm text-muted-foreground">
            Log at least four workouts over a month and this will show whether
            you're ramping up too fast.
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold">{load.ratio.toFixed(2)}</p>
              <span
                className={`flex items-center gap-1.5 text-sm font-medium ${style.color}`}
              >
                <Icon className="h-4 w-4" />
                {style.label}
              </span>
            </div>

            <div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${position}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>0.8</span>
                <span>1.3 sweet spot</span>
                <span>1.5+</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{load.message}</p>
            <dl className="flex gap-6 border-t pt-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Last 7 days</dt>
                <dd className="font-medium tabular-nums">{load.acute} units</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">4-week average</dt>
                <dd className="font-medium tabular-nums">{load.chronic} units</dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------------------------------- */
/* Personal records                                                  */
/* ---------------------------------------------------------------- */

function PRCard({ pr }: { pr: ExercisePR }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{pr.name}</p>
          <p className="text-xs text-muted-foreground">
            {pr.bestSet.reps} × {pr.bestSet.weight} kg · {formatDate(pr.bestDate)}
          </p>
        </div>
        <Badge variant="secondary">{pr.muscle}</Badge>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-bold">{pr.bestE1rm} kg</p>
          <p className="text-xs text-muted-foreground">
            estimated 1RM
            {pr.progressPct > 0 && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-status-good">
                <TrendingUp className="h-3 w-3" />+{pr.progressPct}%
              </span>
            )}
          </p>
        </div>
        <div className="text-muted-foreground">
          <Sparkline points={pr.history.map((p) => p.e1rm)} />
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */

export function Insights({ workouts, entries }: InsightsProps) {
  const prs = personalRecords(workouts).slice(0, 6)
  const mood = moodCorrelation(workouts, entries)
  const balance = muscleBalance(workouts)
  const words = roughDayWords(entries)
  const maxSets = Math.max(1, ...balance.volumes.map((v) => v.sets))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Insights</h2>
        <p className="text-sm text-muted-foreground">
          Patterns worked out from your own log — nothing leaves this device.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training consistency</CardTitle>
          <CardDescription>The last six months, a square per day</CardDescription>
        </CardHeader>
        <CardContent>
          <Heatmap workouts={workouts} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <LoadMeter workouts={workouts} />

        <Card>
          <CardHeader>
            <CardTitle>Mood and training</CardTitle>
            <CardDescription>
              Average diary mood on days you trained versus days you didn't
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!mood.hasEnoughData ? (
              <p className="text-sm text-muted-foreground">
                Needs at least three diary entries on training days and three on
                rest days. So far: {mood.trainingDays} and {mood.restDays}.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground">Training days</p>
                    <p className="text-3xl font-bold">{mood.trainingAvg}</p>
                    <p className="text-xs text-muted-foreground">
                      {mood.trainingDays} entries
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rest days</p>
                    <p className="text-3xl font-bold">{mood.restAvg}</p>
                    <p className="text-xs text-muted-foreground">
                      {mood.restDays} entries
                    </p>
                  </div>
                </div>
                <p className="flex items-start gap-2 border-t pt-3 text-sm text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                  {mood.delta > 0.3
                    ? `Your mood runs ${mood.delta} points higher on days you train.`
                    : mood.delta < -0.3
                      ? `Your mood runs ${Math.abs(mood.delta)} points lower on days you train — worth asking whether the sessions are too much.`
                      : "Training days and rest days score about the same so far."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal records</CardTitle>
          <CardDescription>
            Best estimated one-rep max per lift, using the Epley formula
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <Trophy className="h-8 w-8" />
              <p className="text-sm">
                Log some sets with weights and your records will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {prs.map((pr) => (
                <PRCard key={pr.key} pr={pr} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Muscle balance</CardTitle>
            <CardDescription>Sets per muscle group, last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {balance.volumes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No exercises logged in the last 30 days.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {balance.volumes.map((v) => (
                    <div key={v.muscle} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-sm">{v.muscle}</span>
                      <div className="h-4 flex-1">
                        <div
                          className="h-full rounded-sm bg-primary"
                          style={{ width: `${(v.sets / maxSets) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                        {v.sets}
                      </span>
                    </div>
                  ))}
                </div>
                {balance.warning ? (
                  <p className="flex items-start gap-2 border-t pt-3 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
                    {balance.warning}
                  </p>
                ) : (
                  balance.pushSets + balance.pullSets > 0 && (
                    <p className="flex items-start gap-2 border-t pt-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-good" />
                      Push and pull volume look reasonably balanced (
                      {balance.pushSets} vs {balance.pullSets} sets).
                    </p>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Words on rough days</CardTitle>
            <CardDescription>
              What you tend to write about when your mood is low
            </CardDescription>
          </CardHeader>
          <CardContent>
            {words.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Once you've written a few entries on low-mood days, recurring
                themes will show up here — often a niggle you hadn't noticed.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {words.map((w) => (
                    <Badge key={w.word} variant="secondary">
                      {w.word}
                      <span className="ml-1.5 text-muted-foreground">
                        {w.roughCount}×
                      </span>
                    </Badge>
                  ))}
                </div>
                <p className="flex items-start gap-2 border-t pt-3 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  These words appear mostly in your low-mood entries. It's a
                  rough signal, not a diagnosis.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> How these are worked out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Estimated 1RM</strong> uses Epley
            (weight × (1 + reps ÷ 30)), which is reliable up to about 10 reps.
          </p>
          <p>
            <strong className="text-foreground">Training load</strong> is the
            acute:chronic workload ratio used in sports science: the last 7 days
            of load divided by your rolling 4-week average. Load is duration
            scaled by heart rate where Garmin provided it, or by workout type
            otherwise. Ratios above roughly 1.5 are associated with higher
            injury risk.
          </p>
          <p>
            <strong className="text-foreground">Muscle balance</strong> maps
            exercise names onto muscle groups by keyword, so unusual names may
            land in “Other”.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
