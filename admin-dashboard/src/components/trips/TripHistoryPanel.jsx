import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import { LoaderCircle } from 'lucide-react'
import EmptyState from '../common/EmptyState'
import { inputClass } from '../common/inputClass'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import { formatDateTime, formatDuration, formatKm } from '../../utils/telemetry'
import { DATE_PRESETS as PRESETS, DAY, midnight, rangeFor, toInputDate } from '../../utils/dateRanges'
import TripPlace from './TripPlace'

const th =
  'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 align-middle'

function Summary({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900 tabular-nums">{value}</div>
    </div>
  )
}

/** Completed trips for a date range, per vehicle or for the whole fleet. */
export default function TripHistoryPanel({ vehicles, vehiclesById }) {
  const speedLimit = useSpeedLimit()
  const [today] = useState(() => midnight(Date.now()))
  const [preset, setPreset] = useState('today')
  const [customFrom, setCustomFrom] = useState(() => toInputDate(today - 6 * DAY))
  const [customTo, setCustomTo] = useState(() => toInputDate(today))
  const [vehicleId, setVehicleId] = useState('')

  const [from, to] = useMemo(() => rangeFor(preset, customFrom, customTo, today), [preset, customFrom, customTo, today])
  const result = useQuery(api.admin.monitoring.tripHistory, { from, to, ...(vehicleId && { vehicleId }) })
  const trips = useMemo(() => result?.trips ?? [], [result])

  const totals = useMemo(() => {
    const km = trips.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0)
    const ms = trips.reduce((sum, t) => sum + (t.endedAt - t.startedAt), 0)
    const top = trips.reduce((max, t) => Math.max(max, t.maxSpeed ?? 0), 0)
    return { km, ms, top }
  }, [trips])

  // Per-vehicle totals, shown when looking at the whole fleet.
  const perVehicle = useMemo(() => {
    const map = new Map()
    for (const t of trips) {
      const row = map.get(t.vehicleId) ?? { vehicleId: t.vehicleId, count: 0, km: 0, ms: 0, top: 0 }
      row.count += 1
      row.km += t.distanceKm ?? 0
      row.ms += t.endedAt - t.startedAt
      row.top = Math.max(row.top, t.maxSpeed ?? 0)
      map.set(t.vehicleId, row)
    }
    return [...map.values()].sort((a, b) => b.km - a.km)
  }, [trips])

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:flex-wrap lg:items-end">
        <label className="block lg:w-56">
          <span className="mb-1 block text-xs font-medium text-slate-600">Vehicle</span>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={inputClass()}>
            <option value="">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.registrationNumber}
              </option>
            ))}
          </select>
        </label>
        <label className="block lg:w-44">
          <span className="mb-1 block text-xs font-medium text-slate-600">Period</span>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className={inputClass()}>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {preset === 'custom' && (
          <div className="flex gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">From</span>
              <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} className={inputClass()} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">To</span>
              <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} className={inputClass()} />
            </label>
          </div>
        )}
      </div>

      {result === undefined ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" /> Loading trip history…
        </div>
      ) : trips.length === 0 ? (
        <div className="p-8 text-center">
          <EmptyState>
            No completed trips {vehicleId ? `for ${vehiclesById[vehicleId]?.name ?? 'this vehicle'} ` : ''}in this period. Trips are recorded
            automatically once trackers report ignition on and off.
          </EmptyState>
        </div>
      ) : (
        <>
          {/* Totals for the period */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-200 p-4 sm:grid-cols-4">
            <Summary label="Trips" value={trips.length} />
            <Summary label="Total distance" value={formatKm(totals.km)} />
            <Summary label="Time on the road" value={formatDuration(totals.ms)} />
            <Summary label="Top speed" value={`${Math.round(totals.top)} km/h`} />
          </div>

          {/* By vehicle (whole fleet only) */}
          {!vehicleId && perVehicle.length > 1 && (
            <div className="border-b border-slate-200 p-4">
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">By vehicle</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-500">
                    <tr>
                      <th className="pb-1.5 font-medium">Vehicle</th>
                      <th className="pb-1.5 text-right font-medium">Trips</th>
                      <th className="pb-1.5 text-right font-medium">Distance</th>
                      <th className="pb-1.5 text-right font-medium">Time</th>
                      <th className="pb-1.5 text-right font-medium">Top speed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {perVehicle.map((row) => (
                      <tr key={row.vehicleId}>
                        <td className="py-1.5">
                          <button type="button" onClick={() => setVehicleId(row.vehicleId)} className="cursor-pointer font-medium text-slate-900 hover:text-blue-600 hover:underline">
                            {vehiclesById[row.vehicleId]?.name ?? 'Deleted vehicle'}
                          </button>
                        </td>
                        <td className="py-1.5 text-right tabular-nums">{row.count}</td>
                        <td className="py-1.5 text-right tabular-nums">{formatKm(row.km)}</td>
                        <td className="py-1.5 text-right tabular-nums">{formatDuration(row.ms)}</td>
                        <td className={`py-1.5 text-right tabular-nums ${row.top > speedLimit ? 'font-semibold text-red-600' : ''}`}>{Math.round(row.top)} km/h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trip records */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={th}>Vehicle</th>
                  <th className={th}>Start</th>
                  <th className={th}>End</th>
                  <th className={th}>Duration</th>
                  <th className={th}>Start location</th>
                  <th className={th}>End location</th>
                  <th className={th}>Distance</th>
                  <th className={th}>Top speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((t) => {
                  const vehicle = vehiclesById[t.vehicleId]
                  const over = t.maxSpeed > speedLimit
                  return (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className={td}>
                        <div className="font-semibold whitespace-nowrap text-slate-900">{vehicle?.name ?? 'Deleted vehicle'}</div>
                        <div className="text-xs whitespace-nowrap text-slate-500">
                          {[vehicle?.registrationNumber, t.type].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      <td className={`${td} whitespace-nowrap text-slate-700 tabular-nums`}>{formatDateTime(t.startedAt)}</td>
                      <td className={`${td} whitespace-nowrap text-slate-700 tabular-nums`}>{formatDateTime(t.endedAt)}</td>
                      <td className={`${td} whitespace-nowrap text-slate-900 tabular-nums`}>{formatDuration(t.endedAt - t.startedAt)}</td>
                      <td className={`${td} text-xs`}>
                        <TripPlace point={t.startLocation} />
                      </td>
                      <td className={`${td} text-xs`}>
                        <TripPlace point={t.endLocation} />
                      </td>
                      <td className={`${td} whitespace-nowrap text-slate-900 tabular-nums`}>{formatKm(t.distanceKm ?? 0)}</td>
                      <td className={`${td} whitespace-nowrap tabular-nums ${over ? 'font-semibold text-red-600' : 'text-slate-900'}`}>
                        {Math.round(t.maxSpeed ?? 0)} km/h{over && ' ▲'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {result.truncated && (
            <p className="border-t border-slate-200 p-3 text-center text-xs text-slate-500">
              Showing the latest 500 trips. Narrow the period or pick a vehicle to see more.
            </p>
          )}
        </>
      )}
    </div>
  )
}
