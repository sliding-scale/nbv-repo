export default function PageHeading({ title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  )
}
