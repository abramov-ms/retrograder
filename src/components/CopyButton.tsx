import { useState } from 'react'

interface Props {
  // The exact text to copy; also shown in the hover tooltip unless the
  // preview is disabled (long texts would need scrollbars).
  text: string
  label: string
  preview?: boolean
}

// A copy-to-clipboard button with a chart-tooltip-styled preview of the text;
// the icon briefly turns into a check mark after copying.
export function CopyButton({ text, label, preview = true }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // No clipboard access (e.g. plain-http host): let the user copy manually.
      window.prompt('Copy:', text)
    }
  }

  return (
    <div className="copy-anchor">
      <button className={copied ? 'copy-button copied' : 'copy-button'} aria-label={label} title={label} onClick={copy} />
      {preview && <div className="copy-tooltip">{text}</div>}
    </div>
  )
}
