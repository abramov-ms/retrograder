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

// Expects rows of >= 3 columns: nickname, name, total score. A header row is
// detected by its third column not being numeric. Bad rows are skipped and
// reported, not fatal.
export function parseStudentsCsv(text: string): CsvImportResult {
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
  const students: Student[] = []
  const errors: string[] = []

  parsed.data.forEach((row, index) => {
    if (row.length < 3) {
      errors.push(`row ${index + 1}: expected at least 3 columns, got ${row.length}`)
      return
    }
    const score = parseScore(row[2])
    if (score === null) {
      if (index === 0) return // header row
      errors.push(`row ${index + 1}: score "${row[2]}" is not a number`)
      return
    }
    students.push({ nickname: row[0].trim(), name: row[1].trim(), score })
  })

  return { students, skipped: errors.length, errors }
}
