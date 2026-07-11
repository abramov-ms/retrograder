import Papa from 'papaparse'
import { parse } from 'yaml'
import gradesCsv from '../data/grades.csv?raw'
import scaleCsv from '../data/scale.csv?raw'
import courseTasksYaml from '../data/tasks.yaml?raw'
import { parseStudentsCsv } from '../model/csv'
import { allTasks, maxScore } from '../model/grading'
import { MAX_GRADE, MIN_GRADE, SCALE_LENGTH } from '../model/types'
import type { GradingScale, Student, Task, TaskGroup } from '../model/types'

export function newTaskId(): string {
  return crypto.randomUUID()
}

interface CourseTask {
  name: string
  score: number
}

interface CourseGroup {
  name: string
  tasks: CourseTask[]
}

// The course's real task list lives in src/data/tasks.yaml, in course order
// (oldest group first) — the same order the UI shows, so new groups added at
// the bottom continue the sequence.
export const defaultGroups: TaskGroup[] = (parse(courseTasksYaml) as CourseGroup[]).map((group) => ({
  id: newTaskId(),
  name: group.name,
  tasks: group.tasks.map(
    (task): Task => ({ id: newTaskId(), name: task.name, points: task.score, solved: false }),
  ),
}))

// Older versions stored a flat task list under this key; wrap it in one group.
export function migratedDefaultGroups(): TaskGroup[] {
  try {
    const stored = localStorage.getItem('retrograder.tasks')
    if (stored) {
      const flat = JSON.parse(stored) as Task[]
      if (Array.isArray(flat) && flat.length > 0) {
        return [{ id: newTaskId(), name: 'Tasks', tasks: flat }]
      }
    }
  } catch {
    // fall through to the defaults
  }
  return defaultGroups
}

// Last year's results (src/data/grades.csv), shown in retro mode until a
// file is imported.
export const defaultStudents: Student[] = parseStudentsCsv(gradesCsv).students

// The course's agreed-on scale lives in src/data/scale.csv (score,grade
// rows). Non-numeric rows (the header) are skipped.
function parseScaleCsv(text: string): GradingScale | null {
  const byGrade = new Map<number, number>()
  for (const row of Papa.parse<string[]>(text.trim(), { skipEmptyLines: true }).data) {
    const score = Number(row[0])
    const grade = Number(row[1])
    if (Number.isFinite(score) && Number.isFinite(grade)) byGrade.set(grade, score)
  }
  const scale: GradingScale = []
  for (let grade = MIN_GRADE + 1; grade <= MAX_GRADE; grade++) {
    const score = byGrade.get(grade)
    if (score === undefined) return null
    scale.push(score)
  }
  return scale
}

// Fallback if scale.csv doesn't cover grades 3..10: evenly spaced thresholds,
// grade g at (g - 1) * 10% of the course total, rounded to 5 points.
const totalPoints = maxScore(allTasks(defaultGroups))
const evenlySpreadScale: GradingScale = Array.from(
  { length: SCALE_LENGTH },
  (_, i) => Math.round((totalPoints * (i + 2)) / 10 / 5) * 5,
)

export const defaultScale: GradingScale = parseScaleCsv(scaleCsv) ?? evenlySpreadScale

// Older versions stored 9 thresholds (grades 2..10); grade 2 is the floor
// now, so its threshold is dropped.
export function normalizeScale(scale: GradingScale): GradingScale {
  if (scale.length === SCALE_LENGTH) return scale
  if (scale.length === SCALE_LENGTH + 1) return scale.slice(1)
  return defaultScale
}
