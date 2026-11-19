import { Activity, Eye, EyeOff, Pencil, Power, PowerOff, Trash2 } from 'lucide-react'
import Badge from '../common/Badge'
import { vehicleTrackingLabel } from '../../utils/tracking'

const th =
  'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 align-middle'

function IconButton({ label, onClick, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    danger: 'text-slate-500 hover:bg-red-50 hover:text-red-600',
    success: 'text-slate-500 hover:bg-green-50 hover:text-green-600',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid size-8 cursor-pointer place-items-center rounded-lg ${tones[tone]}`}
    >
      <Icon size={16} />
    </button>
  )
}

export default function VehiclesTable({ vehicles, studentsById, onView, onEdit, onToggleStatus, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th}>Vehicle</th>
            <th className={th}>Registration</th>
            <th className={th}>Driver</th>
            <th className={th}>Students</th>
            <th className={th}>Status</th>
            <th className={th}>Parent tracking</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vehicles.map((v) => {
            const inactive = v.status === 'inactive'
            const studentNames = v.studentIds.map((id) => studentsById[id]?.fullName).filter(Boolean)
            return (
              <tr key={v.id} className={`hover:bg-slate-50 ${inactive ? 'bg-slate-50/60' : ''}`}>
                <td className={td}>
                  <button
                    type="button"
                    onClick={() => onView(v)}
                    title="Open vehicle details"
                    className={`cursor-pointer font-semibold whitespace-nowrap hover:text-blue-600 hover:underline ${inactive ? 'text-slate-500' : 'text-slate-900'}`}
                  >
                    {v.name}
                  </button>
                  <div className="text-xs whitespace-nowrap text-slate-500">{v.model || '—'}</div>
                </td>
                <td className={`${td} whitespace-nowrap text-slate-900 tabular-nums`}>{v.registrationNumber}</td>
                <td className={`${td} whitespace-nowrap`}>
                  {v.driverName ? <span className="text-slate-900">{v.driverName}</span> : <span className="text-slate-400">Not set</span>}
                </td>
                <td className={td}>
                  {studentNames.length > 0 ? (
                    <span className="cursor-default text-slate-900 tabular-nums" title={studentNames.join('\n')}>
                      {studentNames.length} {studentNames.length === 1 ? 'student' : 'students'}
                    </span>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </td>
                <td className={td}>
                  <Badge tone={inactive ? 'gray' : 'green'}>{inactive ? 'Inactive' : 'Active'}</Badge>
                </td>
                <td className={td}>
                  <Badge tone={vehicleTrackingLabel(v.parentTracking).tone}>
                    {v.parentTracking.visible ? <Eye size={12} /> : <EyeOff size={12} />} {vehicleTrackingLabel(v.parentTracking).label}
                  </Badge>
                </td>
                <td className={td}>
                  <div className="flex justify-end gap-1">
                    <IconButton label="View details" icon={Activity} onClick={() => onView(v)} />
                    <IconButton label="Edit" icon={Pencil} onClick={() => onEdit(v)} />
                    {inactive ? (
                      <IconButton label="Activate" icon={Power} tone="success" onClick={() => onToggleStatus(v)} />
                    ) : (
                      <IconButton label="Deactivate" icon={PowerOff} onClick={() => onToggleStatus(v)} />
                    )}
                    <IconButton label="Delete" icon={Trash2} tone="danger" onClick={() => onDelete(v)} />
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
