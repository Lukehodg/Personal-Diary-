import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { addDaysISO, startOfWeekISO } from "@/lib/analytics"
import { newId, todayISO } from "@/lib/store"
import {
  WORKOUT_TYPES,
  type PlannedWorkout,
  type WorkoutTemplate,
  type WorkoutType,
} from "@/lib/types"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i))
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

interface PlannerProps {
  templates: WorkoutTemplate[]
  planned: PlannedWorkout[]
  onSave: (planned: PlannedWorkout) => void
  onDelete: (id: string) => void
  onStart: (planned: PlannedWorkout) => void
}

export function Planner({
  templates,
  planned,
  onSave,
  onDelete,
  onStart,
}: PlannerProps) {
  const [weekStart, setWeekStart] = useState(startOfWeekISO())
  const [addingFor, setAddingFor] = useState<string | null>(null)
  const [customName, setCustomName] = useState("")
  const [customType, setCustomType] = useState<WorkoutType>("strength")

  const dates = weekDates(weekStart)
  const today = todayISO()

  const byDate = new Map<string, PlannedWorkout[]>()
  for (const p of planned) {
    if (!byDate.has(p.date)) byDate.set(p.date, [])
    byDate.get(p.date)!.push(p)
  }

  const closeAdd = () => {
    setAddingFor(null)
    setCustomName("")
    setCustomType("strength")
  }

  const addFromTemplate = (date: string, t: WorkoutTemplate) => {
    onSave({
      id: newId(),
      date,
      name: t.name,
      type: t.type,
      exerciseNames: t.exerciseNames,
      exerciseTargets: t.exerciseTargets,
    })
    closeAdd()
  }

  const addCustom = () => {
    if (!addingFor || !customName.trim()) return
    onSave({
      id: newId(),
      date: addingFor,
      name: customName.trim(),
      type: customType,
      exerciseNames: [],
    })
    closeAdd()
  }

  const moveDay = (p: PlannedWorkout, delta: number) => {
    onSave({ ...p, date: addDaysISO(p.date, delta) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart((d) => addDaysISO(d, -7))}
          aria-label="Previous week"
        >
          <ChevronLeft />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {formatDay(dates[0])} – {formatDay(dates[6])}
          </p>
          {weekStart !== startOfWeekISO() && (
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2"
              onClick={() => setWeekStart(startOfWeekISO())}
            >
              Back to this week
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart((d) => addDaysISO(d, 7))}
          aria-label="Next week"
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-7">
        {dates.map((date, i) => {
          const sessions = (byDate.get(date) ?? []).sort((a, b) =>
            a.name.localeCompare(b.name)
          )
          return (
            <div key={date} className="space-y-2">
              <div className="flex items-baseline justify-between px-0.5">
                <p
                  className={`text-xs font-semibold ${date === today ? "text-primary" : "text-muted-foreground"}`}
                >
                  {DAY_LABELS[i]} · {formatDay(date)}
                </p>
              </div>

              {sessions.map((p) => (
                <Card key={p.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {p.type}
                      </Badge>
                      {p.exerciseNames.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.exerciseNames.length}{" "}
                          {p.exerciseNames.length === 1
                            ? "exercise"
                            : "exercises"}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      onClick={() => onDelete(p.id)}
                      aria-label={`Remove ${p.name} from ${formatDay(date)}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveDay(p, -1)}
                      aria-label={`Move ${p.name} a day earlier`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => moveDay(p, 1)}
                      aria-label={`Move ${p.name} a day later`}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      className="ml-auto h-8"
                      onClick={() => onStart(p)}
                    >
                      <Play className="h-3.5 w-3.5" /> Start
                    </Button>
                  </div>
                </Card>
              ))}

              <Button
                variant="ghost"
                className="h-9 w-full justify-center border border-dashed text-xs text-muted-foreground"
                onClick={() => setAddingFor(date)}
              >
                <Plus className="h-3.5 w-3.5" /> Plan a session
              </Button>
            </div>
          )
        })}
      </div>

      <Dialog open={addingFor !== null} onOpenChange={(o) => !o && closeAdd()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Plan a session{addingFor ? ` for ${formatDay(addingFor)}` : ""}
            </DialogTitle>
            <DialogDescription>
              Pick a template or add a one-off session — you'll fill in sets
              when you actually train it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {templates.length > 0 && (
              <div className="grid gap-2">
                <Label>From a template</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <Button
                      key={t.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addingFor && addFromTemplate(addingFor, t)}
                    >
                      {t.name}
                      <span className="text-muted-foreground">
                        {t.exerciseNames.length}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2 border-t pt-4">
              <Label htmlFor="custom-session-name">
                {templates.length > 0 ? "Or a one-off session" : "Session name"}
              </Label>
              <Input
                id="custom-session-name"
                className="h-11"
                placeholder="e.g. StairMaster 30 min"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <SegmentedControl
                value={customType}
                onChange={setCustomType}
                options={WORKOUT_TYPES.map((t) => ({
                  value: t.value,
                  label: t.label,
                }))}
                className="grid-cols-5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAdd}>
              Cancel
            </Button>
            <Button onClick={addCustom} disabled={!customName.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
