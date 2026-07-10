import type { CSSProperties } from 'react'

// Recharts styles its default tooltip inline with a white background, which
// clashes with the dark theme; these props re-anchor it to the app palette.
export const tooltipContentStyle: CSSProperties = {
  backgroundColor: 'var(--panel-bg)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontFamily: 'inherit',
}

export const tooltipLabelStyle: CSSProperties = { color: 'var(--text-h)' }

export const tooltipItemStyle: CSSProperties = { color: 'var(--text)' }
