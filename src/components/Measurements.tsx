import { useEffect, useState } from "react"
import { Plus, Ruler, Trash2, TrendingDown, TrendingUp } from "lucide-react"

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
import { formatDate, newId, todayISO } from "@/lib/store"
import type { MeasurementCategory, MeasurementEntry } from "@/lib/types"

interface MeasurementsProps {
  categories: MeasurementCategory[]
  entries: MeasurementEntry[]
  onAddEntry: (entry: MeasurementEntry) => void
  onDeleteEntry: (id: string) => void
  onAddCategory: (category: MeasurementCategory) => void
  onDeleteCategory: (id: string) => void
}

/** Line chart of one measurement over time. Single series, so no legend. */
function TrendChart({
  entries,
  unit,
}: {
  entries: MeasurementEntry[]
  unit: string
}) {
  if (entries.length < 2) return null
  const width = 600
  const height = 120
  const padY = 12

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const values = sorted.map((e) => e.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const firstTime = new Date(`${sorted[0].date}T00:00:00`).getTime()
  const lastTime = new Date(
    `${sorted[sorted.length - 1].date}T00:00:00`
  ).getTime()
  const timeSpan = lastTime - firstTime || 1

  const coords = sorted.map((entry) => {
    const t = new Date(`${entry.date}T00:00:00`).getTime()
    const x = ((t - firstTime) / timeSpan) * width
    const y = height - padY - ((entry.value - min) / span) * (height - padY * 2)
    return [x, y] as const
  })

  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ")
  const [lastX, lastY] = coords[coords.length - 1]
  const latest = sorted[sorted.length - 1]

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full min-w-[280px] text-foreground"
        role="img"
        aria-label={`Trend from ${min}${unit} to ${max}${unit}`}
      >
        <line
          x1="0"
          y1={height - padY}
          x2={width}
          y2={height - padY}
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastX} cy={lastY} r="4" fill="currentColor" />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {formatDate(sorted[0].date)} · {sorted[0].value}
          {unit}
        </span>
        <span>
          {formatDate(latest.date)} · {latest.value}
          {unit}
        </span>
      </div>
    </div>
  )
}

export function Measurements({
  categories,
  entries,
  onAddEntry,
  onDeleteEntry,
  onAddCategory,
  onDeleteCategory,
}: MeasurementsProps) {
  const [entryOpen, setEntryOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MeasurementCategory | null>(
    null
  )
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [date, setDate] = useState(todayISO())
  const [value, setValue] = useState("")
  const [notes, setNotes] = useState("")
  const [newName, setNewName] = useState("")
  const [newUnit, setNewUnit] = useState("")

  // The selected category can disappear underneath us when one is deleted, so
  // fall back to whatever still exists rather than holding a dead id.
  useEffect(() => {
    if (!categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? "")
    }
  }, [categories, categoryId])

  const parsedValue = Number(value)
  const valueIsValid =
    value.trim() !== "" && Number.isFinite(parsedValue) && parsedValue >= 0
  const categoryIsValid = categories.some((c) => c.id === categoryId)
  const canSaveEntry = categoryIsValid && Boolean(date) && valueIsValid

  const saveEntry = () => {
    if (!canSaveEntry) return
    onAddEntry({
      id: newId(),
      categoryId,
      date,
      value: parsedValue,
      notes: notes.trim(),
    })
    setValue("")
    setNotes("")
    setDate(todayISO())
    setEntryOpen(false)
  }

  const saveCategory = () => {
    if (!newName.trim() || !newUnit.trim()) return
    onAddCategory({
      id: newId(),
      name: newName.trim(),
      unit: newUnit.trim(),
    })
    setNewName("")
    setNewUnit("")
    setCategoryOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Body</h2>
          <p className="text-sm text-muted-foreground">
            {entries.length} measurements across {categories.length} categories
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Ruler /> New category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>New measurement category</DialogTitle>
                <DialogDescription>
                  Anything you want to track over time — bicep, resting heart
                  rate, sleep hours.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input
                    id="cat-name"
                    placeholder="e.g. Resting heart rate"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cat-unit">Unit</Label>
                  <Input
                    id="cat-unit"
                    placeholder="e.g. bpm"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCategoryOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveCategory}
                  disabled={!newName.trim() || !newUnit.trim()}
                >
                  Add category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
            <DialogTrigger asChild>
              <Button disabled={categories.length === 0}>
                <Plus /> Add measurement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add a measurement</DialogTitle>
                <DialogDescription>
                  Record where you are today so the trend has something to show.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick one" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="m-value">Value</Label>
                    <Input
                      id="m-value"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="82.5"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-date">Date</Label>
                    <Input
                      id="m-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="m-notes">Notes (optional)</Label>
                  <Input
                    id="m-notes"
                    placeholder="e.g. first thing, fasted"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEntryOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEntry} disabled={!canSaveEntry}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete “{pendingDelete?.name}”?</DialogTitle>
            <DialogDescription>
              {(() => {
                const count = pendingDelete
                  ? entries.filter((e) => e.categoryId === pendingDelete.id)
                      .length
                  : 0
                return count === 0
                  ? "This category has no readings. It can be recreated at any time."
                  : `This also deletes ${count} ${
                      count === 1 ? "reading" : "readings"
                    }, and can't be undone.`
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) onDeleteCategory(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Ruler className="h-8 w-8" />
            <p className="text-sm">
              No categories yet. Create one to start tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => {
            const forCategory = entries
              .filter((e) => e.categoryId === category.id)
              .sort((a, b) => b.date.localeCompare(a.date))
            const latest = forCategory[0]
            const previous = forCategory[1]
            const change = latest && previous ? latest.value - previous.value : 0
            const rounded = Math.round(change * 100) / 100

            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{category.name}</CardTitle>
                      <CardDescription>
                        {forCategory.length === 0
                          ? "No readings yet"
                          : `${forCategory.length} readings · measured in ${category.unit}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {latest && (
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {latest.value}
                            <span className="ml-1 text-sm font-normal text-muted-foreground">
                              {category.unit}
                            </span>
                          </p>
                          {previous && rounded !== 0 && (
                            <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                              {rounded > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {rounded > 0 ? "+" : ""}
                              {rounded} since {formatDate(previous.date)}
                            </p>
                          )}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(category)}
                        aria-label={`Delete ${category.name} category`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {forCategory.length > 0 && (
                  <CardContent className="space-y-3">
                    <TrendChart entries={forCategory} unit={category.unit} />
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        All {forCategory.length} readings
                      </summary>
                      <ul className="mt-2 divide-y rounded-lg border">
                        {forCategory.map((entry) => (
                          <li
                            key={entry.id}
                            className="flex items-center justify-between gap-2 px-3 py-2"
                          >
                            <span className="text-muted-foreground">
                              {formatDate(entry.date)}
                              {entry.notes && (
                                <span className="ml-2 text-xs">
                                  {entry.notes}
                                </span>
                              )}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="tabular-nums">
                                {entry.value} {category.unit}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onDeleteEntry(entry.id)}
                                aria-label="Delete reading"
                              >
                                <Trash2 />
                              </Button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
