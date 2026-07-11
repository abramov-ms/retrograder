// Shared-URL dictionaries: known names and common scores are encoded as
// indices into these tables, so typical links stay short.
//
// APPEND-ONLY: the indices are baked into previously shared URLs. Never
// remove, reorder, or edit entries — only append new ones at the end.
// (A value missing here still works: it is encoded as a literal.)

export const GROUP_NAMES: readonly string[] = [
  '01-data-representation',
  '01-data-representation-bonus',
  '02-files',
  '03-asm-1',
  '04-asm-2',
  '04-asm-2-bonus',
  '05-memory',
  '06-processes',
  '07-synchronization-basics',
  '08-interprocess-communication',
  '09-networks',
  '15-bonus',
]

export const TASK_NAMES: readonly string[] = [
  'ieee754-clf',
  'bloom-filter',
  'utf8-file',
  'float-mul',
  'float-next-prev',
  'float-add',
  'float-div',
  'float-string',
  'fs-utils',
  'persistent-storage',
  'same-file',
  'tailf',
  'linked-list',
  'asm-add',
  'asm-add-scanf',
  'asm-memcpy',
  'asm-scalar-product',
  'asm-add-AArch64',
  'asm-add-scanf-AArch64',
  'asm-1d-dp',
  'we-have-compiler-at-home',
  'linked-list-2',
  'file-allocator',
  'minigrep',
  'proc-chain',
  'proc-lca',
  'lockfree-stack',
  'userspace-signalfd',
  'integral',
  'file-watcher',
  'kv-server',
  'broken-echo',
]

// Common task costs; the most frequent ones first (single-digit indices).
export const SCORES: readonly number[] = [
  50, 75, 100, 125, 150, 200, 25, 250, 300, 10, 20, 30, 40, 60, 70, 80, 90, 110, 120, 130, 140, 160, 170, 175,
  180, 190, 225, 275, 350, 400, 450, 500,
]

const indexOf = (values: readonly (string | number)[]) => new Map(values.map((value, index) => [value, index]))

export const GROUP_NAME_INDEX = indexOf(GROUP_NAMES)
export const TASK_NAME_INDEX = indexOf(TASK_NAMES)
export const SCORE_INDEX = indexOf(SCORES)
