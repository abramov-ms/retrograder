import { useLayoutEffect, useRef, useState } from 'react'
import { gradeFor, moveThreshold, nearestThreshold } from '../model/grading'
import { MIN_GRADE } from '../model/types'
import type { GradingScale } from '../model/types'

// Grade quality bands: 3-4 okay, 5-7 good, 8-10 excellent.
function knobBand(grade: number): string {
  if (grade >= 8) return 'knob-excellent'
  if (grade >= 5) return 'knob-good'
  return 'knob-okay'
}

interface Props {
  scale: GradingScale
  // Live update while a knob moves; onCommit marks the undo boundary when
  // the knob is dropped (pointer up) or the arrow keys are released.
  onChange: (scale: GradingScale) => void
  onCommit: () => void
  // Top end of the track: the course's total points (derived from the tasks).
  maxPoints: number
  // Current what-if total; shown as a marker on the track.
  score: number
}

export function ScaleEditor({ scale, onChange, onCommit, maxPoints, score }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const knobRefs = useRef<(HTMLDivElement | null)[]>([])
  const draggingIndex = useRef<number | null>(null)
  // The incoming scale is already clamped to maxPoints (see clampScale in
  // App); 10 is a floor so an empty task list still renders a usable track.
  const sliderMax = Math.max(10, maxPoints)

  // The track fills the panel's free height, so measure it for the label
  // collision math below. The synchronous measure in the layout effect runs
  // before the browser paints, so the first frame already uses the real
  // height; the observer keeps it current on window resizes.
  const [trackHeight, setTrackHeight] = useState(480)
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setTrackHeight(track.getBoundingClientRect().height)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  // Vertical track: 0 points at the bottom, sliderMax at the top.
  const percentFromTop = (value: number) => (1 - value / sliderMax) * 100

  const valueAtY = (clientY: number) => {
    const rect = trackRef.current!.getBoundingClientRect()
    return ((rect.bottom - clientY) / rect.height) * sliderMax
  }

  const nudge = (index: number, delta: number) => {
    onChange(moveThreshold(scale, index, scale[index] + delta, sliderMax))
  }

  // Knobs too close to the one below spread into side-by-side columns
  // (lowest grade leftmost), so stacked knobs stay visible and grabbable.
  const knobColumns: number[] = []
  scale.forEach((threshold, index) => {
    const gapPx = index > 0 ? ((threshold - scale[index - 1]) / sliderMax) * trackHeight : Infinity
    knobColumns.push(gapPx < 28 ? knobColumns[index - 1] + 1 : 0)
  })

  // Labels of a colliding cluster sit right of that cluster's own rightmost
  // knob. Keying this off the local cluster (not the global max column) keeps
  // a drag's visual effect local: labels of unrelated knobs never move.
  const clusterMaxColumn: number[] = new Array<number>(scale.length).fill(0)
  let clusterStart = 0
  for (let i = 1; i <= scale.length; i++) {
    if (i === scale.length || knobColumns[i] === 0) {
      const max = Math.max(...knobColumns.slice(clusterStart, i))
      for (let j = clusterStart; j < i; j++) clusterMaxColumn[j] = max
      clusterStart = i
    }
  }

  // Equal thresholds share a spot (they read as a single number); near-equal
  // ones shift into a further column to stay legible.
  const labelColumns: number[] = []
  scale.forEach((threshold, index) => {
    const gap = index > 0 ? threshold - scale[index - 1] : Infinity
    const gapPx = (gap / sliderMax) * trackHeight
    labelColumns.push(gap === 0 ? labelColumns[index - 1] : gapPx < 16 ? labelColumns[index - 1] + 1 : 0)
  })

  return (
    <section className="panel scale-panel">
      <h2>Grading scale</h2>
      <p className="hint">Drag anywhere on the track to move the nearest knob.</p>
      <div className="slider-end">{sliderMax}</div>
      {/* One drag surface for the whole editor: pressing anywhere grabs the
          nearest knob, so there is no small hitbox to aim at. Knob centers
          live in this box's 0-100% range; the visual track extends one
          knob-radius beyond it on each side. */}
      <div
        ref={trackRef}
        className="multi-slider"
        onPointerDown={(e) => {
          e.preventDefault() // no text selection, no native image drag
          const value = valueAtY(e.clientY)
          const index = nearestThreshold(scale, value)
          draggingIndex.current = index
          e.currentTarget.setPointerCapture(e.pointerId)
          knobRefs.current[index]?.focus()
          onChange(moveThreshold(scale, index, value, sliderMax))
        }}
        onPointerMove={(e) => {
          if (draggingIndex.current !== null) {
            onChange(moveThreshold(scale, draggingIndex.current, valueAtY(e.clientY), sliderMax))
          }
        }}
        onPointerUp={() => {
          draggingIndex.current = null
          onCommit()
        }}
        onPointerCancel={() => {
          draggingIndex.current = null
          onCommit()
        }}
      >
        <div className="multi-slider-hitbox" />
        <div className="multi-slider-track" />
        {/* Where the currently selected tasks land on the scale. */}
        <div className="score-marker" style={{ top: `${percentFromTop(Math.min(score, sliderMax))}%` }}>
          <div className="score-marker-arrow" />
          <div className="score-marker-text">
            {score} pts
            <br />
            grade {gradeFor(score, scale)}
          </div>
        </div>
        <div
          className="slider-knob slider-knob-fixed"
          style={{ top: '100%', zIndex: 0 }}
          title={`Grade ${MIN_GRADE}: any score`}
        >
          {MIN_GRADE}
        </div>
        {scale.map((threshold, index) => (
          <div
            key={index}
            ref={(el) => {
              knobRefs.current[index] = el
            }}
            role="slider"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label={`Minimum points for grade ${MIN_GRADE + 1 + index}`}
            aria-valuemin={index > 0 ? scale[index - 1] : 0}
            aria-valuemax={index < scale.length - 1 ? scale[index + 1] : sliderMax}
            aria-valuenow={threshold}
            className={`slider-knob ${knobBand(MIN_GRADE + 1 + index)}`}
            style={{
              top: `${percentFromTop(threshold)}%`,
              left: 13 + knobColumns[index] * 30,
              // Lower grades in front where columns still partially overlap:
              // grabbing a stack from below moves the lowest grade first.
              zIndex: scale.length - index,
            }}
            // Pressing a specific knob drags that knob, even when several sit
            // beside each other at (nearly) the same points value.
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              draggingIndex.current = index
              trackRef.current?.setPointerCapture(e.pointerId)
              knobRefs.current[index]?.focus()
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault()
                nudge(index, e.shiftKey ? -5 : -1)
              }
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault()
                nudge(index, e.shiftKey ? 5 : 1)
              }
            }}
            // Nudges are previews; releasing the key marks the undo boundary,
            // so holding an arrow key is a single history entry.
            onKeyUp={onCommit}
          >
            {MIN_GRADE + 1 + index}
            <span
              className="slider-value"
              style={{ left: 34 + (clusterMaxColumn[index] - knobColumns[index]) * 30 + labelColumns[index] * 30 }}
            >
              {threshold}
            </span>
          </div>
        ))}
      </div>
      <div className="slider-end">0</div>
    </section>
  )
}
