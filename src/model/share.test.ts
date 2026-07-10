import { describe, expect, it } from 'vitest'
import { defaultGroups, defaultScale } from '../state/defaults'
import { decodeShareState, encodeShareState } from './share'
import type { TaskGroup } from './types'

const strip = (groups: TaskGroup[]) =>
  groups.map((g) => ({ name: g.name, tasks: g.tasks.map(({ name, points, solved }) => ({ name, points, solved })) }))

describe('share state round trip', () => {
  it('restores groups and scale (with fresh ids)', () => {
    const groups = structuredClone(defaultGroups)
    groups[0].tasks[0].solved = true
    groups[1].name = 'renamed group'

    const decoded = decodeShareState(encodeShareState({ groups, scale: defaultScale }))
    expect(decoded).not.toBeNull()
    expect(decoded!.scale).toEqual(defaultScale)
    expect(strip(decoded!.groups)).toEqual(strip(groups))
    expect(decoded!.groups[0].id).not.toBe(groups[0].id)
  })

  it('produces a URL-safe string of reasonable length for the real course', () => {
    const encoded = encodeShareState({ groups: defaultGroups, scale: defaultScale })
    expect(encoded).toMatch(/^[A-Za-z0-9+$\-_]+$/)
    expect(encoded.length).toBeLessThan(1500)
  })

  it('rejects garbage, wrong versions, and malformed payloads', () => {
    expect(decodeShareState('not-a-real-payload')).toBeNull()
    expect(decodeShareState('')).toBeNull()
    const wrongVersion = encodeShareState({ groups: [], scale: defaultScale }).replace(/^./, 'Q')
    expect(decodeShareState(wrongVersion)).toBeNull()
  })

  it('rejects a scale of the wrong length', () => {
    const decoded = decodeShareState(encodeShareState({ groups: [], scale: [1, 2, 3] }))
    expect(decoded).toBeNull()
  })
})
