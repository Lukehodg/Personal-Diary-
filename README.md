# Workout Tracker & Diary

A personal workout tracker and diary app. Log your training sessions with
exercises, sets, reps, and weights; keep a daily diary with mood tracking; and
watch your progress on a dashboard with weekly goals and streaks.

Built with [React](https://react.dev), [Vite](https://vite.dev),
[Tailwind CSS](https://tailwindcss.com), and
[shadcn/ui](https://ui.shadcn.com)-style components on
[Radix UI](https://www.radix-ui.com) primitives.

## Features

- **Dashboard** — workouts this week, active minutes, current streak, calories
  burned, a weekly goal progress bar with a training-type breakdown, and a
  recent activity feed.
- **Workout tracker** — log workouts by type (strength, cardio, flexibility,
  sports, other) with duration, notes, and any number of exercises, each with
  sets, reps, and weight.
- **Garmin import** — pull in activities from Garmin Connect with distance,
  calories, and heart-rate data. See [Garmin import](#garmin-import) below.
- **Calendar integration** — export all workouts as an `.ics` file for
  Google/Apple/Outlook Calendar, or add a single workout to Google Calendar
  with one click. See [Calendar integration](#calendar-integration) below.
- **Insights** — personal records, training load, mood correlation, muscle
  balance and a consistency heatmap, all derived from your own log. See
  [Insights](#insights) below.
- **Smart logging** — templates, exercise autocomplete, last-session recall,
  progressive-overload suggestions and live PR detection while you type. See
  [Logging a workout](#logging-a-workout) below.
- **Rest timer** — presets with a screen wake lock so your phone doesn't sleep
  mid-session, plus a buzz and a beep when rest is up.
- **Diary** — dated entries with a mood picker and free-form text.
- **Installable and offline** — a PWA, so you can add it to your home screen
  and it works with no signal.
- **Backup** — one-click JSON export and restore, because browser storage is
  not a safe place to keep months of training history.
- **Dark mode** — toggle in the header; your preference is remembered.
- **Private by design** — everything is stored in your browser's
  `localStorage`. No account, no server, no data leaves your machine.

## Insights

Every figure on the Insights tab is computed locally from what you've logged.

**Personal records** track the best estimated one-rep max per lift using the
Epley formula (`weight × (1 + reps ÷ 30)`), which holds up well to about 10
reps. Each record shows the set that produced it, the percentage gain since
your first session, and a sparkline of the trend. Exercise names are
normalised, so "Bench press" and "bench press" count as the same lift.

**Training load** is the acute:chronic workload ratio used in sports science —
the last 7 days of load against your rolling 4-week average. Load is duration
scaled by intensity, taken from heart rate where Garmin supplied it and from
the workout type otherwise. Roughly speaking: below 0.8 you're detraining,
0.8–1.3 is the sweet spot, and above 1.5 is the ramp rate associated with
higher injury risk.

**Mood and training** compares your average diary mood on days you trained
against days you didn't, once there are at least three entries on each side.

**Muscle balance** maps exercise names onto muscle groups by keyword and counts
sets over the last 30 days, flagging lopsided push/pull volume.

**Words on rough days** surfaces words that appear disproportionately in your
low-mood entries. It's a crude frequency count, not a diagnosis — but it's good
at catching a recurring niggle you hadn't consciously noticed.

## Logging a workout

The log dialog gets more useful the more history it has:

- **Templates** — tick "save as a template" when logging, and that workout's
  exercise list becomes a one-click starting point next time.
- **Autocomplete** — the exercise field suggests names you've used before, which
  keeps your history consistent enough for PR tracking to work.
- **Last session recall** — type a known exercise and it shows what you did last
  time, with a suggested next step based on double progression: work every set
  up to 8 reps, then add the smallest jump (2.5 kg) and start again.
- **Live PR detection** — a set that would beat your best estimated 1RM for that
  lift is flagged as you type it.

## Backup

Everything lives in this browser's `localStorage`, which means clearing your
browsing data would wipe it and nothing syncs between your laptop and your
phone. Use the database icon in the header to download a JSON backup, and keep
it somewhere safe.

Restoring merges by id, so importing the same backup twice never duplicates
anything, and importing an older backup won't clobber newer entries. Files that
aren't backups from this app are rejected rather than half-applied.

## Install it on your phone

The app is a PWA. Open it in a mobile browser and choose "Add to Home Screen"
(Safari) or "Install app" (Chrome). It then launches full-screen and works
entirely offline — useful in gyms with no signal, since all your data is local
anyway.

## Garmin import

Garmin's live Health API is only licensed to approved companies, so this app
reads the export files Garmin Connect gives you instead. Nothing is uploaded —
the files are parsed in your browser.

**All activities at once:** open
[Garmin Connect → Activities](https://connect.garmin.com/modern/activities),
click **Export CSV** in the top right, then drop the file into
**Workouts → Import from Garmin**.

**A single activity:** open the activity in Garmin Connect, use the gear menu
→ **Export to TCX**, and drop that file in the same place.

Imports bring across the activity title, date and start time, duration,
distance, calories, and average/max heart rate. Garmin activity types are
mapped onto the app's categories automatically (a Lap Swimming activity
becomes cardio, Yoga becomes flexibility, and so on). Re-importing the same
file is safe: activities already in your log are detected and skipped, and
imported workouts are marked with a watch icon.

## Calendar integration

**Export everything:** the **Export to calendar** button (Workouts tab, or
**Calendar** on the dashboard) downloads a standard `.ics` file containing
every workout. Import it into Google Calendar (Settings → Import & export),
Apple Calendar (File → Import), or Outlook.

Workouts imported from Garmin have a real start time, so they land as timed
events of the right length; manually logged workouts become all-day events.
Each event's description carries the full detail — distance, calories, heart
rate, and your exercise sets.

**A single workout:** click the calendar icon on any workout card to open a
prefilled Google Calendar event.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Scripts

| Command           | What it does                     |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start the dev server             |
| `npm run build`   | Type-check and build for prod    |
| `npm run preview` | Serve the production build       |
| `npm run lint`    | Lint with oxlint                 |

## Project structure

```
src/
├── components/
│   ├── ui/                     # shadcn/ui-style primitives
│   ├── Dashboard.tsx
│   ├── Workouts.tsx            # Workout list, templates, calendar links
│   ├── LogWorkoutDialog.tsx    # Logging form with PR + overload hints
│   ├── ImportGarminDialog.tsx
│   ├── Diary.tsx
│   ├── Insights.tsx            # PRs, load, mood, balance, keywords
│   ├── Heatmap.tsx
│   ├── RestTimer.tsx
│   └── BackupDialog.tsx
├── lib/
│   ├── types.ts       # Workout, diary entry & template types
│   ├── store.ts       # localStorage hook + date helpers
│   ├── analytics.ts   # e1RM, PRs, ACWR, mood, keywords, heatmap
│   ├── exercises.ts   # Name normalisation + muscle group mapping
│   ├── garmin.ts      # Garmin CSV/TCX parsers
│   ├── calendar.ts    # ICS generation + Google Calendar links
│   ├── backup.ts      # JSON export/import with validation
│   └── utils.ts       # cn() class helper
└── App.tsx            # Tab shell, dark mode, state
```
