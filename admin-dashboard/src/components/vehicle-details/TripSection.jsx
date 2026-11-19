import { Timer } from 'lucide-react'
import Badge from '../common/Badge'
import { formatClock, formatDuration, formatKm, trackDistanceKm } from '../../utils/telemetry'
import { Section, Stat, StatGrid } from './shared'

/** Current trip duration and today's trip log. */
export default function TripSection({ trips, now }) {
  const current = trips.find((t) => !t.end)
  const completed = trips.filter((t) => t.end)
  const totalMs = trips.reduce((sum, t) => sum + ((t.end ?? now) - t.start), 0)

  return (
    <Section
      icon={Timer}
      title="Trip duration"
      aside={current ? <Badge tone="blue">Trip in progress</Badge> : <Badge tone="gray">No active trip</Badge>}
    >
      {current ? (
        <div className="mb-4 rounded-lg bg-blue-50/60 p-3">
          <div className="text-sm font-medium text-slate-900">{current.label}</div>
          <div className="mt-2">
            <StatGrid>
              <Stat label="Running for" value={formatDuration(now - current.start)} hint={`started ${formatClock(current.start)}`} emphasis="text-blue-700" />
              <Stat label="Trips today" value={trips.length} hint={`${formatDuration(totalMs)} on the road`} />
            </StatGrid>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-sm text-slate-500">The van isn’t on a trip right now.</p>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th className="pb-1.5 font-medium">Trip</th>
            <th className="pb-1.5 font-medium">Time</th>
            <th className="pb-1.5 text-right font-medium">Duration</th>
            <th className="pb-1.5 text-right font-medium">Distance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[...(current ? [current] : []), ...[...completed].reverse()].map((t) => (
            <tr key={t.id}>
              <td className="max-w-50 truncate py-1.5 pr-2 text-slate-900">{t.label}</td>
              <td className="py-1.5 pr-2 whitespace-nowrap text-slate-600 tabular-nums">
                {formatClock(t.start)} – {t.end ? formatClock(t.end) : 'now'}
              </td>
              <td className="py-1.5 text-right whitespace-nowrap text-slate-900 tabular-nums">{formatDuration((t.end ?? now) - t.start)}</td>
              <td className="py-1.5 text-right whitespace-nowrap text-slate-900 tabular-nums">{formatKm(trackDistanceKm(t.track))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}
