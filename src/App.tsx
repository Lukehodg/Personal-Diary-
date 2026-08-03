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
import { EMPTY_HEALTHKIT_SYNC, type HealthKitSync } from "@/components/HealthScoreCard"
import { Insights } from "@/components/Insights"
import { Measurements } from "@/components/Measurements"
import { Workouts } from "@/components/Workouts"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/lib/store"
import {
  DEFAULT_MEASUREMENT_CATEGORIES,
  type DiaryEntry,
  type MeasurementCategory,
  type MeasurementEntry,
  type Workout,
  type WorkoutTemplate,
} from "@/lib/types"

const TABS = [
  { value: "dashboard", label: "Home", icon: LayoutDashboard },
  { value: "workouts", label: "Train", icon: Dumbbell },
  { value: "diary", label: "Diary", icon: BookOpen },
  { value: "body", label: "Body", icon: Ruler },
  { value: "insights", label: "Insights", icon: ChartNoAxesCombined },
]

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
  const [healthKit, setHealthKit] = useLocalStorage<HealthKitSync>(
    "healthkit-sync",
    EMPTY_HEALTHKIT_SYNC
  )
  // Dark is the app's intended look, so it's the default rather than an
  // opt-in. An existing preference still wins.
  const [dark, setDark] = useLocalStorage("dark-mode", true)

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
    // Keep the iOS status bar and browser chrome in step with the theme.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#12100e" : "#fdfcfb")
  }, [dark])

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="dashboard" className="gap-0">
        {/* Safe-area padding keeps the header clear of the status bar and the
            notch when running as an installed app rather than in a browser. */}
        <header className="sticky top-0 z-30 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Dumbbell className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight">
                  Workout Diary
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  Training and thoughts, in one place
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {/* Wide screens keep the tabs up here; phones get the bottom
                  bar below instead. */}
              <TabsList className="mr-1 hidden lg:inline-flex">
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    <t.icon />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
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

        <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8">
          <TabsContent value="dashboard">
            <Dashboard
              workouts={workouts}
              entries={entries}
              measurements={measurements}
              measurementCategories={measurementCategories}
              healthKit={healthKit}
              onSyncHealthKit={setHealthKit}
            />
          </TabsContent>

          <TabsContent value="workouts">
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

          <TabsContent value="diary">
            <Diary
              entries={entries}
              onSave={(e) => setEntries((prev) => upsert(prev, e))}
              onDelete={(id) =>
                setEntries((prev) => prev.filter((e) => e.id !== id))
              }
            />
          </TabsContent>

          <TabsContent value="body">
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

          <TabsContent value="insights">
            <Insights workouts={workouts} entries={entries} />
          </TabsContent>
        </main>

        {/* Bottom bar on phones: thumb-reachable, labels always visible, and
            the shape people expect from an installed app rather than a page. */}
        <TabsList
          className="fixed inset-x-0 bottom-0 z-30 grid h-auto grid-cols-5 gap-0 rounded-none border-t bg-background/90 p-0 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
        >
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className={cn(
                "flex-col gap-1 rounded-none px-1 py-2.5 text-[10px] font-semibold",
                "data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              )}
            >
              <t.icon className="!h-[22px] !w-[22px]" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
