# AGENTS.md

## What this is

Retrograder is a tool to speed up discussions about the grading system of an
educational CS course. It is a purely client-side single-page app — there is no
backend and none is planned. All state lives in the browser (localStorage).

## Domain

- **Grading scale**: the course uses a 10-point scale, but grade 1 is never
  awarded — effective grades are 2–10. The scale is a list of thresholds: the
  *minimum total points* required for each grade 3–10. Grade 2 is the
  implicit floor — any score below the grade-3 threshold.
  `gradeFor(score) = highest grade whose threshold <= score`. Thresholds are
  expected to be non-decreasing; violations produce an inline warning but are
  not blocked, because mid-edit states are normal during a live discussion.
- **Tasks**: each course task has a point value. Scoring is binary — a solved
  task contributes its full value. (In reality the course has soft and hard
  deadlines with the task's cost decaying linearly from 100% to 50% between
  them; this is *deliberately out of scope* — scores are assigned assuming
  students solve before the soft deadline.) Tasks are organized into named
  **groups** (e.g. per homework) purely for convenience — groups never affect
  grading, which only sees the flat task list (`allTasks`).
- **Student CSV**: three columns — nickname, full name, total score (one row
  per student, last year's results). Grades are derived from the total score
  via the current scale. A header row may or may not be present.
  `scripts/convert_grades.py` produces this file from a Manytask grades
  export (one column per task, 1 = solved) by joining it with
  `src/data/tasks.yaml` and adding the export's seminar points on top. The
  converted file is committed at `src/data/grades.csv` and bundled as the
  default retro dataset — shown until the user imports another file. The raw
  export (`/grades.csv` at the repo root) stays gitignored.

## The two modes

Both modes are split views sharing the same grading-scale editor on the right:
a single vertical track (0 points at the bottom, course total at the top)
with one draggable knob per grade threshold — grade number on the knob,
threshold value beside it. The whole track (plus a generous invisible hitbox
around it) is one drag surface: pressing anywhere grabs the *nearest* knob
(`nearestThreshold`), so users never have to aim at a knob precisely; native
browser drag/text-selection is suppressed via preventDefault on pointerdown.
Knobs at (nearly) the same value spread into side-by-side columns (lowest
grade leftmost) instead of hiding behind each other, and pressing a specific
knob drags exactly that knob; value labels share one lane right of the knob
columns, with equal thresholds sharing a single label. A green marker left of
the track (arrow + "N pts / grade G") shows where the current what-if task
selection lands; near the track top its text flips below the arrow.
Knobs are clamped between their neighbors
(`moveThreshold`), so the scale is monotonic by construction — invalid
configurations cannot be entered. The track's top is the course's total
points, derived from the task list (never a separate input). Thresholds above
the total are shown and graded *at* the total (`clampScale`, applied as a
derived view in App) — the stored scale is only rewritten when the user next
drags a knob, so a transiently shrunken task list loses no data. Arrow keys
nudge a focused knob by 1 (Shift: 5).

1. **What-if**: left — grouped task list (checkbox = solved, editable
   names/points, add/remove tasks and groups) with the current total score
   and resulting grade in its header; right — the scale editor. Used live in
   discussions: toggle tasks, watch the grade change.
2. **Retro**: left — CSV import, histogram of derived grades, and an ECDF of
   scores with vertical lines at grade thresholds; right — the same scale
   editor. Shows how a candidate scale *would have played out* on last year's
   cohort; charts re-render live as thresholds are edited.

## Stack

- **Vite + React 19 + TypeScript** — standard client-only SPA setup.
- **Recharts** for the histogram and ECDF.
- **PapaParse** for CSV parsing (delimiter auto-detection, quoting).
- **Vitest** for unit tests; **oxlint** for linting (template default).
- Plain React state in `App` + a small `useLocalStorageState` hook. No state
  management library — the state is tiny; do not add one.

## Commands

- `npm run dev` — dev server (localhost:5173, hot reload)
- `npm test` — unit tests (vitest, single run)
- `npm run build` — type-check + production build to `dist/`
- `npm run lint` — oxlint

## Layout & conventions

- `src/model/` — pure domain logic (types, grading math, CSV parsing), no
  React imports. This is where the unit tests live (`*.test.ts`). Keep all
  grade/score computations here, not in components.
- `src/state/` — persistence hooks (localStorage) and defaults.
- `src/data/scale.csv` — the course's agreed-on grading scale (`score,grade`
  rows for grades 3–10), used as the default until the user drags a knob;
  falls back to an evenly spread scale if it doesn't cover all grades.
- `src/data/tasks.yaml` — the course's real task list (array of groups, each
  with tasks + scores), hand-editable; converted from the instructor's CSV
  export. `defaults.ts` parses it at runtime (`yaml` package, `?raw` import)
  and reverses the group order so the newest groups (e.g. `15-bonus`) appear
  at the top of the UI. The default grading scale is derived from its total.
- `src/components/` — React components, one per file. `App.tsx` owns all
  shared state (tasks, scale, students, mode) and passes it down as props.
- Plain CSS (`App.css` / `index.css`); no CSS framework.
- The design mimics **Manytask** (github.com/manytask/manytask), the course's
  actual grading system: Source Code Pro (self-hosted via @fontsource)
  monospace everywhere, green-ish palette — brand teal `#17c3b2` for accents,
  `#66cda3` for solved tasks / histogram bars (black text on green),
  gray `#a8a8a8`-tinted rows for unsolved, orange `#f0ad4e` for threshold
  markers — plus large (20px) border radii on panels and buttons, and
  1px text-colored borders around task groups (like manytask lectures).
- CSV import must be forgiving: skip bad rows and report a summary
  ("imported N students, M rows skipped") rather than failing the whole file.

## Audience note

The maintainer is a CS course instructor, not a web developer. Prefer
straightforward, boring solutions over clever ones; explain web-ecosystem
choices when introducing them.
