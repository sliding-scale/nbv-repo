import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

/**
 * Checkbox list of students. Students already on another van can still be picked;
 * saving moves them to this van (shown as a warning next to their name).
 */
export default function StudentPicker({ students, selectedIds, onChange, ownerByStudentId, currentVehicleId }) {
  const [query, setQuery] = useState('')
  const selected = useMemo(() => new Set(selectedIds), [selectedIds])

  const q = query.trim().toLowerCase()
  const visible = q
    ? students.filter((s) => `${s.fullName} ${s.gsId} ${s.grade}`.toLowerCase().includes(q))
    : students

  const toggle = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3">
        <Search size={14} className="text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students…"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <span className="text-xs whitespace-nowrap text-slate-500">{selected.size} selected</span>
      </div>

      <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
        {visible.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-400">No students found</li>}
        {visible.map((student) => {
          const owner = ownerByStudentId[student.id]
          const onOtherVan = owner && owner.id !== currentVehicleId
          const checked = selected.has(student.id)
          return (
            <li key={student.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(student.id)}
                  className="size-4 accent-blue-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-900">
                    {student.fullName}
                    {student.status === 'inactive' && <span className="ml-1.5 text-xs text-slate-400">(inactive)</span>}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {student.gsId} · {student.grade}
                  </span>
                </span>
                {onOtherVan && (
                  <span className={`text-xs whitespace-nowrap ${checked ? 'text-amber-600' : 'text-slate-400'}`}>
                    {checked ? `Moves from ${owner.name}` : `On ${owner.name}`}
                  </span>
                )}
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
