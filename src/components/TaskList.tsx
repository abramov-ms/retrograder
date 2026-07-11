import { DndContext, PointerSensor, closestCenter, pointerWithin, useSensor, useSensors } from '@dnd-kit/core'
import type { CollisionDetection, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { allTasks, maxScore, totalScore } from '../model/grading'
import { newTaskId } from '../state/defaults'
import { ScorePanel } from './ScorePanel'
import type { Undoable } from '../state/useUndoable'
import type { GradingScale, Task, TaskGroup } from '../model/types'

interface Props {
  groups: TaskGroup[]
  history: Undoable<TaskGroup[]>
  scale: GradingScale
}

interface SortableTaskProps {
  group: TaskGroup
  task: Task
  // `commit` is false for keystrokes (blur records the checkpoint instead).
  onUpdate: (group: TaskGroup, taskId: string, patch: Partial<Task>, commit: boolean) => void
  onRemove: (group: TaskGroup, taskId: string) => void
  onBlur: () => void
}

// A task row with a drag handle; only the handle starts drags, so the inputs
// and the checkbox keep working normally.
function SortableTask({ group, task, onUpdate, onRemove, onBlur }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task' },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={(task.solved ? 'task-row solved' : 'task-row') + (isDragging ? ' dragging' : '')}
    >
      <span className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>
        ⠿
      </span>
      <input
        type="checkbox"
        checked={task.solved}
        onChange={(e) => onUpdate(group, task.id, { solved: e.target.checked }, true)}
      />
      <input
        type="text"
        className="task-name"
        value={task.name}
        onChange={(e) => onUpdate(group, task.id, { name: e.target.value }, false)}
        onBlur={onBlur}
      />
      <input
        type="number"
        className="task-points"
        min={0}
        value={task.points}
        onChange={(e) => onUpdate(group, task.id, { points: Number(e.target.value) }, false)}
        onBlur={onBlur}
      />
      <button className="icon-button" title="Remove task" aria-label="Remove task" onClick={() => onRemove(group, task.id)} />
    </div>
  )
}

interface SortableGroupProps {
  group: TaskGroup
  children: React.ReactNode
  onRename: (groupId: string, name: string) => void
  onRemove: (groupId: string) => void
  onBlur: () => void
  actions: React.ReactNode
}

function SortableGroup({ group, children, onRename, onRemove, onBlur, actions }: SortableGroupProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    data: { type: 'group' },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? 'task-group dragging' : 'task-group'}
    >
      <div className="task-group-header">
        <span className="drag-handle" title="Drag to reorder" {...attributes} {...listeners}>
          ⠿
        </span>
        <input
          type="text"
          className="task-group-name"
          value={group.name}
          onChange={(e) => onRename(group.id, e.target.value)}
          onBlur={onBlur}
        />
        <button className="icon-button" title="Remove group" aria-label="Remove group" onClick={() => onRemove(group.id)} />
      </div>
      {children}
      {actions}
    </div>
  )
}

// closestCenter alone misfires here: near a group's edge the *neighboring
// group's* box can be the closest droppable even though the pointer is still
// inside the current group, teleporting the task. Resolve by pointer
// containment first (task rows, then group boxes), with closestCenter over
// rows only as the between-groups fallback.
const collisionStrategy: CollisionDetection = (args) => {
  const typeOf = (id: unknown) => args.droppableContainers.find((c) => c.id === id)?.data.current?.type
  if (args.active.data.current?.type === 'group') {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'group'),
    })
  }
  const underPointer = pointerWithin(args)
  const taskHit = underPointer.find((c) => typeOf(c.id) === 'task')
  if (taskHit) return [taskHit]
  if (underPointer.length > 0) return [underPointer[0]] // a group's empty area
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'task'),
  })
}

export function TaskList({ groups, history, scale }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const apply = (next: TaskGroup[], commit: boolean) => (commit ? history.commit(next) : history.preview(next))

  const updateGroup = (groupId: string, patch: Partial<TaskGroup>, commit = true) => {
    apply(
      groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
      commit,
    )
  }

  const updateTask = (group: TaskGroup, taskId: string, patch: Partial<Task>, commit = true) => {
    updateGroup(
      group.id,
      { tasks: group.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)) },
      commit,
    )
  }

  const addTask = (group: TaskGroup) => {
    updateGroup(group.id, {
      tasks: [...group.tasks, { id: newTaskId(), name: `task-${group.tasks.length + 1}`, points: 10, solved: false }],
    })
  }

  const removeTask = (group: TaskGroup, taskId: string) => {
    updateGroup(group.id, { tasks: group.tasks.filter((task) => task.id !== taskId) })
  }

  const addGroup = () => {
    history.commit([...groups, { id: newTaskId(), name: `group-${groups.length + 1}`, tasks: [] }])
  }

  const removeGroup = (groupId: string) => {
    history.commit(groups.filter((group) => group.id !== groupId))
  }

  const setAllSolved = (solved: boolean) => {
    history.commit(groups.map((group) => ({ ...group, tasks: group.tasks.map((task) => ({ ...task, solved })) })))
  }

  const setGroupSolved = (group: TaskGroup, solved: boolean) => {
    updateGroup(group.id, { tasks: group.tasks.map((task) => ({ ...task, solved })) })
  }

  const groupIndexOfTask = (taskId: string) => groups.findIndex((g) => g.tasks.some((t) => t.id === taskId))

  // While a task is dragged over another group, move it there so dnd-kit can
  // sort it among that group's rows. These are previews; the drop commits.
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.data.current?.type !== 'task') return
    const from = groupIndexOfTask(String(active.id))
    const overIsGroup = over.data.current?.type === 'group'
    const to = overIsGroup ? groups.findIndex((g) => g.id === over.id) : groupIndexOfTask(String(over.id))
    if (from < 0 || to < 0 || from === to) return
    const task = groups[from].tasks.find((t) => t.id === active.id)!
    const insertAt = overIsGroup
      ? groups[to].tasks.length
      : groups[to].tasks.findIndex((t) => t.id === over.id)
    history.preview(
      groups.map((group, i) => {
        if (i === from) return { ...group, tasks: group.tasks.filter((t) => t.id !== active.id) }
        if (i === to) {
          const tasks = [...group.tasks]
          tasks.splice(insertAt, 0, task)
          return { ...group, tasks }
        }
        return group
      }),
    )
  }

  // The final order for a drop; `groups` already carries the drag-over
  // previews, so "unchanged" still commits any cross-group move.
  const dropResult = ({ active, over }: DragEndEvent): TaskGroup[] => {
    if (!over || active.id === over.id) return groups
    if (active.data.current?.type === 'group') {
      const oldIndex = groups.findIndex((g) => g.id === active.id)
      const overGroupId =
        over.data.current?.type === 'group' ? over.id : groups[groupIndexOfTask(String(over.id))]?.id
      const newIndex = groups.findIndex((g) => g.id === overGroupId)
      return oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex ? arrayMove(groups, oldIndex, newIndex) : groups
    }
    const groupIndex = groupIndexOfTask(String(active.id))
    if (groupIndex < 0) return groups
    const tasks = groups[groupIndex].tasks
    const oldIndex = tasks.findIndex((t) => t.id === active.id)
    const newIndex = tasks.findIndex((t) => t.id === over.id)
    if (newIndex < 0 || oldIndex === newIndex) return groups
    return groups.map((g, i) => (i === groupIndex ? { ...g, tasks: arrayMove(tasks, oldIndex, newIndex) } : g))
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
      <DndContext
        sensors={sensors}
        collisionDetection={collisionStrategy}
        onDragOver={handleDragOver}
        onDragEnd={(event) => history.commit(dropResult(event))}
        onDragCancel={history.cancelPreview}
      >
        <SortableContext items={groups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
          {groups.map((group) => (
            <SortableGroup
              key={group.id}
              group={group}
              onRename={(id, name) => updateGroup(id, { name }, false)}
              onRemove={removeGroup}
              onBlur={history.commitPending}
              actions={
                <div className="task-actions">
                  <button onClick={() => addTask(group)}>+ Add task</button>
                  <button onClick={() => setGroupSolved(group, true)}>Solve all</button>
                  <button onClick={() => setGroupSolved(group, false)}>Clear</button>
                  <span className="hint">
                    {totalScore(group.tasks)} / {maxScore(group.tasks)} pts
                  </span>
                </div>
              }
            >
              <div className="task-list">
                <SortableContext items={group.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {group.tasks.map((task) => (
                    <SortableTask
                      key={task.id}
                      group={group}
                      task={task}
                      onUpdate={updateTask}
                      onRemove={removeTask}
                      onBlur={history.commitPending}
                    />
                  ))}
                </SortableContext>
              </div>
            </SortableGroup>
          ))}
        </SortableContext>
      </DndContext>
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
