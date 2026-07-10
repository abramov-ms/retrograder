import { allTasks, clampScale, maxScore } from './model/grading'
import { RetroView } from './components/RetroView'
import { WhatIfView } from './components/WhatIfView'
import { defaultScale, defaultStudents, migratedDefaultGroups, normalizeScale } from './state/defaults'
import { useLocalStorageState } from './state/useLocalStorageState'
import type { GradingScale, Student, TaskGroup } from './model/types'
import './App.css'

type Mode = 'what-if' | 'retro'

export default function App() {
  const [mode, setMode] = useLocalStorageState<Mode>('retrograder.mode', 'what-if')
  const [groups, setGroups] = useLocalStorageState<TaskGroup[]>('retrograder.groups', migratedDefaultGroups())
  const [storedScale, setScale] = useLocalStorageState<GradingScale>('retrograder.scale', defaultScale)
  const scale = normalizeScale(storedScale)
  const [importedStudents, setStudents] = useLocalStorageState<Student[]>('retrograder.students', [])
  // Until the user imports a file, retro mode shows the bundled results of
  // the past year (also covers older sessions that persisted an empty list).
  const students = importedStudents.length > 0 ? importedStudents : defaultStudents

  // The scale everything sees: thresholds above the tasks' total points sit
  // at the total. Dragging any knob persists the clamped values.
  const maxPoints = maxScore(allTasks(groups))
  const effectiveScale = clampScale(scale, maxPoints)

  return (
    <div className="app">
      <header className="app-header">
        <h1>retrograder</h1>
        <nav className="mode-tabs">
          <button className={mode === 'what-if' ? 'tab tab-active' : 'tab'} onClick={() => setMode('what-if')}>
            What-if
          </button>
          <button className={mode === 'retro' ? 'tab tab-active' : 'tab'} onClick={() => setMode('retro')}>
            Retro
          </button>
        </nav>
      </header>
      {mode === 'what-if' ? (
        <WhatIfView groups={groups} onGroupsChange={setGroups} scale={effectiveScale} onScaleChange={setScale} />
      ) : (
        <RetroView
          students={students}
          onStudentsChange={setStudents}
          scale={effectiveScale}
          onScaleChange={setScale}
          maxPoints={maxPoints}
        />
      )}
    </div>
  )
}
