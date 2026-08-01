import { useState } from "react"
import { BookOpen, Plus, Trash2 } from "lucide-react"

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
  onAdd: (entry: DiaryEntry) => void
  onDelete: (id: string) => void
}

export function Diary({ entries, onAdd, onDelete }: DiaryProps) {
  const [open, setOpen] = useState(false)
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

  const handleSave = () => {
    if (!content.trim() || !date) return
    onAdd({
      id: newId(),
      date,
      title: title.trim(),
      content: content.trim(),
      mood,
    })
    resetForm()
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> New entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>New diary entry</DialogTitle>
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
                Save entry
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
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>
                        {entry.title || "Diary entry"}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(entry.date)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {mood && (
                        <Badge variant="secondary">
                          {mood.emoji} {mood.label}
                        </Badge>
                      )}
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
