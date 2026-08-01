import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, RotateCcw, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

const PRESETS = [60, 90, 120, 180]

function format(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60)
  const s = Math.abs(seconds) % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/** Short rising beep, built with the Web Audio API so there's no asset to load. */
function beep() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    setTimeout(() => void ctx.close(), 800)
  } catch {
    // Audio is a nicety — a blocked AudioContext shouldn't break the timer.
  }
}

export function RestTimer() {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState(90)
  const [remaining, setRemaining] = useState(90)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const releaseWakeLock = useCallback(() => {
    wakeLock.current?.release().catch(() => {})
    wakeLock.current = null
  }, [])

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator && !wakeLock.current) {
        wakeLock.current = await navigator.wakeLock.request("screen")
      }
    } catch {
      // Denied or unsupported — the timer still works, the screen may dim.
    }
  }, [])

  // Tick down once per second while running.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false)
          setDone(true)
          beep()
          navigator.vibrate?.([200, 100, 200])
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Hold the screen awake only while a timer is actually counting.
  useEffect(() => {
    if (running) void requestWakeLock()
    else releaseWakeLock()
    return releaseWakeLock
  }, [running, requestWakeLock, releaseWakeLock])

  // The browser drops the lock when the tab is hidden; take it back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && running) {
        void requestWakeLock()
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [running, requestWakeLock])

  const selectPreset = (seconds: number) => {
    setTarget(seconds)
    setRemaining(seconds)
    setRunning(false)
    setDone(false)
  }

  const reset = () => {
    setRemaining(target)
    setRunning(false)
    setDone(false)
  }

  const pct = target > 0 ? ((target - remaining) / target) * 100 : 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setRunning(false)
          releaseWakeLock()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Timer /> Rest timer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rest timer</DialogTitle>
          <DialogDescription>
            Your screen stays awake while the timer runs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="text-center">
            <p
              className={`text-6xl font-bold tabular-nums ${
                done ? "text-destructive" : ""
              }`}
            >
              {format(remaining)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {done
                ? "Time's up — back to it 💪"
                : running
                  ? "Resting…"
                  : `${format(target)} rest`}
            </p>
          </div>

          <Progress value={pct} />

          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((seconds) => (
              <Button
                key={seconds}
                variant={target === seconds ? "default" : "outline"}
                size="sm"
                onClick={() => selectPreset(seconds)}
              >
                {format(seconds)}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                if (done) reset()
                setRunning((r) => !r)
              }}
            >
              {running ? <Pause /> : <Play />}
              {running ? "Pause" : done ? "Restart" : "Start"}
            </Button>
            <Button variant="outline" size="icon" onClick={reset} aria-label="Reset timer">
              <RotateCcw />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
