import { useEffect } from "react"
import {
  BookOpen,
  ChartNoAxesCombined,
  Dumbbell,
  LayoutDashboard,
  Moon,
  Sun,
} from "lucide-react"

import { BackupDialog } from "@/components/BackupDialog"
import { Dashboard } from "@/components/Dashboard"
import { Diary } from "@/components/Diary"
import { Insights } from "@/components/Insights"
import { Workouts } from "@/components/Workouts"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocalStorage } from "@/lib/store"
import type { DiaryEntry, Workout, WorkoutTemplate } from "@/lib/types"

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
  const [dark, setDark] = useLocalStorage("dark-mode", false)

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
              data={{ workouts, entries, templates }}
              onRestore={(data) => {
                setWorkouts(data.workouts)
                setEntries(data.entries)
                setTemplates(data.templates)
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
          <TabsList className="grid w-full grid-cols-4 sm:inline-flex sm:w-auto">
            <TabsTrigger value="dashboard">
              <LayoutDashboard /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="workouts">
              <Dumbbell /> Workouts
            </TabsTrigger>
            <TabsTrigger value="diary">
              <BookOpen /> Diary
            </TabsTrigger>
            <TabsTrigger value="insights">
              <ChartNoAxesCombined /> Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <Dashboard workouts={workouts} entries={entries} />
          </TabsContent>

          <TabsContent value="workouts" className="mt-4">
            <Workouts
              workouts={workouts}
              templates={templates}
              onAdd={(w) => setWorkouts((prev) => [...prev, w])}
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
              onAdd={(e) => setEntries((prev) => [...prev, e])}
              onDelete={(id) =>
                setEntries((prev) => prev.filter((e) => e.id !== id))
              }
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
