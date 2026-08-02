import { useEffect } from "react"
import {
  BookOpen,
  ChartNoAxesCombined,
  Dumbbell,
  LayoutDashboard,
  Moon,
  Ruler,
  Sun,
} from "lucide-react"

import { BackupDialog } from "@/components/BackupDialog"
import { Dashboard } from "@/components/Dashboard"
import { Diary } from "@/components/Diary"
import { Insights } from "@/components/Insights"
import { Measurements } from "@/components/Measurements"
import { Workouts } from "@/components/Workouts"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocalStorage } from "@/lib/store"
import {
  DEFAULT_MEASUREMENT_CATEGORIES,
  type DiaryEntry,
  type MeasurementCategory,
  type MeasurementEntry,
  type Workout,
  type WorkoutTemplate,
} from "@/lib/types"

export default function App() {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>("workouts", [])
  const [entries, setEntries] = useLocalStorage<DiaryEntry[]>(
    "diary-entries",
    []
  )
  const [templates, setTemplates] = useLocalStorage<WorkoutTemplate[]>(
    "workout-templates",
    []
  )
  const [measurementCategories, setMeasurementCategories] = useLocalStorage<
    MeasurementCategory[]
  >("measurement-categories", DEFAULT_MEASUREMENT_CATEGORIES)
  const [measurements, setMeasurements] = useLocalStorage<MeasurementEntry[]>(
    "measurements",
    []
  )
  const [dark, setDark] = useLocalStorage("dark-mode", false)

  const backupData = {
    workouts,
    entries,
    templates,
    measurementCategories,
    measurements,
  }

  /** Replace the item sharing this id, or append it if it's new. */
  function upsert<T extends { id: string }>(list: T[], item: T): T[] {
    return list.some((existing) => existing.id === item.id)
      ? list.map((existing) => (existing.id === item.id ? item : existing))
      : [...list, item]
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                Workout Tracker & Diary
              </h1>
              <p className="text-xs text-muted-foreground">
                Your training and your thoughts, in one place
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <BackupDialog
              data={backupData}
              onRestore={(data) => {
                setWorkouts(data.workouts)
                setEntries(data.entries)
                setTemplates(data.templates)
                setMeasurementCategories(data.measurementCategories)
                setMeasurements(data.measurements)
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-5 sm:inline-flex sm:w-auto">
            <TabsTrigger value="dashboard">
              <LayoutDashboard />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="workouts">
              <Dumbbell />
              <span className="hidden sm:inline">Workouts</span>
            </TabsTrigger>
            <TabsTrigger value="diary">
              <BookOpen />
              <span className="hidden sm:inline">Diary</span>
            </TabsTrigger>
            <TabsTrigger value="body">
              <Ruler />
              <span className="hidden sm:inline">Body</span>
            </TabsTrigger>
            <TabsTrigger value="insights">
              <ChartNoAxesCombined />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <Dashboard workouts={workouts} entries={entries} />
          </TabsContent>

          <TabsContent value="workouts" className="mt-4">
            <Workouts
              workouts={workouts}
              templates={templates}
              onSave={(w) => setWorkouts((prev) => upsert(prev, w))}
              onImport={(imported) =>
                setWorkouts((prev) => [...prev, ...imported])
              }
              onDelete={(id) =>
                setWorkouts((prev) => prev.filter((w) => w.id !== id))
              }
              onSaveTemplate={(t) => setTemplates((prev) => [...prev, t])}
              onDeleteTemplate={(id) =>
                setTemplates((prev) => prev.filter((t) => t.id !== id))
              }
            />
          </TabsContent>

          <TabsContent value="diary" className="mt-4">
            <Diary
              entries={entries}
              onSave={(e) => setEntries((prev) => upsert(prev, e))}
              onDelete={(id) =>
                setEntries((prev) => prev.filter((e) => e.id !== id))
              }
            />
          </TabsContent>

          <TabsContent value="body" className="mt-4">
            <Measurements
              categories={measurementCategories}
              entries={measurements}
              onSaveEntry={(m) => setMeasurements((prev) => upsert(prev, m))}
              onDeleteEntry={(id) =>
                setMeasurements((prev) => prev.filter((m) => m.id !== id))
              }
              onSaveCategory={(c) =>
                setMeasurementCategories((prev) => upsert(prev, c))
              }
              onDeleteCategory={(id) => {
                setMeasurementCategories((prev) =>
                  prev.filter((c) => c.id !== id)
                )
                setMeasurements((prev) =>
                  prev.filter((m) => m.categoryId !== id)
                )
              }}
            />
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <Insights workouts={workouts} entries={entries} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
