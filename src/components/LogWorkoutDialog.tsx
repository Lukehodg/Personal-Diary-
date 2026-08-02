import { useEffect, useId, useState } from "react"
import {
  Bookmark,
  Dumbbell,
  HeartPulse,
  History,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Trophy,
  Volleyball,
  Wind,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Stepper } from "@/components/ui/stepper"
import { Textarea } from "@/components/ui/textarea"
import { ExercisePicker } from "@/components/ExercisePicker"
import { Badge } from "@/components/ui/badge"
import { isNewPR, lastSessionFor } from "@/lib/analytics"
import { classifyExercise, exerciseHistory } from "@/lib/exercises"
import { muscleLabel } from "@/lib/wger"
import { newId, todayISO } from "@/lib/store"
import {
  type Exercise,
  type Workout,
  type WorkoutTemplate,
  type WorkoutType,
} from "@/lib/types"

const TYPE_OPTIONS: {
  value: WorkoutType
  label: string
  icon: React.ReactNode
}[] = [
  { value: "strength", label: "Strength", icon: <Dumbbell className="h-4 w-4" /> },
  { value: "cardio", label: "Cardio", icon: <HeartPulse className="h-4 w-4" /> },
  { value: "flexibility", label: "Mobility", icon: <Wind className="h-4 w-4" /> },
  { value: "sports", label: "Sport", icon: <Volleyball className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <MoreHorizontal className="h-4 w-4" /> },
]

const DURATION_PRESETS = [30, 45, 60, 90]

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

  const removeSet = (exId: string, index: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== index) }
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

  const namedExercises = exercises.filter((ex) => ex.name.trim()).length
  const totalSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.reps !== "").length,
    0
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="min-w-0">
            <SheetTitle>
              {editing
                ? "Edit workout"
                : template
                  ? template.name
                  : "Log a workout"}
            </SheetTitle>
            <SheetDescription>
              {namedExercises > 0
                ? `${namedExercises} ${namedExercises === 1 ? "exercise" : "exercises"}${totalSets > 0 ? ` · ${totalSets} ${totalSets === 1 ? "set" : "sets"}` : ""}`
                : "Add what you did and how it went."}
            </SheetDescription>
          </div>
        </SheetHeader>

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

        <SheetBody className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="workout-name">Name</Label>
              <Input
                id="workout-name"
                className="h-11"
                placeholder="e.g. Push day, 5k run"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="workout-date">Date</Label>
              <Input
                id="workout-date"
                className="h-11"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <SegmentedControl
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS.map((t) => ({
                value: t.value,
                label: t.label,
                icon: t.icon,
              }))}
              className="grid-cols-5"
            />
          </div>

          <div className="grid gap-2">
            <Label>Duration</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={
                    duration === String(mins) ? "default" : "outline"
                  }
                  className="h-10 rounded-full px-4"
                  onClick={() =>
                    setDuration(duration === String(mins) ? "" : String(mins))
                  }
                >
                  {mins} min
                </Button>
              ))}
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Custom"
                aria-label="Custom duration in minutes"
                value={
                  DURATION_PRESETS.includes(Number(duration)) ? "" : duration
                }
                onChange={(e) => setDuration(e.target.value)}
                className="h-10 w-24 min-w-0 rounded-full text-center"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <Label>Exercises</Label>
            {exercises.map((ex, exIndex) => {
              const last = ex.name.trim()
                ? lastSessionFor(historyWorkouts, ex.name)
                : null
              const info = ex.name.trim() ? classifyExercise(ex.name) : null
              return (
                <div
                  key={ex.id}
                  className="rounded-xl border bg-card p-3 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-11 min-w-0 font-medium"
                      list={datalistId}
                      placeholder={`Exercise ${exIndex + 1}`}
                      value={ex.name}
                      onChange={(e) =>
                        updateExercise(ex.id, { name: e.target.value })
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0"
                      onClick={() => setPickerFor(ex.id)}
                      aria-label="Browse exercise catalogue"
                    >
                      <Search />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0 text-muted-foreground"
                      onClick={() =>
                        setExercises((prev) =>
                          prev.filter((e) => e.id !== ex.id)
                        )
                      }
                      aria-label={`Remove ${ex.name.trim() || `exercise ${exIndex + 1}`}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  {info?.known && info.primary.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {info.primary.map((m) => (
                        <Badge key={m} className="text-[10px]">
                          {muscleLabel(m)}
                        </Badge>
                      ))}
                      {info.secondary.map((m) => (
                        <Badge
                          key={m}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {muscleLabel(m)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {last && (
                    <div className="mt-3 flex gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                      <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-muted-foreground">
                          Last time:{" "}
                          <span className="tabular">
                            {last.sets
                              .map((s) =>
                                s.weight > 0
                                  ? `${s.reps}×${s.weight}kg`
                                  : `${s.reps} reps`
                              )
                              .join(", ")}
                          </span>
                        </p>
                        <p className="mt-0.5 font-semibold">{last.suggestion}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    {ex.sets.length > 0 && (
                      <div className="flex items-center gap-2 pl-9 pr-9 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <span className="flex-1 text-center">Reps</span>
                        <span className="flex-1 text-center">Weight (kg)</span>
                      </div>
                    )}
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
                          <span className="w-7 shrink-0 text-xs font-semibold text-muted-foreground tabular">
                            {i + 1}
                          </span>
                          <Stepper
                            value={set.reps}
                            onChange={(v) => updateSet(ex.id, i, "reps", v)}
                            aria-label={`set ${i + 1} reps`}
                          />
                          <Stepper
                            value={set.weight}
                            step={2.5}
                            onChange={(v) => updateSet(ex.id, i, "weight", v)}
                            aria-label={`set ${i + 1} weight`}
                          />
                          <span className="flex w-7 shrink-0 justify-center">
                            {pr ? (
                              <span
                                className="text-status-good"
                                title="New personal record"
                              >
                                <Trophy className="h-4 w-4" />
                                <span className="sr-only">
                                  New personal record
                                </span>
                              </span>
                            ) : ex.sets.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeSet(ex.id, i)}
                                className="text-muted-foreground/50 transition-colors hover:text-destructive"
                                aria-label={`Remove set ${i + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </span>
                        </div>
                      )
                    })}
                    <Button
                      variant="ghost"
                      className="h-10 w-full justify-center border border-dashed text-muted-foreground"
                      onClick={() =>
                        updateExercise(ex.id, {
                          sets: [
                            ...ex.sets,
                            // Carry the last set's numbers forward — you
                            // usually repeat them, and correcting is quicker
                            // than typing both again.
                            ex.sets.length > 0
                              ? { ...ex.sets[ex.sets.length - 1] }
                              : { reps: "", weight: "" },
                          ],
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
              variant="outline"
              className="h-11 w-full"
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
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-card p-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
              />
              <Bookmark className="h-4 w-4 text-muted-foreground" />
              Save as a reusable template
            </label>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            variant="outline"
            className="h-12 flex-1"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button
            className="h-12 flex-1"
            onClick={handleSave}
            disabled={!name.trim() || !date}
          >
            {editing ? "Save changes" : "Save workout"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
