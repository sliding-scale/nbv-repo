import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import { History, LoaderCircle } from 'lucide-react'
import EmptyState from '../common/EmptyState'
import { inputClass } from '../common/inputClass'
import TripPlace from '../trips/TripPlace'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import { DATE_PRESETS, DAY, midnight, rangeFor, toInputDate } from '../../utils/dateRanges'
import { formatDateTime, formatDuration, formatKm } from '../../utils/telemetry'
import { Section, Stat, StatGrid } from './shared'

const th = 'whitespace-nowrap pb-1.5 pr-3 text-left font-medium'
const td = 'py-2 pr-3 align-top'

/** Completed trips for one vehicle over a chosen period (ignition ON → OFF). */
export default function TripHistorySection({ vehicle }) {
  const speedLimit = useSpeedLimit()
  const [today] = useState(() => midnight(Date.now()))
  const [preset, setPreset] = useState('last7')
  const [customFrom, setCustomFrom] = useState(() => toInputDate(today - 6 * DAY))
  const [customTo, setCustomTo] = useState(() => toInputDate(today))

  const [from, to] = useMemo(() => rangeFor(preset, customFrom, customTo, today), [preset, customFrom, customTo, today])
  const result = useQuery(api.admin.monitoring.tripHistory, { from, to, vehicleId: vehicle.id })
  const trips = useMemo(() => result?.trips ?? [], [result])

  const totals = useMemo(
    () => ({
      km: trips.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0),
      ms: trips.reduce((sum, t) => sum + (t.endedAt - t.startedAt), 0),
      top: trips.reduce((max, t) => Math.max(max, t.maxSpeed ?? 0), 0),
    }),
    [trips],
  )

  return (
    <Section icon={History} title="Trip history">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="block w-40">
          <span className="mb-1 block text-xs font-medium text-slate-600">Period</span>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className={inputClass()}>
            {DATE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        {preset === 'custom' && (
          <>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">From</span>
              <input type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} className={inputClass()} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">To</span>
              <input type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} className={inputClass()} />
            </label>
          </>
        )}
      </div>

      {result === undefined ? (
        <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500">
          <LoaderCircle size={16} className="animate-spin" /> Loading trips…
        </div>
      ) : trips.length === 0 ? (
        <EmptyState>No completed trips for {vehicle.name} in this period.</EmptyState>
      ) : (
        <>
          <div className="mb-3">
            <StatGrid>
              <Stat label="Trips" value={trips.length} />
              <Stat label="Distance" value={formatKm(totals.km)} />
              <Stat label="Time on the road" value={formatDuration(totals.ms)} />
              <Stat
                label="Top speed"
                value={`${Math.round(totals.top)} km/h`}
                emphasis={totals.top > speedLimit ? 'text-red-600' : undefined}
              />
            </StatGrid>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-xs text-slate-500">
                <tr>
                  <th className={th}>Start</th>
                  <th className={th}>End</th>
                  <th className={th}>Duration</th>
                  <th className={th}>From / to</th>
                  <th className={`${th} text-right`}>Distance</th>
                  <th className={`${th} text-right`}>Top speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((t) => {
                  const over = (t.maxSpeed ?? 0) > speedLimit
                  const label = t.type
                  return (
                    <tr key={t._id}>
                      <td className={`${td} whitespace-nowrap text-slate-900 tabular-nums`}>
                        {formatDateTime(t.startedAt)}
                        {label && <div className="max-w-40 truncate text-xs text-slate-500">{label}</div>}
                      </td>
                      <td className={`${td} whitespace-nowrap text-slate-700 tabular-nums`}>{formatDateTime(t.endedAt)}</td>
                      <td className={`${td} whitespace-nowrap text-slate-900 tabular-nums`}>{formatDuration(t.endedAt - t.startedAt)}</td>
                      <td className={`${td} text-xs`}>
                        <div>
                          <TripPlace point={t.startLocation} />
                        </div>
                        <div>
                          <TripPlace point={t.endLocation} />
                        </div>
                      </td>
                      <td className={`${td} text-right whitespace-nowrap text-slate-900 tabular-nums`}>{formatKm(t.distanceKm ?? 0)}</td>
                      <td className={`${td} text-right whitespace-nowrap tabular-nums ${over ? 'font-semibold text-red-600' : 'text-slate-900'}`}>
                        {Math.round(t.maxSpeed ?? 0)} km/h
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {result.truncated && (
            <p className="mt-2 text-center text-xs text-slate-500">Showing the latest 500 trips. Narrow the period to see more.</p>
          )}
        </>
      )}
    </Section>
  )
}
