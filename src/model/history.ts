// Undo/redo over commit boundaries: `checkpoint` is the current committed
// state; edits between boundaries (typing before blur, drag previews) never
// enter the history. See useUndoable for the React wiring.

export interface History<T> {
  past: T[]
  checkpoint: T
  future: T[]
}

export function createHistory<T>(initial: T): History<T> {
  return { past: [], checkpoint: initial, future: [] }
}

const same = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b)

// Record `next` as a new checkpoint. A no-op change records nothing (but
// refreshes the checkpoint reference); a real change clears the redo stack.
export function commit<T>(history: History<T>, next: T, limit = 100): History<T> {
  if (same(history.checkpoint, next)) return { ...history, checkpoint: next }
  return { past: [...history.past, history.checkpoint].slice(-limit), checkpoint: next, future: [] }
}

export function undo<T>(history: History<T>): History<T> | null {
  if (history.past.length === 0) return null
  return {
    past: history.past.slice(0, -1),
    checkpoint: history.past[history.past.length - 1],
    future: [history.checkpoint, ...history.future],
  }
}

export function redo<T>(history: History<T>): History<T> | null {
  if (history.future.length === 0) return null
  return {
    past: [...history.past, history.checkpoint],
    checkpoint: history.future[0],
    future: history.future.slice(1),
  }
}
