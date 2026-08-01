import { heatmapData } from "@/lib/analytics"
import { formatDate } from "@/lib/store"
import type { Workout } from "@/lib/types"

const LEVEL_CLASS: Record<number, string> = {
  0: "bg-muted",
  1: "bg-primary/25",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"]

export function Heatmap({ workouts }: { workouts: Workout[] }) {
  const days = heatmapData(workouts, 26)

  // Chunk into calendar weeks — the data starts on a Monday.
  const weeks: (typeof days)[] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const monthLabels = weeks.map((week, i) => {
    const first = week[0]
    if (!first) return ""
    const month = new Date(`${first.date}T00:00:00`).toLocaleDateString(
      undefined,
      { month: "short" }
    )
    const prev = weeks[i - 1]?.[0]
    const prevMonth = prev
      ? new Date(`${prev.date}T00:00:00`).toLocaleDateString(undefined, {
          month: "short",
        })
      : ""
    return month === prevMonth ? "" : month
  })

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-1">
        <div className="mt-[18px] flex flex-col gap-1 pr-1">
          {DAY_LABELS.map((label, i) => (
            <span
              key={i}
              className="h-3 text-[10px] leading-3 text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            <span className="h-[14px] text-[10px] leading-[14px] text-muted-foreground">
              {monthLabels[wi]}
            </span>
            {week.map((day) => (
              <div
                key={day.date}
                className={`h-3 w-3 rounded-[2px] ${LEVEL_CLASS[day.level]}`}
                title={
                  day.count > 0
                    ? `${formatDate(day.date)} — ${day.count} workout${
                        day.count === 1 ? "" : "s"
                      }, ${day.minutes} min`
                    : `${formatDate(day.date)} — rest`
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-3 w-3 rounded-[2px] ${LEVEL_CLASS[level]}`}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
