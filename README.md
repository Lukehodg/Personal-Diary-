# Workout Tracker & Diary

A personal workout tracker and diary app. Log your training sessions with
exercises, sets, reps, and weights; keep a daily diary with mood tracking; and
watch your progress on a dashboard with weekly goals and streaks.

Built with [React](https://react.dev), [Vite](https://vite.dev),
[Tailwind CSS](https://tailwindcss.com), and
[shadcn/ui](https://ui.shadcn.com)-style components on
[Radix UI](https://www.radix-ui.com) primitives. Exercise classification
follows the taxonomy used by the
[wger project](https://github.com/wger-project/wger) — see
[Credits](#credits).

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
- **Exercise catalogue** — ~90 common exercises classified by muscle, category
  and equipment, with a searchable picker and alias matching so "ohp" and
  "Overhead press" are the same lift. See [Exercise catalogue](#exercise-catalogue).
- **Body tracking** — body weight, body fat, waist and any measurement category
  you invent, with trends over time.
- **Insights** — personal records, training load, mood correlation, muscle
  balance and a consistency heatmap, all derived from your own log. See
  [Insights](#insights) below.
- **Smart logging** — templates, exercise autocomplete, last-session recall,
  progressive-overload suggestions and live PR detection while you type. See
  [Logging a workout](#logging-a-workout) below.
- **Editing** — every workout, diary entry, measurement and category can be
  corrected in place. See [Editing](#editing) below.
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

## Exercise catalogue

Exercises are classified against the taxonomy the
[wger project](https://github.com/wger-project/wger) uses — its 16 anatomical
muscles, 8 categories (Arms, Legs, Abs, Chest, Back, Shoulders, Calves, Cardio)
and 12 equipment types, with the same numeric identifiers. Using wger's schema
rather than an invented one means the data would line up with a wger instance
if you ever moved to one.

Around 90 common exercises are mapped onto it in `src/lib/exerciseCatalog.ts`,
each with primary muscles, assisting muscles and the kit it needs. The magnifier
next to any exercise field opens a picker you can search and filter by category
or equipment.

Names are matched leniently, so `ohp`, `Overhead press` and `military press` all
resolve to the same lift and share one PR record — while specific names stay
specific, and `close grip bench press` is correctly triceps work rather than
chest. Names outside the catalogue still work; they fall back to keyword
matching, and anything that can't be classified at all is reported rather than
silently miscounted.

## Body tracking

The Body tab follows wger's measurements model: a category is just a name and a
unit, and an entry is a date and a value. Body weight, body fat and waist are
there by default; add your own for anything else — resting heart rate, sleep
hours, bicep. Each category shows its latest reading, the change since the
previous one, and a trend line.

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

**Muscle balance** counts sets per muscle over the last 30 days using the
catalogue, weighting direct work fully and assisting muscles at half — the usual
convention for volume tracking. It flags lopsided pressing versus pulling
volume.

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

## Editing

The pencil icon on any workout, diary entry, measurement or measurement
category reopens it with everything prefilled. Saving replaces the record
rather than adding a second one, so a mistyped weight can be corrected without
losing the session — records, muscle volume and training load all recompute
from the corrected value.

A few details that matter:

- **Records keep their id**, so a backup taken before an edit still merges
  cleanly with one taken after.
- **While you're editing, that workout is left out of its own history.** The
  "last time" hint shows the previous session rather than the one you're
  changing, and PR detection compares against everything else rather than
  against itself.
- **Editing a Garmin import keeps its data.** Fixing a title or duration
  leaves distance, calories and heart rate intact and the activity still
  marked as imported. Moving it to a different date drops only its recorded
  start time, since that encoded the old date.
- **Renaming a measurement category keeps its readings**, because the category
  keeps its id.

## Backup

Everything lives in this browser's `localStorage`, which means clearing your
browsing data would wipe it and nothing syncs between your laptop and your
phone. Use the database icon in the header to download a JSON backup, and keep
it somewhere safe.

Restoring merges by id, so importing the same backup twice never duplicates
anything, and importing an older backup won't clobber newer entries. Files that
aren't backups from this app are rejected rather than half-applied.

## Install it on your phone

There are two ways, and they store data separately — pick one and stick to it,
or you'll end up with two split histories.

### As a web app (no Mac needed)

The app is a PWA. Open the deployed URL in a mobile browser and choose "Add to
Home Screen" (Safari — it must be Safari on iOS) or "Install app" (Chrome). It
then launches full-screen and works entirely offline.

Installing needs the app served over HTTPS, so deploy it first.

### As a native iOS app

[Capacitor](https://capacitorjs.com) wraps the same build in a real iOS app.
Worth it for two reasons: the data lives in the app's own container rather
than in Safari's storage, which iOS is far more willing to reclaim; and it's
the only route to HealthKit, since Apple Health has no web API.

Building an iOS app requires macOS — Xcode is Mac-only. There are two routes.

#### With a Mac

Capacitor 8 uses Swift Package Manager, so there's no CocoaPods step.

```bash
npm run ios       # build, copy into the iOS project, open Xcode
npm run ios:sync  # same without opening Xcode
```

In Xcode: select your device, set your signing team under
**Signing & Capabilities**, and hit Run. With a paid developer account the
install lasts a year; a free Apple ID expires after seven days.

#### Without a Mac — GitHub Actions to TestFlight

`.github/workflows/ios-testflight.yml` builds and signs on a macOS runner and
uploads to TestFlight, so you install from the TestFlight app on your phone.
Run it by hand from the **Actions** tab (it isn't on push, because macOS
runners bill at 10× minutes).

**One-time setup.** All of it is doable from a Windows machine.

1. **Create the app record.** In
   [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **+** →
   **New App**. Platform iOS, bundle ID `com.lukehodg.workoutdiary` (register
   it first under **Certificates, Identifiers & Profiles → Identifiers** if it
   isn't in the dropdown), and any SKU.

2. **Create an API key.** App Store Connect → **Users and Access** →
   **Integrations** → **App Store Connect API** → **+**. Give it the
   **App Manager** role. Download the `.p8` file — Apple only lets you
   download it once. Note the **Key ID** and the **Issuer ID** shown on that
   page.

3. **Find your Team ID.** Top right of the
   [Apple Developer](https://developer.apple.com/account) account page, or
   under Membership details. Ten characters, like `A1B2C3D4E5`.

4. **Add four repository secrets**, under **Settings → Secrets and variables →
   Actions** in GitHub:

   | Secret | Value |
   | --- | --- |
   | `ASC_KEY_ID` | the Key ID from step 2 |
   | `ASC_ISSUER_ID` | the Issuer ID from step 2 |
   | `ASC_PRIVATE_KEY` | the entire contents of the `.p8` file, including the `BEGIN`/`END` lines |
   | `APPLE_TEAM_ID` | the Team ID from step 3 |

5. **Run the workflow.** Actions → **iOS TestFlight** → **Run workflow**.

Once it finishes, the build appears in App Store Connect under **TestFlight**
after a few minutes of processing. Add yourself as an internal tester, install
[TestFlight](https://apps.apple.com/app/testflight/id899247664) on your phone,
and the app shows up there.

Internal TestFlight testing doesn't go through App Review. That matters,
because Apple routinely rejects thin web wrappers from the public App Store
under Guideline 4.2 — fine for personal use, but the front door isn't open.

Signing uses automatic provisioning driven by the API key, so no certificates
or provisioning profiles are stored in the repository. The workflow deletes
the key from the runner when it finishes, and keeps the built `.ipa` as an
artifact for 14 days.

**Cost.** macOS runners bill at 10× minutes, so a private repository's free
tier is roughly 15–20 builds a month. A public repository has free minutes.

#### Project notes

The `ios/` project is committed, including the shared Xcode scheme that CI
needs. The copied web assets (`ios/App/App/public`) and generated config are
gitignored, since `cap sync` regenerates them from `dist/`.

**The bundle identifier is `com.lukehodg.workoutdiary`**, set in
`capacitor.config.ts` and in the Xcode project. Change it in both if you'd
rather use a different one.

The build number is set from the GitHub run number, because TestFlight
rejects a build number it has already accepted.

## Deploying

The build is a folder of static files — no server, no database, no environment
variables. Hosting only ever serves those files; your workouts, diary entries
and measurements stay in your browser's `localStorage` and never reach the
host.

### Cloudflare Workers (current setup)

Connect the repository in the Cloudflare dashboard under **Workers & Pages**.
The build settings are

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Output directory | `dist` |
| Node version | picked up from `.nvmrc` (22) |

`wrangler.jsonc` is committed, so the project name, compatibility date and
asset handling are version-controlled rather than re-detected on every build.
Every push to `main` redeploys.

**The project name has no trailing hyphen.** The repository is
`personal-diary-`, but a trailing hyphen isn't valid in a subdomain, so the
Worker is called `personal-diary`.

Netlify and Vercel also work, with build command `npm run build` and output
directory `dist` — see the note on `_redirects` below if you switch.

### SPA fallback and caching

`not_found_handling: "single-page-application"` in `wrangler.jsonc` serves
`index.html` for any path that isn't a real asset.

**Do not add a `_redirects` file with a `/* /index.html 200` catch-all.**
Cloudflare Workers rejects it outright — *"Infinite loop detected in this
rule"* — because Workers already strips `.html` and `/index`, so the rule
re-triggers itself and the whole deploy fails. That catch-all is the right
answer on Netlify and on Cloudflare Pages, but not here. CI fails the build if
one reappears.

`public/_headers` is copied into `dist/` and does still apply: fingerprinted
assets are cached forever, while the service worker, `index.html` and the
manifest are `no-cache`. Without that, a cached service worker can pin the app
to an old build with no way for you to update it.

The web app manifest uses `start_url: "/"` and `scope: "/"`, which assumes the
app sits at the root of its domain — true on `*.workers.dev`, Netlify and
Vercel.

**GitHub Pages needs extra work**, because it would serve this at
`<user>.github.io/personal-diary-/`. That requires `base: "/personal-diary-/"`
in `vite.config.ts`, matching `start_url`/`scope`/icon paths in the manifest,
and a `404.html` fallback. It's all doable, just config the other hosts don't
need.

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
│   ├── ExercisePicker.tsx      # Searchable catalogue picker
│   ├── ImportGarminDialog.tsx
│   ├── Diary.tsx
│   ├── Measurements.tsx        # Body weight & custom measurements
│   ├── Insights.tsx            # PRs, load, mood, balance, keywords
│   ├── Heatmap.tsx
│   ├── RestTimer.tsx
│   └── BackupDialog.tsx
├── lib/
│   ├── types.ts            # Workouts, diary, templates, measurements
│   ├── store.ts            # localStorage hook + date helpers
│   ├── analytics.ts        # e1RM, PRs, ACWR, mood, keywords, heatmap
│   ├── wger.ts             # Muscle/category/equipment taxonomy
│   ├── exerciseCatalog.ts  # Exercises mapped onto that taxonomy
│   ├── exercises.ts        # Classification, normalisation, history
│   ├── garmin.ts           # Garmin CSV/TCX parsers
│   ├── calendar.ts         # ICS generation + Google Calendar links
│   ├── backup.ts           # JSON export/import with validation
│   └── utils.ts            # cn() class helper
└── App.tsx                 # Tab shell, dark mode, state
```

## Credits

The exercise taxonomy — the muscle, category and equipment lists and their
identifiers — comes from the [wger project](https://github.com/wger-project/wger),
a self-hosted fitness manager licensed under AGPL-3.0-or-later, with its
exercise database under Creative Commons. Only the taxonomy is used here; the
exercise catalogue in `src/lib/exerciseCatalog.ts` is this project's own
mapping of common exercise names onto it, and no exercise descriptions or
images from wger are bundled.

Component patterns follow [shadcn/ui](https://ui.shadcn.com) (MIT).
