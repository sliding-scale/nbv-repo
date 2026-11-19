import Card from '../common/Card'
import CardLink from '../common/CardLink'
import Badge from '../common/Badge'
import EmptyState from '../common/EmptyState'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import { timeAgo } from '../../utils/dashboard'
import { formatKm } from '../../utils/telemetry'

const tripStatus = {
  in_progress: { label: 'On time', tone: 'green' },
  delayed: { label: 'Delayed', tone: 'amber' },
}

const th =
  'whitespace-nowrap border-y border-slate-200 bg-slate-50 px-5 py-2.5 text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase'
const td = 'px-5 py-3 align-middle'
const primary = 'font-semibold whitespace-nowrap text-slate-900'
const secondary = 'text-xs whitespace-nowrap text-slate-500'

export default function ActiveTripsTable({ trips, vehiclesById }) {
  const speedLimit = useSpeedLimit()
  return (
    <Card
      title="Active trips"
      subtitle={`${trips.length} vans currently on a trip`}
      action={<CardLink to="/trips">View all</CardLink>}
    >
      {trips.length === 0 ? (
        <EmptyState>No trips are running right now. Trips appear here once vehicle trackers start reporting.</EmptyState>
      ) : (
        <div className="-mx-5 -mb-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Vehicle</th>
                <th className={th}>Started</th>
                <th className={th}>Distance so far</th>
                <th className={th}>High speed</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {trips.map((trip) => {
                const vehicle = vehiclesById[trip.vehicleId]
                const status = tripStatus[trip.status]
                return (
                  <tr key={trip.id} className="hover:bg-slate-50">
                    <td className={td}>
                      <div className={primary}>{vehicle?.registrationNumber}</div>
                      <div className={secondary}>{vehicle?.driverName}</div>
                    </td>
                    <td className={td}>
                      <div className={primary}>{timeAgo(trip.startedAt)}</div>
                      {trip.type && <div className={secondary}>{trip.type}</div>}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-900 tabular-nums`}>{formatKm(trip.distanceKm ?? 0)}</td>
                    <td className={`${td} whitespace-nowrap tabular-nums`}>
                      <span className={trip.maxSpeed > speedLimit ? 'font-semibold text-red-600' : 'text-slate-900'}>
                        {trip.maxSpeed == null ? '—' : Math.round(trip.maxSpeed)}
                      </span>
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
      )}
    </Card>
  )
}
