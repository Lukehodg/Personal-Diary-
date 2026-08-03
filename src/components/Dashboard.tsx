import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarArrowDown,
  CheckCircle2,
  Dumbbell,
  Flame,
  Heart,
  Route,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  HealthScoreCard,
  type HealthKitSync,
} from "@/components/HealthScoreCard"
import { downloadICS } from "@/lib/calendar"
import {
  personalRecords,
  startOfWeekISO,
  trainingLoad,
  type LoadZone,
} from "@/lib/analytics"
import { formatDate, todayISO } from "@/lib/store"
import {
  MOODS,
  type DiaryEntry,
  type MeasurementCategory,
  type MeasurementEntry,
  type Workout,
} from "@/lib/types"

/** Mirrors the Insights tab so the same signal reads the same in both places. */
const ZONE_STYLE: Record<
  LoadZone,
  { color: string; icon: typeof CheckCircle2; label: string }
> = {
  detraining: {
    color: "text-muted-foreground",
    icon: TrendingDown,
    label: "Detraining",
  },
  optimal: { color: "text-status-good", icon: CheckCircle2, label: "Optimal" },
  caution: {
    color: "text-status-warning",
    icon: AlertTriangle,
    label: "Caution",
  },
  "high risk": {
    color: "text-status-critical",
    icon: AlertTriangle,
    label: "High risk",
  },
}

const WEEKLY_GOAL = 4

function currentStreak(workouts: Workout[]): number {
  const days = new Set(workouts.map((w) => w.date))
  let streak = 0
  const cursor = new Date(`${todayISO()}T00:00:00`)
  // A streak is alive if there's activity today or yesterday
  const isoOf = (d: Date) => {
    const offset = d.getTimezoneOffset()
    return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10)
  }
  if (!days.has(isoOf(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(isoOf(cursor))) return 0
  }
  while (days.has(isoOf(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

interface DashboardProps {
  workouts: Workout[]
  entries: DiaryEntry[]
  measurements: MeasurementEntry[]
  measurementCategories: MeasurementCategory[]
  healthKit: HealthKitSync
  onSyncHealthKit: (sync: HealthKitSync) => void
}

export function Dashboard({
  workouts,
  entries,
  measurements,
  measurementCategories,
  healthKit,
  onSyncHealthKit,
}: DashboardProps) {
  const weekStart = startOfWeekISO()
  const thisWeek = workouts.filter((w) => w.date >= weekStart)
  const minutesThisWeek = thisWeek.reduce((sum, w) => sum + w.durationMin, 0)
  const caloriesThisWeek = thisWeek.reduce(
    (sum, w) => sum + (w.stats?.calories ?? 0),
    0
  )
  const distanceThisWeek = thisWeek.reduce(
    (sum, w) => sum + (w.stats?.distanceKm ?? 0),
    0
  )
  const streak = currentStreak(workouts)
  const monthStart = todayISO().slice(0, 8) + "01"
  const entriesThisMonth = entries.filter((e) => e.date >= monthStart).length
  const goalPct = Math.min(100, (thisWeek.length / WEEKLY_GOAL) * 100)

  const recent = [
    ...workouts.map((w) => ({
      kind: "workout" as const,
      date: w.date,
      id: w.id,
      workout: w,
    })),
    ...entries.map((e) => ({
      kind: "entry" as const,
      date: e.date,
      id: e.id,
      entry: e,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)

  const stats = [
    {
      title: "Workouts this week",
      value: String(thisWeek.length),
      sub: `Goal: ${WEEKLY_GOAL} per week`,
      icon: Dumbbell,
    },
    {
      title: "Active minutes",
      value: String(minutesThisWeek),
      sub: "This week",
      icon: Timer,
    },
    {
      title: "Current streak",
      value: `${streak} ${streak === 1 ? "day" : "days"}`,
      sub: "Consecutive workout days",
      icon: Flame,
    },
    caloriesThisWeek > 0
      ? {
          title: "Calories burned",
          value: caloriesThisWeek.toLocaleString(),
          sub:
            distanceThisWeek > 0
              ? `${Math.round(distanceThisWeek * 10) / 10} km covered`
              : "This week",
          icon: Heart,
        }
      : {
          title: "Diary entries",
          value: String(entriesThisMonth),
          sub: "This month",
          icon: BookOpen,
        },
  ]

  const breakdown = [
    ...new Set(thisWeek.map((w) => w.type)),
  ].map((type) => ({
    type,
    count: thisWeek.filter((w) => w.type === type).length,
  }))

  // Pulled through from Insights so the headline signals are on the home
  // screen, where you'll actually see them.
  const load = trainingLoad(workouts)
  const zone = ZONE_STYLE[load.zone]
  const ZoneIcon = zone.icon
  const topPR = personalRecords(workouts)[0]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium leading-tight text-muted-foreground">
                {stat.title}
              </p>
              <stat.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight tabular">
              {stat.value}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
          </Card>
        ))}
      </div>

      {(load.hasEnoughData || topPR) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {load.hasEnoughData && (
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Training load
                </p>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${zone.color}`}
                >
                  <ZoneIcon className="h-3.5 w-3.5" />
                  {zone.label}
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight tabular">
                {load.ratio.toFixed(2)}
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {load.message}
              </p>
            </Card>
          )}

          {topPR && (
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-medium text-muted-foreground">
                  Best lift · {topPR.name}
                </p>
                <Trophy className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight tabular">
                  {topPR.bestE1rm} kg
                </span>
                {topPR.progressPct > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-status-good">
                    <TrendingUp className="h-3 w-3" />+{topPR.progressPct}%
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground tabular">
                {topPR.bestSet.reps} × {topPR.bestSet.weight} kg ·{" "}
                {formatDate(topPR.bestDate)}
              </p>
            </Card>
          )}
        </div>
      )}

      <HealthScoreCard
        workouts={workouts}
        measurements={measurements}
        measurementCategories={measurementCategories}
        healthKit={healthKit}
        onSync={onSyncHealthKit}
      />

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Weekly goal</CardTitle>
            <CardDescription>
              {thisWeek.length} of {WEEKLY_GOAL} workouts completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Progress value={goalPct} />
              <p className="text-sm text-muted-foreground">
                {thisWeek.length >= WEEKLY_GOAL
                  ? "Goal hit — nice work! 🎉"
                  : `${WEEKLY_GOAL - thisWeek.length} more to hit your goal.`}
              </p>
            </div>

            {breakdown.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  This week's mix
                </p>
                <div className="flex flex-wrap gap-2">
                  {breakdown.map((b) => (
                    <Badge
                      key={b.type}
                      variant="secondary"
                      className="capitalize"
                    >
                      {b.type} × {b.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Diary entries this month
              </span>
              <span className="font-medium">{entriesThisMonth}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>
                Your latest workouts and diary entries
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadICS(workouts)}
              disabled={workouts.length === 0}
            >
              <CalendarArrowDown /> Calendar
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <Activity className="h-8 w-8" />
                <p className="text-sm">
                  Nothing here yet. Log a workout or write a diary entry to get
                  started.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recent.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      {item.kind === "workout" ? (
                        <Dumbbell className="h-4 w-4" />
                      ) : (
                        <span className="text-base leading-none">
                          {MOODS.find((m) => m.value === item.entry.mood)
                            ?.emoji ?? "📓"}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.kind === "workout"
                          ? item.workout.name
                          : item.entry.title || "Diary entry"}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        {formatDate(item.date)}
                        {item.kind === "workout" &&
                          item.workout.stats?.distanceKm !== undefined && (
                            <span className="flex items-center gap-1">
                              <Route className="h-3 w-3" />
                              {item.workout.stats.distanceKm} km
                            </span>
                          )}
                        {item.kind === "workout" &&
                          item.workout.stats?.calories !== undefined && (
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {item.workout.stats.calories} kcal
                            </span>
                          )}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {item.kind === "workout"
                        ? `${item.workout.durationMin} min`
                        : "Diary"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
