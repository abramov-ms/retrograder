import { describe, expect, it } from 'vitest'
import { parseStudentsCsv } from './csv'

describe('parseStudentsCsv', () => {
  it('parses two-column rows without a header', () => {
    const result = parseStudentsCsv('ada,95\nalan,88\n')
    expect(result.students).toEqual([
      { nickname: 'ada', score: 95 },
      { nickname: 'alan', score: 88 },
    ])
    expect(result.skipped).toBe(0)
  })

  it('skips a header row', () => {
    const result = parseStudentsCsv('nickname,score\nada,95\n')
    expect(result.students).toEqual([{ nickname: 'ada', score: 95 }])
    expect(result.skipped).toBe(0)
  })

  it('handles semicolon-separated files and decimal commas', () => {
    const result = parseStudentsCsv('ada;95,5\nalan;88\n')
    expect(result.students).toEqual([
      { nickname: 'ada', score: 95.5 },
      { nickname: 'alan', score: 88 },
    ])
  })

  it('accepts legacy files with extra middle columns, taking the last as score', () => {
    const result = parseStudentsCsv('nickname,name,score\nada,"Lovelace, Ada",95\nalan,Alan Turing,88\n')
    expect(result.students).toEqual([
      { nickname: 'ada', score: 95 },
      { nickname: 'alan', score: 88 },
    ])
  })

  it('collects errors for bad rows instead of failing', () => {
    const result = parseStudentsCsv('ada,95\nbrokenrow\nalan,oops\n')
    expect(result.students).toHaveLength(1)
    expect(result.skipped).toBe(2)
    expect(result.errors[0]).toContain('row 2')
    expect(result.errors[1]).toContain('row 3')
  })
})
