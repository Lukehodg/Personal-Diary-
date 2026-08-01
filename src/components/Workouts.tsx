import { useState } from "react"
import {
  CalendarArrowDown,
  CalendarPlus,
  Dumbbell,
  Flame,
  Heart,
  Play,
  Plus,
  Route,
  Trash2,
  Watch,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ImportGarminDialog } from "@/components/ImportGarminDialog"
import { LogWorkoutDialog } from "@/components/LogWorkoutDialog"
import { RestTimer } from "@/components/RestTimer"
import { downloadICS, googleCalendarUrl } from "@/lib/calendar"
import { formatDate } from "@/lib/store"
import type { Workout, WorkoutTemplate } from "@/lib/types"

interface WorkoutsProps {
  workouts: Workout[]
  templates: WorkoutTemplate[]
  onAdd: (workout: Workout) => void
  onImport: (workouts: Workout[]) => void
  onDelete: (id: string) => void
  onSaveTemplate: (template: WorkoutTemplate) => void
  onDeleteTemplate: (id: string) => void
}

function hasStats(w: Workout): boolean {
  const s = w.stats
  return Boolean(
    s &&
      (s.distanceKm !== undefined ||
        s.calories !== undefined ||
        s.avgHr !== undefined)
  )
}

export function Workouts({
  workouts,
  templates,
  onAdd,
  onImport,
  onDelete,
  onSaveTemplate,
  onDeleteTemplate,
}: WorkoutsProps) {
  const [open, setOpen] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(
    null
  )

  const openBlank = () => {
    setActiveTemplate(null)
    setOpen(true)
  }

  const openFromTemplate = (template: WorkoutTemplate) => {
    setActiveTemplate(template)
    setOpen(true)
  }

  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Workouts</h2>
          <p className="text-sm text-muted-foreground">
            {workouts.length} logged in total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RestTimer />
          <Button
            variant="outline"
            onClick={() => downloadICS(workouts)}
            disabled={workouts.length === 0}
          >
            <CalendarArrowDown /> Export to calendar
          </Button>
          <ImportGarminDialog workouts={workouts} onImport={onImport} />
          <Button onClick={openBlank}>
            <Plus /> Log workout
          </Button>
        </div>
      </div>

      <LogWorkoutDialog
        open={open}
        onOpenChange={setOpen}
        workouts={workouts}
        template={activeTemplate}
        onSave={onAdd}
        onSaveTemplate={onSaveTemplate}
      />

      {templates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Start from a template</CardTitle>
            <CardDescription>
              Prefills the exercises so you only fill in the numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center rounded-md border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => openFromTemplate(t)}
                  >
                    <Play /> {t.name}
                    <span className="text-muted-foreground">
                      {t.exerciseNames.length} exercises
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() => onDeleteTemplate(t.id)}
                    aria-label={`Delete ${t.name} template`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Dumbbell className="h-8 w-8" />
            <p className="text-sm">
              No workouts yet. Hit “Log workout” to record your first session.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((w) => (
            <Card key={w.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {w.name}
                      {w.source === "garmin" && (
                        <Watch
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="Imported from Garmin"
                        />
                      )}
                    </CardTitle>
                    <CardDescription>{formatDate(w.date)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {w.type}
                    </Badge>
                    {w.durationMin > 0 && (
                      <Badge variant="outline">{w.durationMin} min</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      aria-label={`Add ${w.name} to Google Calendar`}
                    >
                      <a
                        href={googleCalendarUrl(w)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <CalendarPlus />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(w.id)}
                      aria-label={`Delete ${w.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(w.exercises.length > 0 || w.notes || hasStats(w)) && (
                <CardContent className="space-y-3">
                  {hasStats(w) && (
                    <div className="flex flex-wrap gap-4 text-sm">
                      {w.stats?.distanceKm !== undefined && (
                        <span className="flex items-center gap-1.5">
                          <Route className="h-4 w-4 text-muted-foreground" />
                          {w.stats.distanceKm} km
                        </span>
                      )}
                      {w.stats?.calories !== undefined && (
                        <span className="flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-muted-foreground" />
                          {w.stats.calories} kcal
                        </span>
                      )}
                      {w.stats?.avgHr !== undefined && (
                        <span className="flex items-center gap-1.5">
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          {w.stats.avgHr} bpm avg
                          {w.stats.maxHr !== undefined &&
                            ` · ${w.stats.maxHr} max`}
                        </span>
                      )}
                    </div>
                  )}
                  {w.exercises.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {w.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="rounded-lg border bg-muted/40 p-3"
                        >
                          <p className="text-sm font-medium">{ex.name}</p>
                          {ex.sets.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ex.sets
                                .map((s) =>
                                  s.weight > 0
                                    ? `${s.reps} × ${s.weight} kg`
                                    : `${s.reps} reps`
                                )
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {w.notes && (
                    <p className="text-sm text-muted-foreground">{w.notes}</p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
