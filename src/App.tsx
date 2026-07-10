import { useCallback, useEffect, useState } from 'react'
import { allTasks, clampScale, maxScore, totalScore } from './model/grading'
import { encodeShareState, decodeShareState } from './model/share'
import { RetroView } from './components/RetroView'
import { ScaleEditor } from './components/ScaleEditor'
import { TaskList } from './components/TaskList'
import { defaultGroups, defaultScale, defaultStudents, migratedDefaultGroups, normalizeScale } from './state/defaults'
import { useLocalStorageState } from './state/useLocalStorageState'
import { useUndoable } from './state/useUndoable'
import type { Undoable } from './state/useUndoable'
import type { GradingScale, Student, TaskGroup } from './model/types'
import './App.css'

type Mode = 'what-if' | 'retro'

// State arriving in a share link: read (and strip from the URL) once per page
// load, at module scope so React StrictMode's double-rendering can't lose it.
function readSharedState() {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('s')
  if (!encoded) return null
  const state = decodeShareState(encoded)
  params.delete('s')
  const query = params.toString()
  history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''))
  return state
}

const sharedState = readSharedState()

export default function App() {
  const [mode, setMode] = useLocalStorageState<Mode>('retrograder.mode', 'what-if')
  const [groups, setGroups] = useLocalStorageState<TaskGroup[]>(
    'retrograder.groups',
    migratedDefaultGroups(),
    sharedState?.groups,
  )
  const [storedScale, setScale] = useLocalStorageState<GradingScale>(
    'retrograder.scale',
    defaultScale,
    sharedState?.scale,
  )
  const scale = normalizeScale(storedScale)

  // One undo timeline over both editors: task-list actions and scale-knob
  // drops interleave in the order they happened.
  const setEditorState = useCallback(
    (next: { groups: TaskGroup[]; scale: GradingScale }) => {
      setGroups(next.groups)
      setScale(next.scale)
    },
    [setGroups, setScale],
  )
  const history = useUndoable({ groups, scale }, setEditorState)
  // The task list edits only its slice of the shared timeline.
  const groupsHistory: Undoable<TaskGroup[]> = {
    ...history,
    preview: (next) => history.preview({ groups: next, scale }),
    commit: (next) => history.commit({ groups: next, scale }),
  }
  const [importedStudents, setStudents] = useLocalStorageState<Student[]>('retrograder.students', [])
  // Until the user imports a file, retro mode shows the bundled results of
  // the past year (also covers older sessions that persisted an empty list).
  const students = importedStudents.length > 0 ? importedStudents : defaultStudents

  // The scale everything sees: thresholds above the tasks' total points sit
  // at the total. Dragging any knob persists the clamped values.
  const maxPoints = maxScore(allTasks(groups))
  const effectiveScale = clampScale(scale, maxPoints)
  const score = totalScore(allTasks(groups))

  // No confirmation: the tasks/scale part is one undoable history entry.
  const reset = () => {
    history.commit({ groups: defaultGroups, scale: defaultScale })
    setStudents([]) // falls back to the bundled cohort
  }

  // Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or +Y). Inside an input the browser's
  // own per-field undo applies instead, so the shortcut is left alone there.
  const { undo, redo } = history
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key !== 'z' && key !== 'y') return
      const target = e.target as HTMLElement
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      e.preventDefault()
      if (key === 'y' || e.shiftKey) redo()
      else undo()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeShareState({
      groups,
      scale: effectiveScale,
    })}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard access (e.g. plain-http host): let the user copy manually.
      window.prompt('Copy the link:', url)
    }
  }

  return (
    <>
      {/* Shown instead of the app on narrow screens (see App.css): the split
          view and the draggable scale don't work on a phone. */}
      <div className="mobile-notice">
        <h1>retrograder</h1>
        <p>
          This tool is built for desktop screens — the split view and the draggable grading scale need room to
          breathe. Please reopen it on a PC.
        </p>
      </div>
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
        <div className="header-actions">
          <button onClick={history.undo} disabled={!history.canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
            ↩
          </button>
          <button onClick={history.redo} disabled={!history.canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
            ↪
          </button>
          <button className="reset-button" onClick={reset}>
            Reset
          </button>
          <button onClick={share}>{copied ? 'Link copied!' : 'Share'}</button>
        </div>
      </header>
      <div className="split-view">
        <div className="split-left">
          {mode === 'what-if' ? (
            <TaskList groups={groups} history={groupsHistory} scale={effectiveScale} />
          ) : (
            <RetroView students={students} onStudentsChange={setStudents} scale={effectiveScale} score={score} />
          )}
        </div>
        <div className="split-right">
          {/* One persistent editor for both modes: remounting it on tab
              switches makes the labels flicker while the track re-measures. */}
          <ScaleEditor
            scale={effectiveScale}
            onChange={(next) => history.preview({ groups, scale: next })}
            onCommit={history.commitPending}
            maxPoints={maxPoints}
            score={score}
          />
        </div>
      </div>
      </div>
    </>
  )
}
