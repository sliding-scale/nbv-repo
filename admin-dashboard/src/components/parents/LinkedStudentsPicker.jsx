import { useState } from 'react'
import { Search, X } from 'lucide-react'

const guardianCount = (s) =>
  s.parentIds.length > 0 ? `${s.parentIds.length} ${s.parentIds.length === 1 ? 'guardian' : 'guardians'}` : null

/**
 * Search-and-tick list of students. `getMeta(student, selected)` returns a short note shown
 * on the right of each row (defaults to the number of guardians).
 */
export default function LinkedStudentsPicker({ students, selectedIds, onChange, getMeta = (s, selected) => (selected ? null : guardianCount(s)) }) {
  const [query, setQuery] = useState('')
  const selected = new Set(selectedIds)
  const byId = Object.fromEntries(students.map((s) => [s.id, s]))

  const q = query.trim().toLowerCase()
  const visible = q ? students.filter((s) => `${s.fullName} ${s.gsId}`.toLowerCase().includes(q)) : students

  const toggle = (id) => onChange(selected.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 p-2">
          {selectedIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-100 py-0.5 pr-1 pl-2.5 text-xs font-medium text-blue-700">
              {byId[id]?.fullName ?? 'Unknown student'}
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-label={`Remove ${byId[id]?.fullName}`}
                className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-blue-200"
              >
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
          placeholder="Search students by name or GS ID…"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <span className="text-xs whitespace-nowrap text-slate-500">{selectedIds.length} selected</span>
      </div>

      <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto">
        {visible.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-400">No students found</li>}
        {visible.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
              <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="size-4 accent-blue-600" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-900">
                  {s.fullName}
                  {s.status === 'inactive' && <span className="ml-1.5 text-xs text-slate-400">(inactive)</span>}
                </span>
                <span className="block text-xs text-slate-500">
                  {s.gsId}
                  {s.grade && ` · ${s.grade}`}
                </span>
              </span>
              {getMeta(s, selected.has(s.id)) && (
                <span className={`text-xs whitespace-nowrap ${selected.has(s.id) ? 'text-amber-600' : 'text-slate-400'}`}>
                  {getMeta(s, selected.has(s.id))}
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
