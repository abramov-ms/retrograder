export interface Task {
  id: string
  name: string
  points: number
  solved: boolean
}

// Groups exist purely for organization; grading only sees the flat task list.
export interface TaskGroup {
  id: string
  name: string
  tasks: Task[]
}

// Minimum total points required for grades 3..10 (index 0 -> grade 3).
// The course never awards grade 1, so grade 2 is the implicit floor: any
// score below the grade-3 threshold.
export type GradingScale = number[]

export const MIN_GRADE = 2
export const MAX_GRADE = 10
export const SCALE_LENGTH = MAX_GRADE - MIN_GRADE

export interface Student {
  nickname: string
  score: number
}
