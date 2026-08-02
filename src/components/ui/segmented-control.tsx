import { cn } from "@/lib/utils"

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon?: React.ReactNode }[]
  className?: string
}

/**
 * A row of mutually-exclusive choices you can see and tap in one glance —
 * for a handful of options this reads faster than opening a dropdown.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              // Stacks icon over label so five options still fit a phone
              // without the icons collapsing; goes inline once there's room.
              "flex min-h-11 flex-col items-center justify-center gap-1 whitespace-nowrap rounded-md px-1 py-1.5",
              "text-[11px] font-semibold leading-none transition-colors",
              "sm:flex-row sm:gap-1.5 sm:text-sm sm:font-medium",
              "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
