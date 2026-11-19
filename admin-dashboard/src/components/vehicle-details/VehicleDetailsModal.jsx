import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import { ExternalLink, LoaderCircle, MapPin, Navigation2, SatelliteDish } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import Tabs from '../common/Tabs'
import useNow from '../../hooks/useNow'
import { ignitionSummary } from '../../utils/telemetry'
import { timeAgo } from '../../utils/dashboard'
import { formatHeading, gpsLabelFor, gpsStatuses } from '../../config/gpsStatus'
import { googleMapsLink } from '../../config/maps'
import DistanceSection from './DistanceSection'
import IgnitionSection from './IgnitionSection'
import ParentTrackingSection from './ParentTrackingSection'
import SpeedSection from './SpeedSection'
import StudentStopsSection from './StudentStopsSection'
import TripHistorySection from './TripHistorySection'
import TripSection from './TripSection'

// Prefixed ids so they don't clash with tabs on the page behind the popup (e.g. the Trips page).
const TABS = [
  { id: 'vd-today', label: 'Today' },
  { id: 'vd-history', label: 'Trip history' },
  { id: 'vd-stops', label: 'Students & stops' },
]

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Details popup for any vehicle, active or inactive: today's live monitoring, trip history,
 * its students' pickups/drop-offs, and the parent tracking switch.
 */
export default function VehicleDetailsModal({ vehicle, onClose }) {
  const now = useNow()
  const inactive = vehicle.status === 'inactive'
  // Out-of-service vans don't report, so open them on their history instead of an empty "today".
  const [tab, setTab] = useState(inactive ? 'vd-history' : 'vd-today')
  // Stable for the whole day, so the subscription isn't recreated on every render.
  const [since] = useState(startOfToday)
  const day = useQuery(api.admin.monitoring.vehicleDay, tab === 'vd-today' ? { vehicleId: vehicle.id, since } : 'skip')

  const telemetry = useMemo(() => {
    if (!day) return null
    return {
      ignition: day.ignition,
      speedAlerts: day.speedAlerts,
      trips: day.trips.map((t) => ({
        ...t,
        label: t.type || 'Trip',
      })),
    }
  }, [day])

  const hasHistory = telemetry && (telemetry.ignition.length > 0 || telemetry.trips.length > 0)

  return (
    <Modal
      open
      size="xl"
      onClose={onClose}
      title={vehicle.name}
      description={[vehicle.registrationNumber, vehicle.model, vehicle.driverName && `Driver: ${vehicle.driverName}`]
        .filter(Boolean)
        .join(' · ')}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {inactive && <Badge tone="gray">Inactive · out of service</Badge>}
          <Badge tone={vehicle.lastUpdated ? gpsStatuses[vehicle.gpsStatus].tone : 'gray'}>
            <SatelliteDish size={12} /> {gpsLabelFor(vehicle)}
          </Badge>
          {vehicle.lastUpdated ? (
            <span title={new Date(vehicle.lastUpdated).toLocaleString([], { hour12: true })}>Last GPS update {timeAgo(vehicle.lastUpdated)}</span>
          ) : (
            <span>Tracker hasn’t reported yet</span>
          )}
          {vehicle.heading != null && vehicle.lastUpdated && (
            <span className="inline-flex items-center gap-1" title="Direction of travel">
              <Navigation2 size={12} style={{ transform: `rotate(${vehicle.heading}deg)` }} /> {formatHeading(vehicle.heading)}
            </span>
          )}
          {vehicle.location && (
            <a
              href={googleMapsLink(vehicle.location)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              title="Open the current location in Google Maps"
            >
              <MapPin size={12} /> {vehicle.location.address || 'Current location'} <ExternalLink size={10} />
            </a>
          )}
        </div>

        <ParentTrackingSection vehicle={vehicle} />

        <Tabs label="Vehicle details" tabs={TABS} value={tab} onChange={setTab} />

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-4">
          {tab === 'vd-history' && <TripHistorySection vehicle={vehicle} />}
          {tab === 'vd-stops' && <StudentStopsSection vehicle={vehicle} />}
          {tab === 'vd-today' &&
            (!telemetry ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
                <LoaderCircle size={18} className="animate-spin" /> Loading today’s activity…
              </div>
            ) : (
              <>
                {!hasHistory && (
                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    {inactive ? (
                      'This van is out of service, so its tracker reports aren’t recorded. See Trip history for its past trips.'
                    ) : (
                      <>
                        No tracker data for today yet. Ignition, trips, distance and speed appear here once the tracker starts reporting.
                      </>
                    )}
                  </div>
                )}
                <IgnitionSection
                  summary={ignitionSummary(telemetry.ignition, telemetry.trips.map((t) => t.track), now)}
                  events={telemetry.ignition}
                  now={now}
                />
                <TripSection trips={telemetry.trips} now={now} />
                <DistanceSection trips={telemetry.trips} />
                <SpeedSection vehicle={vehicle} trips={telemetry.trips} alerts={telemetry.speedAlerts} />
              </>
            ))}
        </div>
      </div>
    </Modal>
  )
}
