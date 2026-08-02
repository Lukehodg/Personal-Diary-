import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface StepperProps {
  value: string
  onChange: (value: string) => void
  step?: number
  min?: number
  placeholder?: string
  suffix?: string
  className?: string
  "aria-label"?: string
}

/**
 * Tap targets either side of a number field, for entering reps and weight
 * without fighting a phone's number keyboard for a small increment. Typing
 * directly still works — the buttons are a shortcut, not the only way in.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  placeholder,
  suffix,
  className,
  "aria-label": ariaLabel,
}: StepperProps) {
  const bump = (delta: number) => {
    const current = Number(value) || 0
    const next = Math.max(min, Math.round((current + delta) / step) * step)
    onChange(String(next))
  }

  return (
    <div
      className={cn(
        "flex h-11 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-sm",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-full w-11 shrink-0 rounded-none px-0 text-muted-foreground hover:text-foreground"
        onClick={() => bump(-step)}
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : "Decrease"}
      >
        <Minus />
      </Button>
      <div className="relative flex-1">
        <Input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={ariaLabel}
          className="h-full min-w-0 rounded-none border-none text-center shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && !value && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-full w-11 shrink-0 rounded-none px-0 text-muted-foreground hover:text-foreground"
        onClick={() => bump(step)}
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : "Increase"}
      >
        <Plus />
      </Button>
    </div>
  )
}
