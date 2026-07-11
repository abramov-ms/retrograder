import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import courseTasksYaml from '../data/tasks.yaml?raw'
import { defaultGroups } from '../state/defaults'
import { formatGroupsYaml, formatScaleRu } from './format'

describe('formatScaleRu', () => {
  it('labels each grade with its Russian quality band', () => {
    expect(formatScaleRu([1200, 1300, 1500, 1600, 1700, 2100, 2350, 2575])).toBe(
      [
        '1200 → уд. 3',
        '1300 → уд. 4',
        '1500 → хор. 5',
        '1600 → хор. 6',
        '1700 → хор. 7',
        '2100 → отл. 8',
        '2350 → отл. 9',
        '2575 → отл. 10',
      ].join('\n'),
    )
  })
})

describe('formatGroupsYaml', () => {
  it('round-trips the default course back to the tasks.yaml structure', () => {
    expect(parse(formatGroupsYaml(defaultGroups))).toEqual(parse(courseTasksYaml))
  })

  it('emits the tasks.yaml shape', () => {
    const groups = [{ id: 'g', name: '15-bonus', tasks: [{ id: 't', name: 'broken-echo', points: 50, solved: true }] }]
    expect(formatGroupsYaml(groups)).toBe('- name: 15-bonus\n  tasks:\n    - name: broken-echo\n      score: 50\n')
  })
})
