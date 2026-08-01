# Workout Tracker & Diary

A personal workout tracker and diary app. Log your training sessions with
exercises, sets, reps, and weights; keep a daily diary with mood tracking; and
watch your progress on a dashboard with weekly goals and streaks.

Built with [React](https://react.dev), [Vite](https://vite.dev),
[Tailwind CSS](https://tailwindcss.com), and
[shadcn/ui](https://ui.shadcn.com)-style components on
[Radix UI](https://www.radix-ui.com) primitives.

## Features

- **Dashboard** — workouts this week, active minutes, current streak, diary
  entry count, a weekly goal progress bar, and a recent activity feed.
- **Workout tracker** — log workouts by type (strength, cardio, flexibility,
  sports, other) with duration, notes, and any number of exercises, each with
  sets, reps, and weight.
- **Diary** — dated entries with a mood picker and free-form text.
- **Dark mode** — toggle in the header; your preference is remembered.
- **Private by design** — everything is stored in your browser's
  `localStorage`. No account, no server, no data leaves your machine.

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
