// Small building blocks shared by the vehicle-details sections.

export function Section({ icon: Icon, title, aside, children }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="grid size-7 place-items-center rounded-lg bg-slate-100 text-slate-600">
            <Icon size={15} />
          </span>
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </section>
  )
}

export function Stat({ label, value, hint, emphasis }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${emphasis ?? 'text-slate-900'}`}>{value}</div>
      {hint && <div className="truncate text-xs text-slate-400">{hint}</div>}
    </div>
  )
}

export const StatGrid = ({ children }) => <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{children}</div>
