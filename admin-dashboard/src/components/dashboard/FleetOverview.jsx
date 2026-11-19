import Card from '../common/Card'
import { tones } from '../../config/tones'
import { percent } from '../../utils/dashboard'

function SplitBar({ label, segments, total }) {
  return (
    <div>
      <div className="mb-2 text-[0.82rem] font-semibold text-slate-900">{label}</div>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className={tones[s.tone].solid}
              style={{ width: `${percent(s.value, total)}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.8rem] text-slate-500">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-xs ${tones[s.tone].solid}`} />
            {s.label}
            <strong className="text-slate-900 tabular-nums">{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function FleetOverview({ summary, gpsCounts }) {
  const total = summary.totalVehicles
  const stationary = summary.activeVehicles - summary.movingVehicles

  return (
    <Card title="Fleet overview" subtitle={`${total} registered vehicles`}>
      <div className="flex flex-col gap-[22px]">
        <SplitBar
          label="Operating status"
          total={total}
          segments={[
            { label: 'Moving', value: summary.movingVehicles, tone: 'blue' },
            { label: 'Stationary', value: stationary, tone: 'green' },
            { label: 'Inactive', value: summary.inactiveVehicles, tone: 'gray' },
          ]}
        />
        <SplitBar
          label="GPS location"
          total={total}
          segments={[
            { label: 'Live', value: gpsCounts.online, tone: 'green' },
            { label: 'Stale', value: gpsCounts.weak, tone: 'amber' },
            { label: 'Unavailable', value: gpsCounts.offline, tone: 'red' },
          ]}
        />
        <SplitBar
          label="Parent tracking"
          total={total}
          segments={[
            { label: 'Visible to parents', value: summary.trackingEnabled, tone: 'green' },
            { label: 'Not visible', value: summary.trackingDisabled, tone: 'gray' },
          ]}
        />
      </div>
    </Card>
  )
}
