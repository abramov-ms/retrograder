import Papa from 'papaparse'
import type { Student } from './types'

export interface CsvImportResult {
  students: Student[]
  skipped: number
  errors: string[]
}

function parseScore(raw: string): number | null {
  const value = Number(raw.trim().replace(',', '.'))
  return Number.isFinite(value) ? value : null
}

// Expects the nickname in the first column and the total score in the last
// one, so both "nickname,score" and legacy "nickname,name,score" files work.
// A header row is detected by a non-numeric last column. Bad rows are
// skipped and reported, not fatal.
export function parseStudentsCsv(text: string): CsvImportResult {
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
  const students: Student[] = []
  const errors: string[] = []

  parsed.data.forEach((row, index) => {
    if (row.length < 2) {
      errors.push(`row ${index + 1}: expected at least 2 columns, got ${row.length}`)
      return
    }
    const score = parseScore(row[row.length - 1])
    if (score === null) {
      if (index === 0) return // header row
      errors.push(`row ${index + 1}: score "${row[row.length - 1]}" is not a number`)
      return
    }
    students.push({ nickname: row[0].trim(), score })
  })

  return { students, skipped: errors.length, errors }
}
