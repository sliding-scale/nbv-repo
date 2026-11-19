import { LoaderCircle } from 'lucide-react'
import Badge from '../common/Badge'
import EmptyState from '../common/EmptyState'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import useNow from '../../hooks/useNow'
import { formatClock, formatDuration, formatKm } from '../../utils/telemetry'
import TripPlace from './TripPlace'

const th =
  'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 align-middle'

const statusBadge = {
  in_progress: { label: 'On time', tone: 'green' },
  delayed: { label: 'Delayed', tone: 'amber' },
}

/** Trips with no ignition-OFF yet. Durations tick live; click a row for the vehicle's live card. */
export default function ActiveTripsPanel({ trips, vehiclesById, onSelectVehicle }) {
  const speedLimit = useSpeedLimit()
  const now = useNow()

  if (trips === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
        <LoaderCircle size={18} className="animate-spin" /> Loading active trips…
      </div>
    )
  }
  if (trips.length === 0) {
    return (
      <div className="p-8 text-center">
        <EmptyState>No trips are running right now. A trip starts when a van’s ignition turns on and its tracker reports.</EmptyState>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th}>Vehicle</th>
            <th className={th}>Started</th>
            <th className={th}>Running for</th>
            <th className={th}>Distance so far</th>
            <th className={th}>Speed now / top</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {trips.map((t) => {
            const vehicle = vehiclesById[t.vehicleId]
            const status = statusBadge[t.status] ?? statusBadge.in_progress
            const clickable = Boolean(vehicle)
            return (
              <tr
                key={t._id}
                onClick={clickable ? () => onSelectVehicle(vehicle) : undefined}
                className={`hover:bg-slate-50 ${clickable ? 'cursor-pointer' : ''}`}
                title={clickable ? 'Open vehicle details' : undefined}
              >
                <td className={td}>
                  <div className="font-semibold whitespace-nowrap text-slate-900">{vehicle?.name ?? 'Deleted vehicle'}</div>
                  <div className="text-xs whitespace-nowrap text-slate-500">
                    {[vehicle?.registrationNumber, t.type].filter(Boolean).join(' · ')}
                  </div>
                </td>
                <td className={td}>
                  <div className="whitespace-nowrap text-slate-900 tabular-nums">{formatClock(t.startedAt)}</div>
                  <div className="text-xs" onClick={(e) => e.stopPropagation()}>
                    <TripPlace point={t.startLocation} />
                  </div>
                </td>
                <td className={`${td} font-medium whitespace-nowrap text-blue-700 tabular-nums`}>{formatDuration(now - t.startedAt)}</td>
                <td className={`${td} whitespace-nowrap text-slate-900 tabular-nums`}>{formatKm(t.distanceKm)}</td>
                <td className={`${td} whitespace-nowrap tabular-nums`}>
                  <span className={vehicle?.speed > speedLimit ? 'font-semibold text-red-600' : 'text-slate-900'}>{vehicle?.speed ?? 0}</span>
                  <span className="text-slate-400"> / </span>
                  <span className={t.maxSpeed > speedLimit ? 'font-semibold text-red-600' : 'text-slate-700'}>{Math.round(t.maxSpeed)}</span>
                  <span className="text-xs text-slate-500"> km/h</span>
                </td>
                <td className={td}>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
