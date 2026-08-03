import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Non-modal: Radix's modal mode locks body scroll by setting it to
 * position: fixed with a saved scroll offset, then restoring it on close.
 * On iOS WKWebView that restore can land wrong if the keyboard opened while
 * the sheet was up (the scroll/viewport metrics it depends on have shifted
 * underneath it) — every screen ends up stuck offset until the app is
 * force-quit. The overlay already blocks interaction with the background,
 * so nothing but that lock/focus-trap is lost by turning modal off.
 */
function Sheet(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root modal={false} {...props} />
}
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]", className)}
      {...props}
    />
  )
}

/**
 * Rises from the bottom of the screen on a phone — thumb-reachable, and the
 * shape people expect from a native app — then becomes a centred dialog once
 * there's room for one.
 */
function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col rounded-t-2xl border-t bg-background shadow-2xl",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88vh] sm:w-full sm:max-w-xl",
          "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border",
          className
        )}
        {...props}
      >
        {/* Grab handle reads as "this drags", matching the platform idiom. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border sm:hidden"
        />
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4",
        className
      )}
      {...props}
    />
  )
}

/** Scrolls; the header and footer stay put. */
function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)} {...props} />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex shrink-0 gap-3 border-t bg-background px-5 py-4",
        "pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-0.5 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function SheetCloseButton() {
  return (
    <DialogPrimitive.Close className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetCloseButton,
}
