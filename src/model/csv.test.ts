import { describe, expect, it } from 'vitest'
import { parseStudentsCsv } from './csv'

describe('parseStudentsCsv', () => {
  it('parses comma-separated rows without a header', () => {
    const result = parseStudentsCsv('ada,Ada Lovelace,95\nalan,Alan Turing,88\n')
    expect(result.students).toEqual([
      { nickname: 'ada', name: 'Ada Lovelace', score: 95 },
      { nickname: 'alan', name: 'Alan Turing', score: 88 },
    ])
    expect(result.skipped).toBe(0)
  })

  it('skips a header row', () => {
    const result = parseStudentsCsv('nickname,name,score\nada,Ada Lovelace,95\n')
    expect(result.students).toEqual([{ nickname: 'ada', name: 'Ada Lovelace', score: 95 }])
    expect(result.skipped).toBe(0)
  })

  it('handles semicolon-separated files and decimal commas', () => {
    const result = parseStudentsCsv('ada;Ada Lovelace;95,5\nalan;Alan Turing;88\n')
    expect(result.students).toEqual([
      { nickname: 'ada', name: 'Ada Lovelace', score: 95.5 },
      { nickname: 'alan', name: 'Alan Turing', score: 88 },
    ])
  })

  it('handles quoted fields containing the delimiter', () => {
    const result = parseStudentsCsv('ada,"Lovelace, Ada",95\n')
    expect(result.students).toEqual([{ nickname: 'ada', name: 'Lovelace, Ada', score: 95 }])
  })

  it('collects errors for bad rows instead of failing', () => {
    const result = parseStudentsCsv('ada,Ada Lovelace,95\nbroken row\nalan,Alan Turing,oops\n')
    expect(result.students).toHaveLength(1)
    expect(result.skipped).toBe(2)
    expect(result.errors[0]).toContain('row 2')
    expect(result.errors[1]).toContain('row 3')
  })
})
