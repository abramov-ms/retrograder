import { MIN_GRADE, MAX_GRADE } from './types'
import type { GradingScale, Student, Task, TaskGroup } from './types'

export function allTasks(groups: TaskGroup[]): Task[] {
  return groups.flatMap((group) => group.tasks)
}

export function gradeFor(score: number, scale: GradingScale): number {
  let grade = MIN_GRADE
  for (let i = 0; i < scale.length; i++) {
    if (score >= scale[i]) {
      grade = MIN_GRADE + 1 + i
    }
  }
  return grade
}

// Grade quality bands: 3-4 okay, 5-7 good, 8-10 excellent. Drives the knob
// colors and the Russian labels in the clipboard export.
export type GradeQuality = 'okay' | 'good' | 'excellent'

export function gradeQuality(grade: number): GradeQuality {
  if (grade >= 8) return 'excellent'
  if (grade >= 5) return 'good'
  return 'okay'
}

export function totalScore(tasks: Task[]): number {
  return tasks.reduce((sum, task) => sum + (task.solved ? task.points : 0), 0)
}

export function maxScore(tasks: Task[]): number {
  return tasks.reduce((sum, task) => sum + task.points, 0)
}

export function isScaleMonotonic(scale: GradingScale): boolean {
  return scale.every((threshold, i) => i === 0 || threshold >= scale[i - 1])
}

// Move one threshold, clamped between its neighbors (and [0, max]) so
// thresholds can never cross and the scale stays monotonic.
export function moveThreshold(scale: GradingScale, index: number, value: number, max: number): GradingScale {
  const lo = index > 0 ? scale[index - 1] : 0
  const hi = index < scale.length - 1 ? scale[index + 1] : max
  const next = [...scale]
  next[index] = Math.max(lo, Math.min(hi, Math.round(value)))
  return next
}

// Thresholds above the course total sit at the total (top grades merge there).
// Applied as a derived view over the stored scale rather than a rewrite, so a
// transiently shrunken task list (e.g. mid-edit of a points field) is lossless.
export function clampScale(scale: GradingScale, maxPoints: number): GradingScale {
  if (maxPoints <= 0) return scale
  return scale.map((threshold) => Math.min(threshold, maxPoints))
}

// Which threshold a click/drag at `value` should grab: the nearest one.
// Ties (including several knobs stacked on the same value) go to the highest
// grade when grabbing from above and the lowest when grabbing from below, so
// the chosen knob is free to move toward the pointer.
export function nearestThreshold(scale: GradingScale, value: number): number {
  let bestDist = Infinity
  let candidates: number[] = []
  scale.forEach((threshold, index) => {
    const dist = Math.abs(threshold - value)
    if (dist < bestDist) {
      bestDist = dist
      candidates = [index]
    } else if (dist === bestDist) {
      candidates.push(index)
    }
  })
  return value >= scale[candidates[0]] ? candidates[candidates.length - 1] : candidates[0]
}

export interface GradeBucket {
  grade: number
  count: number
}

export function gradeHistogram(students: Student[], scale: GradingScale): GradeBucket[] {
  const buckets: GradeBucket[] = []
  for (let grade = MIN_GRADE; grade <= MAX_GRADE; grade++) {
    buckets.push({ grade, count: 0 })
  }
  for (const student of students) {
    buckets[gradeFor(student.score, scale) - MIN_GRADE].count++
  }
  return buckets
}

export interface EcdfPoint {
  score: number
  fraction: number
}

// Points of the empirical CDF: for each distinct score, the fraction of
// students with a score <= it.
export function ecdfPoints(students: Student[]): EcdfPoint[] {
  if (students.length === 0) return []
  const scores = students.map((s) => s.score).sort((a, b) => a - b)
  const points: EcdfPoint[] = []
  for (let i = 0; i < scores.length; i++) {
    if (i + 1 < scores.length && scores[i + 1] === scores[i]) continue
    points.push({ score: scores[i], fraction: (i + 1) / scores.length })
  }
  return points
}
