/** Underline tabs. `tabs` = [{ id, label, count? }]. */
export default function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-slate-200">
      {tabs.map((t) => {
        const selected = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`panel-${t.id}`}
            onClick={() => onChange(t.id)}
            className={`-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
              selected ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
            {t.count != null && (
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${selected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
