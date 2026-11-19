import { Pencil, ShieldCheck, ShieldOff } from 'lucide-react'
import Badge from '../common/Badge'
import { parentStatuses } from '../../config/parentStatus'
import { statusSince } from '../../utils/parents'

const th =
  'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 align-middle'

function IconButton({ label, onClick, icon: Icon, hover }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={`grid size-8 cursor-pointer place-items-center rounded-lg text-slate-500 ${hover}`}>
      <Icon size={16} />
    </button>
  )
}

function trackingStatus(parent, schedule) {
  if (parent.status === 'deactivated') return 'No access'
  if (schedule?.enabled === false || schedule?.reason === 'forced_off') return 'Tracking off'
  if (schedule?.open !== true) return 'Off outside school hours'
  if (parent.parentTracking?.vanCount > 0 && parent.parentTracking.visibleVanCount === 0) return 'On, but van has tracking off'
  return 'Visible'
}

export default function ParentsTable({ parents, studentsById, schedule, onEdit, onDeactivate, onReactivate }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th}>Parent</th>
            <th className={th}>Contact number</th>
            <th className={th}>Associated students</th>
            <th className={th}>Parent tracking</th>
            <th className={th}>Account status</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {parents.map((p) => {
            const status = parentStatuses[p.status]
            const deactivated = p.status === 'deactivated'
            const children = p.studentIds.map((id) => studentsById[id]).filter(Boolean)
            return (
              <tr key={p.id} className={`hover:bg-slate-50 ${deactivated ? 'bg-slate-50/60' : ''}`}>
                <td className={td}>
                  <div className={`font-semibold whitespace-nowrap ${deactivated ? 'text-slate-500' : 'text-slate-900'}`}>
                    {p.fullName}
                    {p.relationship && <span className="ml-1.5 text-xs font-normal text-slate-400">{p.relationship}</span>}
                  </div>
                  <div className="text-xs whitespace-nowrap text-slate-500">{p.email}</div>
                </td>
                <td className={`${td} whitespace-nowrap text-slate-700 tabular-nums`}>
                  {p.phone || <span className="text-slate-400">—</span>}
                </td>
                <td className={td}>
                  {children.length === 0 ? (
                    <span className="text-xs font-medium text-amber-600">None linked</span>
                  ) : (
                    <div className="flex max-w-80 flex-wrap gap-1">
                      {children.map((s) => (
                        <span key={s.id} title={s.gsId} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs whitespace-nowrap text-slate-700">
                          {s.fullName}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className={`${td} text-xs whitespace-nowrap ${trackingStatus(p, schedule) === 'Visible' ? 'text-slate-700' : 'text-slate-400'}`}>
                  {trackingStatus(p, schedule)}
                </td>
                <td className={td}>
                  <Badge tone={status.tone}>{status.label}</Badge>
                  {statusSince(p) && <div className="mt-0.5 text-xs whitespace-nowrap text-slate-400">{statusSince(p)}</div>}
                </td>
                <td className={td}>
                  <div className="flex justify-end gap-1">
                    <IconButton label="Edit" icon={Pencil} hover="hover:bg-slate-100 hover:text-slate-900" onClick={() => onEdit(p)} />
                    {deactivated ? (
                      <IconButton label="Reactivate access" icon={ShieldCheck} hover="hover:bg-green-50 hover:text-green-600" onClick={() => onReactivate(p)} />
                    ) : (
                      <IconButton label="Deactivate access" icon={ShieldOff} hover="hover:bg-red-50 hover:text-red-600" onClick={() => onDeactivate(p)} />
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
