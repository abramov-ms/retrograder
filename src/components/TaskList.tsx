import { allTasks, maxScore, totalScore } from '../model/grading'
import { newTaskId } from '../state/defaults'
import { ScorePanel } from './ScorePanel'
import type { GradingScale, Task, TaskGroup } from '../model/types'

interface Props {
  groups: TaskGroup[]
  onChange: (groups: TaskGroup[]) => void
  scale: GradingScale
}

export function TaskList({ groups, onChange, scale }: Props) {
  const updateGroup = (groupId: string, patch: Partial<TaskGroup>) => {
    onChange(groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)))
  }

  const updateTask = (group: TaskGroup, taskId: string, patch: Partial<Task>) => {
    updateGroup(group.id, {
      tasks: group.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    })
  }

  const addTask = (group: TaskGroup) => {
    updateGroup(group.id, {
      tasks: [...group.tasks, { id: newTaskId(), name: `Task ${group.tasks.length + 1}`, points: 10, solved: false }],
    })
  }

  const removeTask = (group: TaskGroup, taskId: string) => {
    updateGroup(group.id, { tasks: group.tasks.filter((task) => task.id !== taskId) })
  }

  const addGroup = () => {
    onChange([...groups, { id: newTaskId(), name: `Group ${groups.length + 1}`, tasks: [] }])
  }

  const removeGroup = (groupId: string) => {
    onChange(groups.filter((group) => group.id !== groupId))
  }

  const setAllSolved = (solved: boolean) => {
    onChange(groups.map((group) => ({ ...group, tasks: group.tasks.map((task) => ({ ...task, solved })) })))
  }

  const setGroupSolved = (group: TaskGroup, solved: boolean) => {
    updateGroup(group.id, { tasks: group.tasks.map((task) => ({ ...task, solved })) })
  }

  const tasks = allTasks(groups)

  return (
    <section className="panel">
      <div className="task-list-header">
        <div>
          <h2>Tasks</h2>
          <p className="hint">Check the tasks a student solved; every task counts its full points. Groups don't affect grading.</p>
        </div>
        <ScorePanel tasks={tasks} scale={scale} />
      </div>
      {groups.map((group) => (
        <div key={group.id} className="task-group">
          <div className="task-group-header">
            <input
              type="text"
              className="task-group-name"
              value={group.name}
              onChange={(e) => updateGroup(group.id, { name: e.target.value })}
            />
            <button className="icon-button" title="Remove group" aria-label="Remove group" onClick={() => removeGroup(group.id)} />
          </div>
          <div className="task-list">
            {group.tasks.map((task) => (
              <div key={task.id} className={task.solved ? 'task-row solved' : 'task-row'}>
                <input
                  type="checkbox"
                  checked={task.solved}
                  onChange={(e) => updateTask(group, task.id, { solved: e.target.checked })}
                />
                <input
                  type="text"
                  className="task-name"
                  value={task.name}
                  onChange={(e) => updateTask(group, task.id, { name: e.target.value })}
                />
                <input
                  type="number"
                  className="task-points"
                  min={0}
                  value={task.points}
                  onChange={(e) => updateTask(group, task.id, { points: Number(e.target.value) })}
                />
                <button className="icon-button" title="Remove task" aria-label="Remove task" onClick={() => removeTask(group, task.id)} />
              </div>
            ))}
          </div>
          <div className="task-actions">
            <button onClick={() => addTask(group)}>+ Add task</button>
            <button onClick={() => setGroupSolved(group, true)}>Solve all</button>
            <button onClick={() => setGroupSolved(group, false)}>Clear</button>
            <span className="hint">
              {totalScore(group.tasks)} / {maxScore(group.tasks)} pts
            </span>
          </div>
        </div>
      ))}
      <div className="task-actions">
        <button onClick={addGroup}>+ Add group</button>
        <button onClick={() => setAllSolved(true)}>Solve all</button>
        <button onClick={() => setAllSolved(false)}>Clear</button>
        <span className="hint">
          {totalScore(tasks)} / {maxScore(tasks)} points
        </span>
      </div>
    </section>
  )
}
