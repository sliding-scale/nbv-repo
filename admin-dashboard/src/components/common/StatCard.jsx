import { tones } from '../../config/tones'

/** tone: 'blue' | 'green' | 'gray' | 'amber' | 'red' | 'violet' */
export default function StatCard({ label, value, icon: Icon, tone = 'blue', hint }) {
  const t = tones[tone]
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-5 py-[18px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.82rem] font-medium text-slate-500">{label}</span>
        {Icon && (
          <span className={`grid size-[34px] shrink-0 place-items-center rounded-[9px] ${t.text} ${t.soft}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className="mt-1.5 text-3xl leading-tight font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}
