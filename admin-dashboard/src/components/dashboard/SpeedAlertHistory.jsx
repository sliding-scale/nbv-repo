import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import { ChevronLeft, ChevronRight, ExternalLink, LoaderCircle, TriangleAlert } from 'lucide-react'
import Badge from '../common/Badge'
import Card from '../common/Card'
import EmptyState from '../common/EmptyState'
import { inputClass } from '../common/inputClass'
import { googleMapsLink } from '../../config/maps'
import { formatDateTime } from '../../utils/telemetry'

const PAGE_SIZE = 10

const th =
  'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-2.5 align-middle'

// 20+ km/h over the limit counts as severe.
const severity = (a) => (a.speed - a.speedLimit >= 20 ? 'red' : 'amber')

/**
 * Every speed alert, newest first, in pages of 10 (requirement 4.6: review previous alerts).
 * Convex paginates with cursors, so we remember the cursor that starts each page we've visited.
 */
export default function SpeedAlertHistory({ vehicles, vehiclesById }) {
  const [vehicleId, setVehicleId] = useState('')
  // cursors[i] = cursor that starts page i (page 0 starts at null).
  const [cursors, setCursors] = useState([null])
  const page = cursors.length - 1

  const result = useQuery(api.admin.monitoring.speedAlertHistory, {
    paginationOpts: { numItems: PAGE_SIZE, cursor: cursors[page] },
    ...(vehicleId && { vehicleId }),
  })
  const alerts = result?.page ?? []

  const changeVehicle = (id) => {
    setVehicleId(id)
    setCursors([null]) // back to page 1 for the new filter
  }

  return (
    <Card
      title="Speed alert history"
      subtitle="Every time a vehicle went over the speed limit, newest first"
      action={
        <select
          value={vehicleId}
          onChange={(e) => changeVehicle(e.target.value)}
          className={`${inputClass()} h-8 w-44 text-xs`}
          aria-label="Filter speed alerts by vehicle"
        >
          <option value="">All vehicles</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      }
    >
      {result === undefined ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" /> Loading alerts…
        </div>
      ) : alerts.length === 0 && page === 0 ? (
        <EmptyState>
          No speed alerts {vehicleId ? `for ${vehiclesById[vehicleId]?.name ?? 'this vehicle'} ` : ''}yet. Alerts are recorded when a tracker
          reports a speed above the limit.
        </EmptyState>
      ) : (
        <>
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={th}>Vehicle</th>
                  <th className={th}>Recorded speed</th>
                  <th className={th}>Limit</th>
                  <th className={th}>Date &amp; time</th>
                  <th className={th}>Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((a) => {
                  const vehicle = vehiclesById[a.vehicleId]
                  return (
                    <tr key={a._id} className="hover:bg-slate-50">
                      <td className={td}>
                        <div className="flex items-center gap-2">
                          <TriangleAlert size={14} className={severity(a) === 'red' ? 'text-red-600' : 'text-amber-500'} />
                          <div>
                            <div className="font-semibold whitespace-nowrap text-slate-900">{vehicle?.name ?? 'Deleted vehicle'}</div>
                            <div className="text-xs whitespace-nowrap text-slate-500">{vehicle?.registrationNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <Badge tone={severity(a)}>
                          {a.speed} km/h (+{a.speed - a.speedLimit})
                        </Badge>
                      </td>
                      <td className={`${td} whitespace-nowrap text-slate-600 tabular-nums`}>{a.speedLimit} km/h</td>
                      <td className={`${td} whitespace-nowrap text-slate-700 tabular-nums`}>{formatDateTime(a.at)}</td>
                      <td className={`${td} text-xs`}>
                        <a
                          href={googleMapsLink(a)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-56 items-center gap-1 text-slate-700 hover:text-blue-600 hover:underline"
                        >
                          <span className="truncate">{a.address || `${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}`}</span>
                          <ExternalLink size={11} className="shrink-0" />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Page {page + 1}
              {alerts.length > 0 && ` · alerts ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + alerts.length}`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setCursors((c) => c.slice(0, -1))}
                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                disabled={result.isDone}
                onClick={() => setCursors((c) => [...c, result.continueCursor])}
                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
