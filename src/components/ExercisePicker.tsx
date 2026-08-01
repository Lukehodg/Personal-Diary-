import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { searchExercises } from "@/lib/exerciseCatalog"
import {
  CATEGORIES,
  EQUIPMENT,
  categoryName,
  equipmentName,
  muscleLabel,
  type CategoryId,
  type EquipmentId,
} from "@/lib/wger"

interface ExercisePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (name: string) => void
  /** Names already used, surfaced first as "recent". */
  recent: string[]
}

export function ExercisePicker({
  open,
  onOpenChange,
  onPick,
  recent,
}: ExercisePickerProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CategoryId | null>(null)
  const [equipment, setEquipment] = useState<EquipmentId | null>(null)

  const results = useMemo(
    () => searchExercises(query, { category, equipment }),
    [query, category, equipment]
  )

  const showRecent = !query && !category && !equipment && recent.length > 0

  const pick = (name: string) => {
    onPick(name)
    setQuery("")
    setCategory(null)
    setEquipment(null)
    onOpenChange(false)
  }

  const clearFilters = () => {
    setCategory(null)
    setEquipment(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose an exercise</DialogTitle>
          <DialogDescription>
            Search the catalogue, or just type your own name in the field.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="pl-9"
            placeholder="Search exercises…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={category === c.id ? "default" : "outline"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setCategory(category === c.id ? null : c.id)}
              >
                {c.name}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPMENT.map((e) => (
              <Button
                key={e.id}
                size="sm"
                variant={equipment === e.id ? "secondary" : "ghost"}
                className="h-7 px-2.5 text-xs text-muted-foreground"
                onClick={() => setEquipment(equipment === e.id ? null : e.id)}
              >
                {e.name}
              </Button>
            ))}
            {(category || equipment) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-xs"
                onClick={clearFilters}
              >
                <X /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {showRecent && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Recently used
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.slice(0, 12).map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => pick(name)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <p>Nothing in the catalogue matches that.</p>
              {query.trim() && (
                <Button
                  className="mt-3"
                  variant="outline"
                  size="sm"
                  onClick={() => pick(query.trim())}
                >
                  Use “{query.trim()}” anyway
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-1.5">
              {showRecent && (
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  All exercises
                </p>
              )}
              {results.map((exercise) => (
                <button
                  key={exercise.name}
                  type="button"
                  onClick={() => pick(exercise.name)}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {exercise.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {exercise.primary.map(muscleLabel).join(", ")}
                      {exercise.secondary.length > 0 && (
                        <span className="opacity-70">
                          {" · "}
                          {exercise.secondary.map(muscleLabel).join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {categoryName(exercise.category)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {equipmentName(exercise.equipment[0])}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
