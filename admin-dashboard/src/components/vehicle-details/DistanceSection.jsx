import { Route } from 'lucide-react'
import { formatKm, trackDistanceKm } from '../../utils/telemetry'
import { Section, Stat, StatGrid } from './shared'

/** Distance calculated from the GPS track (sum of haversine distances between points). */
export default function DistanceSection({ trips }) {
  const current = trips.find((t) => !t.end)
  const perTrip = trips.map((t) => trackDistanceKm(t.track))
  const todayKm = perTrip.reduce((a, b) => a + b, 0)
  const points = trips.reduce((n, t) => n + t.track.length, 0)
  const movingHours = trips.reduce((h, t) => h + ((t.track.at(-1)?.t ?? t.start) - t.start) / 3_600_000, 0)

  return (
    <Section icon={Route} title="Distance calculation">
      <StatGrid>
        <Stat label="Current trip" value={current ? formatKm(trackDistanceKm(current.track)) : '—'} emphasis={current ? 'text-blue-700' : undefined} />
        <Stat label="Today" value={formatKm(todayKm)} hint={`${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}`} />
        <Stat label="Average trip" value={trips.length ? formatKm(todayKm / trips.length) : '—'} />
        <Stat label="Average speed" value={movingHours > 0 ? `${Math.round(todayKm / movingHours)} km/h` : '—'} hint="distance ÷ time on trips" />
      </StatGrid>
      <p className="mt-3 text-xs text-slate-400">
        Calculated from {points.toLocaleString()} GPS points reported today, summing the straight-line distance between consecutive points. Duplicate and invalid points are skipped.
      </p>
    </Section>
  )
}
