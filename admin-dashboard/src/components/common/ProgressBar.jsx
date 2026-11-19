import { tones } from '../../config/tones'

export default function ProgressBar({ value, tone = 'blue', className = '' }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${tones[tone].solid}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}
