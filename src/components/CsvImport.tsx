import { useRef, useState } from 'react'
import { parseStudentsCsv } from '../model/csv'
import type { Student } from '../model/types'

interface Props {
  studentCount: number
  onImport: (students: Student[]) => void
}

export function CsvImport({ studentCount, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)

  const importFile = async (file: File) => {
    const result = parseStudentsCsv(await file.text())
    onImport(result.students)
    setSummary(
      `Imported ${result.students.length} students from ${file.name}` +
        (result.skipped > 0 ? `, ${result.skipped} rows skipped` : ''),
    )
    setErrors(result.errors)
  }

  return (
    <section className="panel">
      <h2>Last year's results</h2>
      <div
        className={`dropzone${dragOver ? ' dropzone-active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files[0]
          if (file) importFile(file)
        }}
      >
        <p>
          Drop a CSV file here or{' '}
          <button className="link-button" onClick={() => fileInput.current?.click()}>
            choose a file
          </button>
        </p>
        <p className="hint">Columns: nickname, name, total score (header optional)</p>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) importFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {summary ? (
        <p className="hint">{summary}</p>
      ) : (
        studentCount > 0 && <p className="hint">{studentCount} students loaded.</p>
      )}
      {errors.length > 0 && (
        <details className="warning">
          <summary>{errors.length} rows skipped</summary>
          <ul>
            {errors.slice(0, 20).map((error) => (
              <li key={error}>{error}</li>
            ))}
            {errors.length > 20 && <li>… and {errors.length - 20} more</li>}
          </ul>
        </details>
      )}
    </section>
  )
}
