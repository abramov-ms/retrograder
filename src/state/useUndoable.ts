import { useCallback, useRef, useState } from 'react'
import { commit, createHistory, redo, undo } from '../model/history'

export interface Undoable<T> {
  // Live update without a history entry (typing before blur, drag previews).
  preview: (next: T) => void
  // Update and record a checkpoint (checkbox toggles, buttons, drops).
  commit: (next: T) => void
  // Record a checkpoint at the current value if it changed (input blur).
  commitPending: () => void
  // Throw away previewed changes (cancelled drag).
  cancelPreview: () => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

// Wraps an external value/setter pair (here: the localStorage-backed groups
// state) with commit-boundary undo/redo.
export function useUndoable<T>(value: T, setValue: (next: T) => void): Undoable<T> {
  const historyRef = useRef(createHistory(value))
  const valueRef = useRef(value)
  valueRef.current = value
  const [, setVersion] = useState(0)
  const touch = () => setVersion((n) => n + 1)

  const commitValue = useCallback(
    (next: T) => {
      setValue(next)
      historyRef.current = commit(historyRef.current, next)
      touch()
    },
    [setValue],
  )

  const commitPending = useCallback(() => {
    historyRef.current = commit(historyRef.current, valueRef.current)
    touch()
  }, [])

  const cancelPreview = useCallback(() => {
    setValue(historyRef.current.checkpoint)
  }, [setValue])

  const undoValue = useCallback(() => {
    const next = undo(historyRef.current)
    if (!next) return
    historyRef.current = next
    setValue(next.checkpoint)
    touch()
  }, [setValue])

  const redoValue = useCallback(() => {
    const next = redo(historyRef.current)
    if (!next) return
    historyRef.current = next
    setValue(next.checkpoint)
    touch()
  }, [setValue])

  return {
    preview: setValue,
    commit: commitValue,
    commitPending,
    cancelPreview,
    undo: undoValue,
    redo: redoValue,
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,
  }
}
