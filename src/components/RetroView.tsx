import { CsvImport } from './CsvImport'
import { EcdfChart } from './EcdfChart'
import { GradeHistogram } from './GradeHistogram'
import { ScaleEditor } from './ScaleEditor'
import type { GradingScale, Student } from '../model/types'

interface Props {
  students: Student[]
  onStudentsChange: (students: Student[]) => void
  scale: GradingScale
  onScaleChange: (scale: GradingScale) => void
  // Total points of the course, derived from the task list in App.
  maxPoints: number
}

export function RetroView({ students, onStudentsChange, scale, onScaleChange, maxPoints }: Props) {
  return (
    <div className="split-view">
      <div className="split-left">
        <CsvImport studentCount={students.length} onImport={onStudentsChange} />
        {students.length > 0 && (
          <>
            <GradeHistogram students={students} scale={scale} />
            <EcdfChart students={students} scale={scale} />
          </>
        )}
      </div>
      <div className="split-right">
        <ScaleEditor scale={scale} onChange={onScaleChange} maxPoints={maxPoints} />
      </div>
    </div>
  )
}
