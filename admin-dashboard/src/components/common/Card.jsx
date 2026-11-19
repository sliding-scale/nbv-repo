export default function Card({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-xl border border-slate-200 bg-white ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-[18px]">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[0.8rem] text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="px-5 pt-4 pb-5">{children}</div>
    </section>
  )
}
