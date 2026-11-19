import { Eye, MapPin, Pencil, UserCheck, UserX } from 'lucide-react'
import Badge from '../common/Badge'

const th =
  'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 align-middle'
const muted = <span className="text-slate-400">Not assigned</span>

function IconButton({ label, onClick, icon: Icon, hover = 'hover:bg-slate-100 hover:text-slate-900' }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={`grid size-8 cursor-pointer place-items-center rounded-lg text-slate-500 ${hover}`}>
      <Icon size={16} />
    </button>
  )
}

function LocationCell({ location }) {
  if (!location) return <span className="text-xs font-medium text-amber-600">Not set</span>
  return (
    <span className="flex max-w-50 items-start gap-1" title={location.address}>
      <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
      <span className="truncate text-slate-700">{location.label || location.address}</span>
    </span>
  )
}

export default function StudentsTable({ students, parentsById, vehiclesById, onView, onEdit, onToggleStatus }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th}>Student</th>
            <th className={th}>Parents / guardians</th>
            <th className={th}>Vehicle</th>
            <th className={th}>Pickup</th>
            <th className={th}>Drop-off</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.map((s) => {
            const inactive = s.status === 'inactive'
            const parents = s.parentIds.map((id) => parentsById[id]).filter(Boolean)
            const vehicle = vehiclesById[s.vehicleId]
            return (
              <tr key={s.id} className={`hover:bg-slate-50 ${inactive ? 'bg-slate-50/60' : ''}`}>
                <td className={td}>
                  <button type="button" onClick={() => onView(s)} className="cursor-pointer text-left">
                    <div className={`font-semibold whitespace-nowrap hover:underline ${inactive ? 'text-slate-500' : 'text-slate-900'}`}>
                      {s.fullName}
                    </div>
                    <div className="font-mono text-xs whitespace-nowrap text-slate-500">{s.gsId}</div>
                  </button>
                </td>
                <td className={td}>
                  {parents.length === 0 ? (
                    <span className="text-xs font-medium text-amber-600">None</span>
                  ) : (
                    <span className="block max-w-45 truncate text-slate-700" title={parents.map((p) => `${p.fullName}${p.relationship ? ` (${p.relationship})` : ''}`).join('\n')}>
                      {parents.map((p) => p.fullName).join(', ')}
                    </span>
                  )}
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {vehicle ? <span className="text-slate-900">{vehicle.name}</span> : muted}
                </td>
                <td className={td}>
                  <LocationCell location={s.pickupLocation} />
                </td>
                <td className={td}>
                  <LocationCell location={s.dropoffLocation} />
                </td>
                <td className={td}>
                  <Badge tone={inactive ? 'gray' : 'green'}>{inactive ? 'Inactive' : 'Active'}</Badge>
                </td>
                <td className={td}>
                  <div className="flex justify-end gap-1">
                    <IconButton label="View" icon={Eye} onClick={() => onView(s)} />
                    <IconButton label="Edit" icon={Pencil} onClick={() => onEdit(s)} />
                    {inactive ? (
                      <IconButton label="Reactivate" icon={UserCheck} hover="hover:bg-green-50 hover:text-green-600" onClick={() => onToggleStatus(s)} />
                    ) : (
                      <IconButton label="Deactivate" icon={UserX} hover="hover:bg-red-50 hover:text-red-600" onClick={() => onToggleStatus(s)} />
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
