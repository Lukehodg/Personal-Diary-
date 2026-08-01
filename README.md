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
- **Diary** — dated entries with a mood picker and free-form text.
- **Dark mode** — toggle in the header; your preference is remembered.
- **Private by design** — everything is stored in your browser's
  `localStorage`. No account, no server, no data leaves your machine.

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
│   ├── ui/          # shadcn/ui-style primitives (button, card, dialog, …)
│   ├── Dashboard.tsx
│   ├── Workouts.tsx
│   └── Diary.tsx
├── lib/
│   ├── types.ts     # Workout & diary entry types
│   ├── store.ts     # localStorage hook + date helpers
│   └── utils.ts     # cn() class helper
└── App.tsx          # Tab shell + dark mode
```
