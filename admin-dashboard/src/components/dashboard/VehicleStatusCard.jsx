import { Clock, Eye, EyeOff, Gauge, KeyRound, MapPin, SatelliteDish } from 'lucide-react'
import Badge from '../common/Badge'
import { gpsLabelFor, gpsStatuses } from '../../config/gpsStatus'
import { timeAgo } from '../../utils/dashboard'
import { vehicleTrackingLabel } from '../../utils/tracking'


function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <div className="text-[0.7rem] font-medium tracking-wide text-slate-400 uppercase">{label}</div>
        <div className="text-sm text-slate-900">{children}</div>
      </div>
    </div>
  )
}

// Every van opens its details card; inactive (out of service) vans are shown dimmed.
export default function VehicleStatusCard({ vehicle, onSelect }) {
  const ignitionOn = vehicle.ignition === 'on'
  const moving = vehicle.speed > 0
  const inactive = vehicle.status === 'inactive'
  const clickable = Boolean(onSelect)
  const interaction = clickable
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': `Open details for ${vehicle.name}`,
        onClick: () => onSelect(vehicle),
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(vehicle)
          }
        },
      }
    : {}

  return (
    <article
      {...interaction}
      className={`flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white ${inactive ? 'opacity-75' : ''} ${
        clickable
          ? 'cursor-pointer transition hover:border-blue-300 hover:opacity-100 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none'
          : ''
      }`}
    >
      <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{vehicle.name}</h3>
          <p className="text-xs text-slate-500 tabular-nums">
            {vehicle.registrationNumber}
            {inactive && <span className="ml-1.5 text-slate-400">· Out of service</span>}
          </p>
        </div>
        <Badge tone={vehicle.lastUpdated ? gpsStatuses[vehicle.gpsStatus].tone : 'gray'}>
          <SatelliteDish size={12} />
          {gpsLabelFor(vehicle)}
        </Badge>
      </header>

      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <Row icon={KeyRound} label="Ignition">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className={`size-2 rounded-full ${ignitionOn ? 'bg-green-500' : 'bg-slate-300'}`} />
            {ignitionOn ? 'On' : 'Off'}
          </span>
        </Row>
        <Row icon={Gauge} label="Speed">
          <span className={`font-semibold tabular-nums ${moving ? 'text-blue-600' : ''}`}>{vehicle.speed}</span>{' '}
          <span className="text-xs text-slate-500">km/h</span>
        </Row>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-3">
        <Row icon={MapPin} label="Last location">
          {vehicle.location ? (
            <span className="line-clamp-2">{vehicle.location.address}</span>
          ) : (
            <span className="text-slate-400">No location reported yet</span>
          )}
        </Row>
        <Row icon={Clock} label="Last GPS update">
          {vehicle.lastUpdated ? (
            <span title={new Date(vehicle.lastUpdated).toLocaleString([], { hour12: true })}>{timeAgo(vehicle.lastUpdated)}</span>
          ) : (
            <span className="text-slate-400">Never</span>
          )}
        </Row>
      </div>

      <footer className="flex items-center justify-between gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="text-xs text-slate-500">Parent tracking</span>
        <Badge tone={vehicleTrackingLabel(vehicle.parentTracking).tone}>
            {vehicle.parentTracking.visible ? <Eye size={12} /> : <EyeOff size={12} />} {vehicleTrackingLabel(vehicle.parentTracking).label}
          </Badge>
      </footer>
    </article>
  )
}
