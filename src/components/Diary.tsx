import { useEffect, useState } from "react"
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDate, newId, todayISO } from "@/lib/store"
import { MOODS, type DiaryEntry, type Mood } from "@/lib/types"

interface DiaryProps {
  entries: DiaryEntry[]
  /** Upsert: replaces the entry with a matching id, otherwise appends. */
  onSave: (entry: DiaryEntry) => void
  onDelete: (id: string) => void
}

export function Diary({ entries, onSave, onDelete }: DiaryProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DiaryEntry | null>(null)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(todayISO())
  const [mood, setMood] = useState<Mood>("good")
  const [content, setContent] = useState("")

  const resetForm = () => {
    setTitle("")
    setDate(todayISO())
    setMood("good")
    setContent("")
  }

  // Prefill from the entry being edited each time the dialog opens.
  useEffect(() => {
    if (!open) return
    if (editing) {
      setTitle(editing.title)
      setDate(editing.date)
      setMood(editing.mood)
      setContent(editing.content)
    } else {
      resetForm()
    }
  }, [open, editing])

  const openBlank = () => {
    setEditing(null)
    setOpen(true)
  }

  const openForEdit = (entry: DiaryEntry) => {
    setEditing(entry)
    setOpen(true)
  }

  const handleSave = () => {
    if (!content.trim() || !date) return
    onSave({
      id: editing?.id ?? newId(),
      date,
      title: title.trim(),
      content: content.trim(),
      mood,
    })
    resetForm()
    setEditing(null)
    setOpen(false)
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Diary</h2>
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} in
            total
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (!o) setEditing(null)
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openBlank}>
              <Plus /> New entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit diary entry" : "New diary entry"}
              </DialogTitle>
              <DialogDescription>
                Capture how your day went — training, recovery, or anything
                else on your mind.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="entry-title">Title (optional)</Label>
                  <Input
                    id="entry-title"
                    placeholder="e.g. Rest day thoughts"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="entry-date">Date</Label>
                  <Input
                    id="entry-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Mood</Label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <Button
                      key={m.value}
                      type="button"
                      variant={mood === m.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMood(m.value)}
                    >
                      <span>{m.emoji}</span> {m.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry-content">Entry</Label>
                <Textarea
                  id="entry-content"
                  rows={6}
                  placeholder="Write about your day…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!content.trim() || !date}
              >
                {editing ? "Save changes" : "Save entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8" />
            <p className="text-sm">
              No diary entries yet. Hit “New entry” to write your first one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((entry) => {
            const mood = MOODS.find((m) => m.value === entry.mood)
            return (
              <Card key={entry.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        {entry.title || "Diary entry"}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(entry.date)}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {mood && (
                        <Badge variant="secondary">
                          {mood.emoji} {mood.label}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openForEdit(entry)}
                        aria-label={`Edit ${entry.title || "entry"}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(entry.id)}
                        aria-label="Delete entry"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {entry.content}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
