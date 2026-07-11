import { gradeQuality } from './grading'
import { MIN_GRADE } from './types'
import type { GradingScale } from './types'

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
