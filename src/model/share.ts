import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { GROUP_NAMES, GROUP_NAME_INDEX, SCORES, SCORE_INDEX, TASK_NAMES, TASK_NAME_INDEX } from './shareDictionary'
import { SCALE_LENGTH } from './types'
import type { GradingScale, TaskGroup } from './types'

export interface SharedState {
  groups: TaskGroup[]
  scale: GradingScale
}

// Compact versioned payload, kept small so the URL stays shareable (short
// enough for messengers to linkify). Known names and common scores are
// referenced by index into the shareDictionary tables; everything else rides
// along as a literal. In every ref, a number means "dictionary index" and a
// string means "literal" (scores as decimal strings):
//   [1, scale, [[groupRef, [[taskRef, solved01, scoreRef], ...]], ...]]
type Ref = number | string
type PackedTask = [Ref, 0 | 1, Ref]
type PackedGroup = [Ref, PackedTask[]]
type Payload = [1, number[], PackedGroup[]]

const packName = (index: Map<string | number, number>, name: string): Ref => index.get(name) ?? name
const packScore = (points: number): Ref => SCORE_INDEX.get(points) ?? String(points)

export function encodeShareState({ groups, scale }: SharedState): string {
  const payload: Payload = [
    1,
    scale,
    groups.map((group): PackedGroup => [
      packName(GROUP_NAME_INDEX, group.name),
      group.tasks.map((task): PackedTask => [
        packName(TASK_NAME_INDEX, task.name),
        task.solved ? 1 : 0,
        packScore(task.points),
      ]),
    ]),
  ]
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function unpackName(table: readonly string[], ref: unknown): string {
  if (typeof ref === 'string') return ref
  if (typeof ref === 'number' && Number.isInteger(ref) && ref >= 0 && ref < table.length) return table[ref]
  throw new Error('bad name ref')
}

function unpackScore(ref: unknown): number {
  if (typeof ref === 'number' && Number.isInteger(ref) && ref >= 0 && ref < SCORES.length) return SCORES[ref]
  if (typeof ref === 'string' && Number.isFinite(Number(ref))) return Number(ref)
  throw new Error('bad score ref')
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
      const [nameRef, packedTasks] = packedGroup as [unknown, unknown]
      if (!Array.isArray(packedTasks)) throw new Error('bad group')
      return {
        id: crypto.randomUUID(),
        name: unpackName(GROUP_NAMES, nameRef),
        tasks: packedTasks.map((packedTask) => {
          const [taskRef, solved, scoreRef] = packedTask as [unknown, unknown, unknown]
          if (solved !== 0 && solved !== 1) throw new Error('bad task')
          return {
            id: crypto.randomUUID(),
            name: unpackName(TASK_NAMES, taskRef),
            points: unpackScore(scoreRef),
            solved: solved === 1,
          }
        }),
      }
    })
    return { groups, scale }
  } catch {
    return null
  }
}
