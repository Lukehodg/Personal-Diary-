import { useRef, useState } from "react"
import { Upload, Watch } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/store"
import { parseGarminFile, workoutKey } from "@/lib/garmin"
import type { Workout } from "@/lib/types"

interface ImportGarminDialogProps {
  workouts: Workout[]
  onImport: (workouts: Workout[]) => void
}

export function ImportGarminDialog({
  workouts,
  onImport,
}: ImportGarminDialogProps) {
  const [open, setOpen] = useState(false)
  const [parsed, setParsed] = useState<Workout[]>([])
  const [skipped, setSkipped] = useState(0)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setParsed([])
    setSkipped(0)
    setError("")
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError("")
    const existing = new Set(workouts.map(workoutKey))
    const fresh: Workout[] = []
    let dupes = 0
    for (const file of Array.from(files)) {
      const text = await file.text()
      const activities = parseGarminFile(file.name, text)
      if (activities.length === 0) {
        setError(
          `Couldn't find any activities in “${file.name}”. Make sure it's a Garmin Connect CSV or TCX export.`
        )
        continue
      }
      for (const activity of activities) {
        const key = workoutKey(activity)
        if (existing.has(key)) {
          dupes++
        } else {
          existing.add(key)
          fresh.push(activity)
        }
      }
    }
    setParsed(fresh)
    setSkipped(dupes)
  }

  const handleImport = () => {
    onImport(parsed)
    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Watch /> Import from Garmin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Garmin activities</DialogTitle>
          <DialogDescription>
            Bring in your workouts with distance, calories, and heart-rate
            stats from Garmin Connect.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              Open{" "}
              <a
                className="underline underline-offset-2"
                href="https://connect.garmin.com/modern/activities"
                target="_blank"
                rel="noreferrer"
              >
                Garmin Connect → Activities
              </a>{" "}
              and click <strong>Export CSV</strong> (top right) for all
              activities, or open a single activity and choose{" "}
              <strong>Export to TCX</strong>.
            </li>
            <li>Drop the file(s) below.</li>
          </ol>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground hover:bg-accent">
            <Upload className="h-6 w-6" />
            <span>Choose CSV or TCX file(s)</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tcx"
              multiple
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {(parsed.length > 0 || skipped > 0) && (
            <div className="space-y-2">
              <p className="text-sm">
                Found <strong>{parsed.length}</strong> new{" "}
                {parsed.length === 1 ? "activity" : "activities"}
                {skipped > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({skipped} already imported, skipped)
                  </span>
                )}
              </p>
              {parsed.length > 0 && (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {parsed.slice(0, 50).map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate">
                        {w.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatDate(w.date)}
                        </span>
                      </span>
                      <Badge variant="secondary" className="capitalize">
                        {w.type}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset()
              setOpen(false)
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={parsed.length === 0}>
            Import {parsed.length > 0 ? parsed.length : ""}{" "}
            {parsed.length === 1 ? "activity" : "activities"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
