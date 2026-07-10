import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from './chartTheme'
import { ecdfPoints } from '../model/grading'
import { MIN_GRADE } from '../model/types'
import type { GradingScale, Student } from '../model/types'

interface Props {
  students: Student[]
  scale: GradingScale
  // Current what-if total: drawn as a vertical marker so the supposed
  // student can be compared against the cohort.
  score: number
}

export function EcdfChart({ students, scale, score }: Props) {
  const points = ecdfPoints(students)
  if (points.length === 0) return null

  const minScore = Math.min(points[0].score, 0, ...scale)
  const maxScore = Math.max(points[points.length - 1].score, ...scale, score)
  // The ECDF is 0 before the lowest score; anchor the step line there.
  const data = [{ score: minScore, fraction: 0 }, ...points]

  return (
    <section className="panel">
      <h2>Score ECDF</h2>
      <p className="hint">Fraction of students with at most a given score; vertical lines are grade thresholds.</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="score" type="number" domain={[minScore, maxScore]} />
          <YAxis domain={[0, 1]} tickFormatter={(f: number) => `${Math.round(f * 100)}%`} />
          <Tooltip
            formatter={(fraction) => [`${(Number(fraction) * 100).toFixed(1)}%`, 'of students ≤']}
            labelFormatter={(score) => `Score ${score}`}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ stroke: 'var(--border)' }}
          />
          {scale.map((threshold, index) => (
            <ReferenceLine
              key={index}
              x={threshold}
              stroke="#f0ad4e"
              strokeDasharray="4 4"
              label={{ value: String(MIN_GRADE + 1 + index), position: 'top', fill: '#f0ad4e', fontSize: 12 }}
            />
          ))}
          <ReferenceLine
            x={score}
            stroke="#17c3b2"
            strokeWidth={2}
            label={{ value: 'me', position: 'top', fill: '#17c3b2', fontSize: 12 }}
          />
          <Line type="stepAfter" dataKey="fraction" stroke="#4caf50" dot={false} strokeWidth={2} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
