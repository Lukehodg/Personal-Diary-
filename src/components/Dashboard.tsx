import { Activity, BookOpen, Dumbbell, Flame, Timer } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatDate, todayISO } from "@/lib/store"
import { MOODS, type DiaryEntry, type Workout } from "@/lib/types"

const WEEKLY_GOAL = 4

function startOfWeekISO(): string {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1 // week starts Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  const offset = monday.getTimezoneOffset()
  return new Date(monday.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

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
}

export function Dashboard({ workouts, entries }: DashboardProps) {
  const weekStart = startOfWeekISO()
  const thisWeek = workouts.filter((w) => w.date >= weekStart)
  const minutesThisWeek = thisWeek.reduce((sum, w) => sum + w.durationMin, 0)
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
    {
      title: "Diary entries",
      value: String(entriesThisMonth),
      sub: "This month",
      icon: BookOpen,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Weekly goal</CardTitle>
            <CardDescription>
              {thisWeek.length} of {WEEKLY_GOAL} workouts completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={goalPct} />
            <p className="text-sm text-muted-foreground">
              {thisWeek.length >= WEEKLY_GOAL
                ? "Goal hit — nice work! 🎉"
                : `${WEEKLY_GOAL - thisWeek.length} more to hit your goal.`}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              Your latest workouts and diary entries
            </CardDescription>
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
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.date)}
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
