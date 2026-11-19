import { tones } from '../../config/tones'

/** tone: 'green' | 'gray' | 'amber' | 'red' | 'blue' | 'violet' */
export default function Badge({ tone = 'gray', children }) {
  const t = tones[tone]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold whitespace-nowrap ${t.text} ${t.soft}`}
    >
      {children}
    </span>
  )
}
