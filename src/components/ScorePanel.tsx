import { gradeFor, totalScore } from '../model/grading'
import type { GradingScale, Task } from '../model/types'

interface Props {
  tasks: Task[]
  scale: GradingScale
}

export function ScorePanel({ tasks, scale }: Props) {
  const score = totalScore(tasks)
  const grade = gradeFor(score, scale)

  return (
    <div className="score-panel">
      <div className="score-box">
        <span className="score-value">{score}</span>
        <span className="score-label">points</span>
      </div>
      <div className="score-box">
        <span className="score-value">{grade}</span>
        <span className="score-label">grade</span>
      </div>
    </div>
  )
}
