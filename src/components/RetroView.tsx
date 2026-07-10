import { CsvImport } from './CsvImport'
import { EcdfChart } from './EcdfChart'
import { GradeHistogram } from './GradeHistogram'
import type { GradingScale, Student } from '../model/types'

interface Props {
  students: Student[]
  onStudentsChange: (students: Student[]) => void
  scale: GradingScale
}

// The left column of retro mode; the split view and the shared ScaleEditor
// live in App so the editor survives tab switches.
export function RetroView({ students, onStudentsChange, scale }: Props) {
  return (
    <>
      <CsvImport studentCount={students.length} onImport={onStudentsChange} />
      {students.length > 0 && (
        <>
          <GradeHistogram students={students} scale={scale} />
          <EcdfChart students={students} scale={scale} />
        </>
      )}
    </>
  )
}
