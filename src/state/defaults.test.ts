import { describe, expect, it } from 'vitest'
import { allTasks, isScaleMonotonic, maxScore } from '../model/grading'
import { defaultGroups, defaultScale, defaultStudents } from './defaults'

describe('default course groups (src/data/tasks.yaml)', () => {
  it('loads all groups and tasks', () => {
    expect(defaultGroups).toHaveLength(12)
    expect(allTasks(defaultGroups)).toHaveLength(32)
    expect(maxScore(allTasks(defaultGroups))).toBe(2975)
  })

  it('keeps the course order (oldest group first)', () => {
    expect(defaultGroups[0].name).toBe('01-data-representation')
    expect(defaultGroups[defaultGroups.length - 1].name).toBe('15-bonus')
  })

  it('merges interleaved rows of one group', () => {
    const processes = defaultGroups.find((g) => g.name === '06-processes')
    expect(processes?.tasks.map((t) => t.name)).toEqual([
      'proc-chain',
      'proc-lca',
      'lockfree-stack',
      'userspace-signalfd',
    ])
  })
})

describe('defaultStudents (src/data/grades.csv)', () => {
  it('loads last year\'s cohort', () => {
    expect(defaultStudents).toHaveLength(313)
    expect(defaultStudents[0]).toEqual({ nickname: 'MMatvei', score: 1775 })
  })
})

describe('defaultScale (src/data/scale.csv)', () => {
  it('loads the course scale for grades 3..10', () => {
    expect(defaultScale).toEqual([1200, 1300, 1500, 1600, 1700, 2100, 2350, 2575])
    expect(isScaleMonotonic(defaultScale)).toBe(true)
  })
})
