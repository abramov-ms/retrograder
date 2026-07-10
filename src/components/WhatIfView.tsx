import { allTasks, maxScore } from '../model/grading'
import { ScaleEditor } from './ScaleEditor'
import { TaskList } from './TaskList'
import type { GradingScale, TaskGroup } from '../model/types'

interface Props {
  groups: TaskGroup[]
  onGroupsChange: (groups: TaskGroup[]) => void
  scale: GradingScale
  onScaleChange: (scale: GradingScale) => void
}

export function WhatIfView({ groups, onGroupsChange, scale, onScaleChange }: Props) {
  return (
    <div className="split-view">
      <div className="split-left">
        <TaskList groups={groups} onChange={onGroupsChange} scale={scale} />
      </div>
      <div className="split-right">
        <ScaleEditor scale={scale} onChange={onScaleChange} maxPoints={maxScore(allTasks(groups))} />
      </div>
    </div>
  )
}
