import { useState } from 'react'
import { ExternalLink, Gauge, TriangleAlert } from 'lucide-react'
import Badge from '../common/Badge'
import SpeedChart from '../charts/SpeedChart'
import { googleMapsLink } from '../../config/maps'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import { formatClock, formatDuration, speedStats } from '../../utils/telemetry'
import { Section, Stat, StatGrid } from './shared'

/**
 * Live speed vs the limit, today's speed stats, a speed chart, and today's overspeed alerts.
 * `alerts` are the alerts recorded by the backend (one per continuous speeding event).
 */
export default function SpeedSection({ vehicle, trips, alerts }) {
  const speedLimit = useSpeedLimit()
  const [showData, setShowData] = useState(false)
  const current = trips.find((t) => !t.end)
  const chartTrip = current ?? trips.at(-1)
  const allPoints = trips.flatMap((t) => t.track)
  const stats = speedStats(allPoints)
  const over = vehicle.speed > speedLimit

  // Table view of the chart: one row per minute keeps it readable.
  const rows = chartTrip ? chartTrip.track.filter((_, i) => i % 2 === 0) : []

  return (
    <Section
      icon={Gauge}
      title="Speed monitoring & alerts"
      aside={
        alerts.length > 0 ? (
          <Badge tone="red">
            <TriangleAlert size={12} /> {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} today
          </Badge>
        ) : (
          <Badge tone="green">No alerts today</Badge>
        )
      }
    >
      <StatGrid>
        <Stat
          label="Current speed"
          value={`${vehicle.speed} km/h`}
          hint={over ? `${vehicle.speed - speedLimit} km/h over limit` : `Limit ${speedLimit} km/h`}
          emphasis={over ? 'text-red-600' : undefined}
        />
        <Stat
          label="Top speed today"
          value={`${stats.max} km/h`}
          hint={stats.maxAt ? `at ${formatClock(stats.maxAt)}` : undefined}
          emphasis={stats.max > speedLimit ? 'text-red-600' : undefined}
        />
        <Stat label="Average moving speed" value={`${Math.round(stats.avgMoving)} km/h`} />
        <Stat label="Speed limit" value={`${speedLimit} km/h`} hint="alerts above this" />
      </StatGrid>

      {chartTrip && chartTrip.track.length > 1 && (
        <div className="mt-4">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <h4 className="text-xs font-medium text-slate-700">
              Speed (km/h), {current ? 'current trip' : 'last trip'}
            </h4>
            <button type="button" onClick={() => setShowData((s) => !s)} className="cursor-pointer text-xs text-blue-600 hover:underline">
              {showData ? 'Hide data' : 'Show data'}
            </button>
          </div>
          <SpeedChart track={chartTrip.track} limit={speedLimit} />
          {showData && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-1.5 font-medium">Time</th>
                    <th className="px-3 py-1.5 text-right font-medium">Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((p) => (
                    <tr key={p.t}>
                      <td className="px-3 py-1 text-slate-600 tabular-nums">{formatClock(p.t)}</td>
                      <td className={`px-3 py-1 text-right tabular-nums ${p.speed > speedLimit ? 'font-semibold text-red-600' : 'text-slate-900'}`}>
                        {p.speed} km/h{p.speed > speedLimit && ' ▲'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <h4 className="mt-4 mb-1.5 text-xs font-medium text-slate-700">Overspeed alerts today</h4>
      {alerts.length === 0 ? (
        <p className="text-sm text-slate-500">This van stayed within the limit today.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-red-100 text-red-600">
                <TriangleAlert size={14} />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <span className="font-semibold text-slate-900 tabular-nums">{a.speed} km/h</span>
                <span className="text-slate-500">
                  {' '}
                  peak, {a.speed - a.speedLimit} over ·{' '}
                  {a.endedAt === null ? <span className="font-medium text-red-600">still speeding</span> : `for ${formatDuration(a.endedAt - a.at)}`}
                </span>
                <div className="text-xs text-slate-400 tabular-nums">
                  {formatClock(a.at)}
                  {a.address && <span title={a.address}> · {a.address.length > 48 ? a.address.slice(0, 48) + '…' : a.address}</span>}
                  {' · '}
                  <a href={googleMapsLink(a)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-blue-600 hover:underline">
                    View location <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
