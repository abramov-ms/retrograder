import { describe, expect, it } from 'vitest'
import {
  allTasks,
  clampScale,
  ecdfPoints,
  gradeFor,
  gradeHistogram,
  isScaleMonotonic,
  maxScore,
  moveThreshold,
  nearestThreshold,
  totalScore,
} from './grading'
import type { Student, Task } from './types'

// Thresholds for grades 3..10: 20, 30, ..., 90. Grade 2 is the floor.
const scale = [20, 30, 40, 50, 60, 70, 80, 90]

describe('gradeFor', () => {
  it('gives grade 2 below the first threshold', () => {
    expect(gradeFor(0, scale)).toBe(2)
    expect(gradeFor(19.5, scale)).toBe(2)
  })

  it('gives the grade exactly at its threshold', () => {
    expect(gradeFor(20, scale)).toBe(3)
    expect(gradeFor(90, scale)).toBe(10)
  })

  it('gives the highest grade whose threshold is met', () => {
    expect(gradeFor(35, scale)).toBe(4)
    expect(gradeFor(89.9, scale)).toBe(9)
    expect(gradeFor(1000, scale)).toBe(10)
  })

  it('handles non-monotonic scales by taking the highest satisfied grade', () => {
    expect(gradeFor(35, [20, 40, 30, 50, 60, 70, 80, 90])).toBe(5)
  })
})

const tasks: Task[] = [
  { id: 'a', name: 'A', points: 10, solved: true },
  { id: 'b', name: 'B', points: 20, solved: false },
  { id: 'c', name: 'C', points: 5, solved: true },
]

describe('totalScore / maxScore', () => {
  it('sums only solved tasks', () => {
    expect(totalScore(tasks)).toBe(15)
  })

  it('sums all tasks for the maximum', () => {
    expect(maxScore(tasks)).toBe(35)
  })
})

describe('allTasks', () => {
  it('flattens groups preserving order', () => {
    const groups = [
      { id: 'g1', name: 'HW 1', tasks: [tasks[0], tasks[1]] },
      { id: 'g2', name: 'HW 2', tasks: [tasks[2]] },
    ]
    expect(allTasks(groups)).toEqual(tasks)
    expect(totalScore(allTasks(groups))).toBe(15)
  })
})

describe('isScaleMonotonic', () => {
  it('accepts non-decreasing thresholds', () => {
    expect(isScaleMonotonic(scale)).toBe(true)
    expect(isScaleMonotonic([10, 10, 20, 20, 30, 30, 40, 40])).toBe(true)
  })

  it('rejects a decreasing step', () => {
    expect(isScaleMonotonic([20, 40, 30, 50, 60, 70, 80, 90])).toBe(false)
  })
})

describe('moveThreshold', () => {
  it('moves a threshold freely within its neighbors', () => {
    expect(moveThreshold(scale, 2, 35, 100)[2]).toBe(35)
  })

  it('rounds to whole points', () => {
    expect(moveThreshold(scale, 2, 34.7, 100)[2]).toBe(35)
  })

  it('clamps against the left neighbor', () => {
    expect(moveThreshold(scale, 2, 5, 100)[2]).toBe(30)
  })

  it('clamps against the right neighbor', () => {
    expect(moveThreshold(scale, 2, 95, 100)[2]).toBe(50)
  })

  it('clamps the first threshold to 0 and the last to max', () => {
    expect(moveThreshold(scale, 0, -10, 100)[0]).toBe(0)
    expect(moveThreshold(scale, 7, 150, 100)[7]).toBe(100)
  })

  it('does not modify the other thresholds', () => {
    const moved = moveThreshold(scale, 2, 35, 100)
    expect(moved.filter((_, i) => i !== 2)).toEqual(scale.filter((_, i) => i !== 2))
  })
})

describe('clampScale', () => {
  it('moves thresholds above the total down to the total', () => {
    expect(clampScale(scale, 65)).toEqual([20, 30, 40, 50, 60, 65, 65, 65])
  })

  it('leaves a scale within the total untouched', () => {
    expect(clampScale(scale, 100)).toEqual(scale)
  })

  it('does not destroy the scale when the task list is transiently empty', () => {
    expect(clampScale(scale, 0)).toEqual(scale)
  })
})

describe('nearestThreshold', () => {
  it('picks the closest threshold', () => {
    expect(nearestThreshold(scale, 33)).toBe(1) // 30 is closer than 40
    expect(nearestThreshold(scale, 38)).toBe(2)
    expect(nearestThreshold(scale, 0)).toBe(0)
    expect(nearestThreshold(scale, 999)).toBe(7)
  })

  it('breaks midpoint ties toward the pointer', () => {
    expect(nearestThreshold(scale, 35)).toBe(2) // grabbing from above 30 -> knob that can move down
  })

  it('picks the movable knob from a stack of equal thresholds', () => {
    const stacked = [20, 30, 30, 30, 60, 70, 80, 90]
    expect(nearestThreshold(stacked, 40)).toBe(3) // from above: top of the stack
    expect(nearestThreshold(stacked, 26)).toBe(1) // from below: bottom of the stack
  })
})

function student(score: number): Student {
  return { nickname: `nick${score}`, score }
}

describe('gradeHistogram', () => {
  it('counts students per grade over grades 2..10', () => {
    const students = [student(0), student(5), student(20), student(35), student(95)]
    const histogram = gradeHistogram(students, scale)
    expect(histogram).toHaveLength(9)
    expect(histogram[0]).toEqual({ grade: 2, count: 2 })
    expect(histogram[1]).toEqual({ grade: 3, count: 1 })
    expect(histogram[2]).toEqual({ grade: 4, count: 1 })
    expect(histogram[8]).toEqual({ grade: 10, count: 1 })
    expect(histogram.reduce((sum, b) => sum + b.count, 0)).toBe(students.length)
  })
})

describe('ecdfPoints', () => {
  it('returns an empty list for no students', () => {
    expect(ecdfPoints([])).toEqual([])
  })

  it('computes cumulative fractions over sorted distinct scores', () => {
    const points = ecdfPoints([student(30), student(10), student(20), student(40)])
    expect(points).toEqual([
      { score: 10, fraction: 0.25 },
      { score: 20, fraction: 0.5 },
      { score: 30, fraction: 0.75 },
      { score: 40, fraction: 1 },
    ])
  })

  it('merges duplicate scores into one point with the cumulative fraction', () => {
    const points = ecdfPoints([student(10), student(10), student(20), student(20)])
    expect(points).toEqual([
      { score: 10, fraction: 0.5 },
      { score: 20, fraction: 1 },
    ])
  })
})
