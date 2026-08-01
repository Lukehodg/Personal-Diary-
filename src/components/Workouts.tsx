import { useState } from "react"
import { Dumbbell, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, newId, todayISO } from "@/lib/store"
import {
  WORKOUT_TYPES,
  type Exercise,
  type Workout,
  type WorkoutType,
} from "@/lib/types"

interface WorkoutsProps {
  workouts: Workout[]
  onAdd: (workout: Workout) => void
  onDelete: (id: string) => void
}

interface ExerciseDraft {
  id: string
  name: string
  sets: { reps: string; weight: string }[]
}

function emptyExercise(): ExerciseDraft {
  return { id: newId(), name: "", sets: [{ reps: "", weight: "" }] }
}

export function Workouts({ workouts, onAdd, onDelete }: WorkoutsProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState<WorkoutType>("strength")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [exercises, setExercises] = useState<ExerciseDraft[]>([
    emptyExercise(),
  ])

  const resetForm = () => {
    setName("")
    setDate(todayISO())
    setType("strength")
    setDuration("")
    setNotes("")
    setExercises([emptyExercise()])
  }

  const updateExercise = (id: string, patch: Partial<ExerciseDraft>) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex))
    )
  }

  const updateSet = (
    exId: string,
    index: number,
    field: "reps" | "weight",
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === index ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    )
  }

  const handleSave = () => {
    if (!name.trim() || !date) return
    const cleanExercises: Exercise[] = exercises
      .filter((ex) => ex.name.trim())
      .map((ex) => ({
        id: ex.id,
        name: ex.name.trim(),
        sets: ex.sets
          .filter((s) => s.reps !== "" || s.weight !== "")
          .map((s) => ({
            reps: Number(s.reps) || 0,
            weight: Number(s.weight) || 0,
          })),
      }))
    onAdd({
      id: newId(),
      date,
      name: name.trim(),
      type,
      durationMin: Number(duration) || 0,
      exercises: cleanExercises,
      notes: notes.trim(),
    })
    resetForm()
    setOpen(false)
  }

  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Workouts</h2>
          <p className="text-sm text-muted-foreground">
            {workouts.length} logged in total
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> Log workout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Log a workout</DialogTitle>
              <DialogDescription>
                Record what you did, how long it took, and the details of each
                exercise.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="workout-name">Name</Label>
                  <Input
                    id="workout-name"
                    placeholder="e.g. Push day, 5k run"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workout-date">Date</Label>
                  <Input
                    id="workout-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as WorkoutType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKOUT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workout-duration">Duration (min)</Label>
                  <Input
                    id="workout-duration"
                    type="number"
                    min="0"
                    placeholder="45"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Exercises</Label>
                {exercises.map((ex) => (
                  <div key={ex.id} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Exercise name, e.g. Bench press"
                        value={ex.name}
                        onChange={(e) =>
                          updateExercise(ex.id, { name: e.target.value })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExercises((prev) =>
                            prev.filter((e) => e.id !== ex.id)
                          )
                        }
                        aria-label="Remove exercise"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <div className="mt-2 grid gap-2">
                      {ex.sets.map((set, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-12 text-xs text-muted-foreground">
                            Set {i + 1}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(ex.id, i, "reps", e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Weight (kg)"
                            value={set.weight}
                            onChange={(e) =>
                              updateSet(ex.id, i, "weight", e.target.value)
                            }
                          />
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateExercise(ex.id, {
                            sets: [...ex.sets, { reps: "", weight: "" }],
                          })
                        }
                      >
                        <Plus /> Add set
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setExercises((prev) => [...prev, emptyExercise()])
                  }
                >
                  <Plus /> Add exercise
                </Button>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="workout-notes">Notes</Label>
                <Textarea
                  id="workout-notes"
                  placeholder="How did it feel?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!name.trim() || !date}>
                Save workout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                    <CardTitle>{w.name}</CardTitle>
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
                      onClick={() => onDelete(w.id)}
                      aria-label={`Delete ${w.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(w.exercises.length > 0 || w.notes) && (
                <CardContent className="space-y-3">
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
