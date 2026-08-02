import { useRef, useState } from "react"
import { Database, Download, Upload } from "lucide-react"

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
import {
  exportBackup,
  parseBackup,
  totalOf,
  type BackupData,
  type ImportCounts,
  type ImportResult,
} from "@/lib/backup"

interface BackupDialogProps {
  data: BackupData
  onRestore: (data: BackupData) => void
}

/**
 * Lists only the kinds actually being added, so the sentence can never
 * disagree with the item count on the button.
 */
function describeAdded(added: ImportCounts): string {
  const parts = [
    [added.workouts, "workout"],
    [added.entries, "diary entry", "diary entries"],
    [added.templates, "template"],
    [added.measurementCategories, "measurement category", "measurement categories"],
    [added.measurements, "measurement"],
  ] as const

  const phrases = parts
    .filter(([count]) => count > 0)
    .map(([count, singular, plural]) =>
      count === 1 ? `1 ${singular}` : `${count} ${plural ?? `${singular}s`}`
    )

  if (phrases.length <= 1) return phrases[0] ?? "nothing"
  return `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`
}

export function BackupDialog({ data, onRestore }: BackupDialogProps) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setResult(parseBackup(await file.text(), data))
  }

  const handleRestore = () => {
    if (result?.ok && result.data) onRestore(result.data)
    reset()
    setOpen(false)
  }

  const totalAdded = result?.ok ? totalOf(result.added) : 0
  const isEmpty =
    data.workouts.length === 0 &&
    data.entries.length === 0 &&
    data.templates.length === 0 &&
    data.measurementCategories.length === 0 &&
    data.measurements.length === 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Data and backup">
          <Database />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Data & backup</DialogTitle>
          <DialogDescription>
            Everything lives in this browser only. Clearing your browsing data
            would wipe it, so keep a backup.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Your data right now</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.workouts.length} workouts · {data.entries.length} diary
              entries · {data.templates.length} templates ·{" "}
              {data.measurements.length} measurements
            </p>
            <Button
              className="mt-3 w-full"
              onClick={() => exportBackup(data)}
              disabled={isEmpty}
            >
              <Download /> Download backup
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Restore from a backup</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Anything already in your log is left alone — only new items are
              added.
            </p>
            <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-accent">
              <Upload className="h-5 w-5" />
              <span>Choose a backup file</span>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files)}
              />
            </label>

            {result && !result.ok && (
              <p className="mt-3 text-sm text-destructive">{result.error}</p>
            )}
            {result?.ok && (
              <p className="mt-3 text-sm">
                {totalAdded === 0 ? (
                  <span className="text-muted-foreground">
                    Everything in that backup is already in your log.
                  </span>
                ) : (
                  <>Ready to add {describeAdded(result.added)}.</>
                )}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset()
              setOpen(false)
            }}
          >
            Close
          </Button>
          <Button onClick={handleRestore} disabled={totalAdded === 0}>
            Restore {totalAdded > 0 ? `${totalAdded} items` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
