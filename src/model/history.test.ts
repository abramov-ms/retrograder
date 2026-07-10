import { describe, expect, it } from 'vitest'
import { commit, createHistory, redo, undo } from './history'

describe('history', () => {
  it('commits checkpoints and undoes back through them', () => {
    let h = createHistory('a')
    h = commit(h, 'b')
    h = commit(h, 'c')
    expect(h.checkpoint).toBe('c')
    h = undo(h)!
    expect(h.checkpoint).toBe('b')
    h = undo(h)!
    expect(h.checkpoint).toBe('a')
    expect(undo(h)).toBeNull()
  })

  it('redoes undone checkpoints in order', () => {
    let h = commit(commit(createHistory('a'), 'b'), 'c')
    h = undo(undo(h)!)!
    h = redo(h)!
    expect(h.checkpoint).toBe('b')
    h = redo(h)!
    expect(h.checkpoint).toBe('c')
    expect(redo(h)).toBeNull()
  })

  it('a real commit clears the redo stack', () => {
    let h = commit(createHistory('a'), 'b')
    h = undo(h)!
    h = commit(h, 'x')
    expect(redo(h)).toBeNull()
    expect(undo(h)!.checkpoint).toBe('a')
  })

  it('ignores commits that do not change the state', () => {
    let h = commit(createHistory({ v: 1 }), { v: 1 })
    expect(h.past).toHaveLength(0)
    h = commit(h, { v: 2 })
    h = undo(h)!
    h = commit(h, { v: 1 }) // no-op relative to the restored checkpoint
    expect(redo(h)).not.toBeNull() // redo stack survives no-op commits
  })

  it('caps the undo depth', () => {
    let h = createHistory(0)
    for (let i = 1; i <= 150; i++) h = commit(h, i, 100)
    expect(h.past).toHaveLength(100)
    expect(h.past[0]).toBe(50)
  })
})
