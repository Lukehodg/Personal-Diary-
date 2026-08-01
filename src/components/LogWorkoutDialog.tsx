import { useEffect, useId, useState } from "react"
import { Bookmark, History, Plus, Search, Trash2, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ExercisePicker } from "@/components/ExercisePicker"
import { Badge } from "@/components/ui/badge"
import { isNewPR, lastSessionFor } from "@/lib/analytics"
import { classifyExercise, exerciseHistory } from "@/lib/exercises"
import { muscleLabel } from "@/lib/wger"
import { newId, todayISO } from "@/lib/store"
import {
  WORKOUT_TYPES,
  type Exercise,
  type Workout,
  type WorkoutTemplate,
  type WorkoutType,
} from "@/lib/types"

interface ExerciseDraft {
  id: string
  name: string
  sets: { reps: string; weight: string }[]
}

function emptyExercise(name = ""): ExerciseDraft {
  return { id: newId(), name, sets: [{ reps: "", weight: "" }] }
}

interface LogWorkoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workouts: Workout[]
  template: WorkoutTemplate | null
  onSave: (workout: Workout) => void
  onSaveTemplate: (template: WorkoutTemplate) => void
}

export function LogWorkoutDialog({
  open,
  onOpenChange,
  workouts,
  template,
  onSave,
  onSaveTemplate,
}: LogWorkoutDialogProps) {
  const datalistId = useId()
  const [name, setName] = useState("")
  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState<WorkoutType>("strength")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [exercises, setExercises] = useState<ExerciseDraft[]>([emptyExercise()])
  const [pickerFor, setPickerFor] = useState<string | null>(null)

  const knownExercises = exerciseHistory(workouts)

  const resetForm = () => {
    setName("")
    setDate(todayISO())
    setType("strength")
    setDuration("")
    setNotes("")
    setSaveAsTemplate(false)
    setExercises([emptyExercise()])
  }

  // Prefill from a template each time the dialog is opened with one.
  useEffect(() => {
    if (!open) return
    if (template) {
      setName(template.name)
      setType(template.type)
      setExercises(
        template.exerciseNames.length > 0
          ? template.exerciseNames.map((n) => emptyExercise(n))
          : [emptyExercise()]
      )
    } else {
      resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template])

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

  const buildExercises = (): Exercise[] =>
    exercises
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

  const handleSave = () => {
    if (!name.trim() || !date) return
    const cleanExercises = buildExercises()
    onSave({
      id: newId(),
      date,
      name: name.trim(),
      type,
      durationMin: Number(duration) || 0,
      exercises: cleanExercises,
      notes: notes.trim(),
      source: "manual",
    })
    if (saveAsTemplate) {
      onSaveTemplate({
        id: newId(),
        name: name.trim(),
        type,
        exerciseNames: cleanExercises.map((ex) => ex.name),
      })
    }
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {template ? `Log ${template.name}` : "Log a workout"}
          </DialogTitle>
          <DialogDescription>
            Record what you did, how long it took, and the details of each
            exercise.
          </DialogDescription>
        </DialogHeader>

        <datalist id={datalistId}>
          {knownExercises.map((ex) => (
            <option key={ex} value={ex} />
          ))}
        </datalist>

        <ExercisePicker
          open={pickerFor !== null}
          onOpenChange={(o) => !o && setPickerFor(null)}
          recent={knownExercises}
          onPick={(name) => {
            if (pickerFor) updateExercise(pickerFor, { name })
            setPickerFor(null)
          }}
        />

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
            {exercises.map((ex) => {
              const last = ex.name.trim()
                ? lastSessionFor(workouts, ex.name)
                : null
              const info = ex.name.trim() ? classifyExercise(ex.name) : null
              return (
                <div key={ex.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      list={datalistId}
                      placeholder="Exercise name, e.g. Bench press"
                      value={ex.name}
                      onChange={(e) =>
                        updateExercise(ex.id, { name: e.target.value })
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPickerFor(ex.id)}
                      aria-label="Browse exercise catalogue"
                    >
                      <Search />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setExercises((prev) => prev.filter((e) => e.id !== ex.id))
                      }
                      aria-label="Remove exercise"
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  {info?.known && info.primary.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {info.primary.map((m) => (
                        <Badge key={m} variant="secondary" className="text-[10px]">
                          {muscleLabel(m)}
                        </Badge>
                      ))}
                      {info.secondary.map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px]">
                          {muscleLabel(m)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {last && (
                    <div className="mt-2 rounded-md bg-muted/60 p-2 text-xs">
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <History className="h-3 w-3" />
                        Last time:{" "}
                        {last.sets
                          .map((s) =>
                            s.weight > 0
                              ? `${s.reps}×${s.weight}kg`
                              : `${s.reps} reps`
                          )
                          .join(", ")}
                      </p>
                      <p className="mt-1 font-medium">{last.suggestion}</p>
                    </div>
                  )}

                  <div className="mt-2 grid gap-2">
                    {ex.sets.map((set, i) => {
                      const parsed = {
                        reps: Number(set.reps) || 0,
                        weight: Number(set.weight) || 0,
                      }
                      const pr =
                        ex.name.trim() && parsed.reps > 0 && parsed.weight > 0
                          ? isNewPR(workouts, ex.name, parsed)
                          : false
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-12 shrink-0 text-xs text-muted-foreground">
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
                          <span className="w-16 shrink-0">
                            {pr && (
                              <span className="flex items-center gap-1 text-xs font-medium text-status-good">
                                <Trophy className="h-3 w-3" /> PR
                              </span>
                            )}
                          </span>
                        </div>
                      )
                    })}
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
              )
            })}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExercises((prev) => [...prev, emptyExercise()])}
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

          {!template && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
              />
              <Bookmark className="h-4 w-4 text-muted-foreground" />
              Also save this as a reusable template
            </label>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm()
              onOpenChange(false)
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
  )
}
