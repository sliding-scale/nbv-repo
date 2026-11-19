import { KeyRound } from 'lucide-react'
import Badge from '../common/Badge'
import { googleMapsLink } from '../../config/maps'
import { formatClock, formatDuration } from '../../utils/telemetry'
import { Section, Stat, StatGrid } from './shared'

/** Engine on/off now, how long it's been in that state, today's totals and a timeline. */
export default function IgnitionSection({ summary, events, now }) {
  const on = summary.state === 'on'
  const dayStart = Math.min(events[0]?.at ?? now, now - 60 * 60_000)
  const span = Math.max(1, now - dayStart)
  const pct = (t) => `${((t - dayStart) / span) * 100}%`

  return (
    <Section
      icon={KeyRound}
      title="Ignition monitoring"
      aside={<Badge tone={on ? 'green' : 'gray'}>{on ? '● Ignition on' : '○ Ignition off'}</Badge>}
    >
      <StatGrid>
        <Stat
          label={on ? 'On for' : 'Off for'}
          value={summary.since ? formatDuration(now - summary.since) : '—'}
          hint={summary.since ? `since ${formatClock(summary.since)}` : undefined}
        />
        <Stat label="Engine on today" value={formatDuration(summary.onMs)} />
        <Stat
          label="Idling today"
          value={formatDuration(summary.idleMs)}
          hint="Ignition on, not moving"
          emphasis={summary.idleMs > 15 * 60_000 ? 'text-amber-600' : undefined}
        />
        <Stat label="Ignition cycles" value={summary.sessions.length} hint="on → off today" />
      </StatGrid>

      {/* Timeline: blue = engine running */}
      <div className="mt-4">
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          {summary.sessions.map((s) => (
            <div
              key={s.start}
              className="absolute inset-y-0 rounded-full bg-blue-600"
              style={{ left: pct(s.start), width: `calc(${pct(s.end ?? now)} - ${pct(s.start)})` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>{formatClock(dayStart)}</span>
          <span>Now</span>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-slate-600">
        {[...events].reverse().map((e) => (
          <li key={e.at} className="flex items-center gap-2">
            <span className={`size-1.5 rounded-full ${e.state === 'on' ? 'bg-green-500' : 'bg-slate-400'}`} />
            <span className="w-16 text-slate-400 tabular-nums">{formatClock(e.at)}</span>
            <span className="shrink-0">Ignition turned {e.state}</span>
            {e.location && (
              <a
                href={googleMapsLink(e.location)}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 truncate text-blue-600 hover:underline"
                title={e.location.address || 'Open in Google Maps'}
              >
                {e.location.address || 'view location'}
              </a>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}
