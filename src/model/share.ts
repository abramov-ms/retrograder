import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { SCALE_LENGTH } from './types'
import type { GradingScale, TaskGroup } from './types'

export interface SharedState {
  groups: TaskGroup[]
  scale: GradingScale
}

// Compact versioned payload, kept small so the URL stays shareable:
// [1, scale, [[groupName, [[taskName, points, solved01], ...]], ...]]
type PackedTask = [string, number, 0 | 1]
type PackedGroup = [string, PackedTask[]]
type Payload = [1, number[], PackedGroup[]]

export function encodeShareState({ groups, scale }: SharedState): string {
  const payload: Payload = [
    1,
    scale,
    groups.map((group): PackedGroup => [
      group.name,
      group.tasks.map((task): PackedTask => [task.name, task.points, task.solved ? 1 : 0]),
    ]),
  ]
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

// Task/group ids are not shared; fresh ones are generated on decode.
export function decodeShareState(encoded: string): SharedState | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const payload: unknown = JSON.parse(json)
    if (!Array.isArray(payload) || payload[0] !== 1) return null
    const [, scale, packedGroups] = payload as [1, unknown, unknown]
    if (!Array.isArray(scale) || scale.length !== SCALE_LENGTH || !scale.every(isFiniteNumber)) return null
    if (!Array.isArray(packedGroups)) return null

    const groups: TaskGroup[] = packedGroups.map((packedGroup) => {
      const [name, packedTasks] = packedGroup as [unknown, unknown]
      if (typeof name !== 'string' || !Array.isArray(packedTasks)) throw new Error('bad group')
      return {
        id: crypto.randomUUID(),
        name,
        tasks: packedTasks.map((packedTask) => {
          const [taskName, points, solved] = packedTask as [unknown, unknown, unknown]
          if (typeof taskName !== 'string' || !isFiniteNumber(points) || (solved !== 0 && solved !== 1)) {
            throw new Error('bad task')
          }
          return { id: crypto.randomUUID(), name: taskName, points, solved: solved === 1 }
        }),
      }
    })
    return { groups, scale }
  } catch {
    return null
  }
}
