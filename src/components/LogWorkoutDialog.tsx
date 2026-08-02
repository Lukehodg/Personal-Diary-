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

/** Turn a saved workout back into editable form state. */
function toDrafts(workout: Workout): ExerciseDraft[] {
  if (workout.exercises.length === 0) return [emptyExercise()]
  return workout.exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    sets:
      ex.sets.length > 0
        ? ex.sets.map((s) => ({
            reps: String(s.reps),
            // Bodyweight sets are stored as 0; show them blank so the field
            // reads the same as when it was first entered.
            weight: s.weight > 0 ? String(s.weight) : "",
          }))
        : [{ reps: "", weight: "" }],
  }))
}

interface LogWorkoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workouts: Workout[]
  template: WorkoutTemplate | null
  /** Set to edit an existing workout in place; null logs a new one. */
  editing: Workout | null
  onSave: (workout: Workout) => void
  onSaveTemplate: (template: WorkoutTemplate) => void
}

export function LogWorkoutDialog({
  open,
  onOpenChange,
  workouts,
  template,
  editing,
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

  // History for PR checks and last-session recall must leave out the workout
  // being edited — otherwise it compares against itself, so no set ever reads
  // as a record and "last time" shows the very session you're changing.
  const historyWorkouts = editing
    ? workouts.filter((w) => w.id !== editing.id)
    : workouts
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

  // Prefill whenever the dialog opens, from the workout being edited or from
  // a template.
  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name)
      setDate(editing.date)
      setType(editing.type)
      setDuration(editing.durationMin > 0 ? String(editing.durationMin) : "")
      setNotes(editing.notes)
      setSaveAsTemplate(false)
      setExercises(toDrafts(editing))
    } else if (template) {
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
  }, [open, template, editing])

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

    // Editing keeps the original id so backups still merge cleanly, and keeps
    // Garmin's heart-rate and distance data — you should be able to fix a
    // title without losing what the watch recorded. The start time is dropped
    // if the date moved, since it encodes the old one.
    const dateChanged = editing ? editing.date !== date : false
    onSave({
      ...editing,
      id: editing?.id ?? newId(),
      date,
      name: name.trim(),
      type,
      durationMin: Number(duration) || 0,
      exercises: cleanExercises,
      notes: notes.trim(),
      source: editing?.source ?? "manual",
      startTime: dateChanged ? undefined : editing?.startTime,
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
            {editing
              ? "Edit workout"
              : template
                ? `Log ${template.name}`
                : "Log a workout"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Change anything that isn't right. Records and volume update to match."
              : "Record what you did, how long it took, and the details of each exercise."}
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
                ? lastSessionFor(historyWorkouts, ex.name)
                : null
              const info = ex.name.trim() ? classifyExercise(ex.name) : null
              return (
                <div key={ex.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      className="min-w-0"
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
                          ? isNewPR(historyWorkouts, ex.name, parsed)
                          : false
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-12 shrink-0 text-xs text-muted-foreground">
                            Set {i + 1}
                          </span>
                          {/* min-w-0 lets these shrink below an input's
                              intrinsic width — without it the row can't fit a
                              phone and pushes the page sideways. */}
                          <Input
                            className="min-w-0"
                            type="number"
                            min="0"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(ex.id, i, "reps", e.target.value)
                            }
                          />
                          <Input
                            className="min-w-0"
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="Weight (kg)"
                            value={set.weight}
                            onChange={(e) =>
                              updateSet(ex.id, i, "weight", e.target.value)
                            }
                          />
                          <span className="w-8 shrink-0">
                            {pr && (
                              <span
                                className="flex items-center gap-1 text-xs font-medium text-status-good"
                                title="New personal record"
                              >
                                <Trophy className="h-3 w-3" />
                                <span className="sr-only">
                                  New personal record
                                </span>
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

          {!template && !editing && (
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
            {editing ? "Save changes" : "Save workout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
