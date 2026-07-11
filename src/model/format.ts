import { stringify } from 'yaml'
import { gradeQuality } from './grading'
import { MIN_GRADE } from './types'
import type { GradingScale, TaskGroup } from './types'

const RU_QUALITY = { okay: 'уд.', good: 'хор.', excellent: 'отл.' } as const

// The scale as pasted into course announcements (Russian audience):
//   1200 → уд. 3
//   ...
//   2575 → отл. 10
export function formatScaleRu(scale: GradingScale): string {
  return scale
    .map((threshold, index) => {
      const grade = MIN_GRADE + 1 + index
      return `${threshold} → ${RU_QUALITY[gradeQuality(grade)]} ${grade}`
    })
    .join('\n')
}

// The task list in the src/data/tasks.yaml format. The file keeps course
// order (oldest group first) while the UI shows newest first, so the group
// order is reversed back: pasting the output into tasks.yaml reproduces the
// current app state.
export function formatGroupsYaml(groups: TaskGroup[]): string {
  return stringify(
    groups
      .slice()
      .reverse()
      .map((group) => ({
        name: group.name,
        tasks: group.tasks.map((task) => ({ name: task.name, score: task.points })),
      })),
  )
}
