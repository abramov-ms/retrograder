import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { gradeHistogram } from '../model/grading'
import type { GradingScale, Student } from '../model/types'

interface Props {
  students: Student[]
  scale: GradingScale
}

export function GradeHistogram({ students, scale }: Props) {
  const data = gradeHistogram(students, scale)

  return (
    <section className="panel">
      <h2>Grade histogram</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="grade" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(count) => [count, 'students']} labelFormatter={(grade) => `Grade ${grade}`} />
          <Bar dataKey="count" fill="#66cda3" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
