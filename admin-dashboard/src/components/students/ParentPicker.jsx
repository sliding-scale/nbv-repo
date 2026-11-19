import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { parentStatuses } from '../../config/parentStatus'

/** Search-and-tick list for associating parents/guardians with a student. */
export default function ParentPicker({ parents, selectedIds, onChange }) {
  const [query, setQuery] = useState('')
  const selected = new Set(selectedIds)
  const byId = Object.fromEntries(parents.map((p) => [p.id, p]))

  const q = query.trim().toLowerCase()
  const visible = q ? parents.filter((p) => `${p.fullName} ${p.email} ${p.phone}`.toLowerCase().includes(q)) : parents

  const toggle = (id) => onChange(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 p-2">
          {selectedIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-100 py-0.5 pr-1 pl-2.5 text-xs font-medium text-blue-700">
              {byId[id]?.fullName ?? 'Unknown'}
              <button type="button" onClick={() => toggle(id)} aria-label={`Remove ${byId[id]?.fullName}`} className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-blue-200">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3">
        <Search size={14} className="text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search parents by name, email or phone…"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto">
        {visible.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-400">No parents found</li>}
        {visible.map((p) => (
          <li key={p.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} className="size-4 accent-blue-600" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-900">
                  {p.fullName}
                  {p.relationship && <span className="text-slate-400"> · {p.relationship}</span>}
                </span>
                <span className="block truncate text-xs text-slate-500">{p.email}</span>
              </span>
              {p.status !== 'active' && (
                <span className="text-xs whitespace-nowrap text-slate-400">{parentStatuses[p.status].label}</span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
