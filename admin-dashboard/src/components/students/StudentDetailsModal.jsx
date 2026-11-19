import { useEffect, useRef } from 'react'
import { AdvancedMarker, Map, Pin } from '@vis.gl/react-google-maps'
import { Marker, useMap as useLeafletMap } from 'react-leaflet'
import { Bus, ExternalLink, Mail, Pencil, Phone, User, Wallet } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import { GOOGLE_MAPS_MAP_ID, googleMapsLink } from '../../config/maps'
import OsmCanvas from '../maps/OsmCanvas'
import { dotIcon, toLatLng } from '../maps/osm'
import { withMapFallback } from '../maps/withMapFallback'
import { parentStatuses } from '../../config/parentStatus'
import { formatFee } from '../../utils/finance'

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{title}</h3>
      {children}
    </section>
  )
}

function Info({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm text-slate-900">{children}</div>
      </div>
    </div>
  )
}

function LocationCard({ title, location, color }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="size-2 rounded-full" style={{ background: color }} /> {title}
      </div>
      {location ? (
        <>
          {location.label && <div className="text-sm font-semibold text-slate-900">{location.label}</div>}
          <div className="text-sm text-slate-700">{location.address}</div>
          {location.notes && <div className="mt-0.5 text-xs text-slate-500 italic">“{location.notes}”</div>}
          <a href={googleMapsLink(location)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
            Open in Google Maps <ExternalLink size={11} />
          </a>
        </>
      ) : (
        <div className="text-sm text-amber-600">Not configured</div>
      )}
    </div>
  )
}

function FitStops({ points }) {
  const map = useLeafletMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || points.length === 0) return
    done.current = true
    if (points.length === 1) map.setView(toLatLng(points[0]), 15)
    else map.fitBounds(points.map(toLatLng), { padding: [48, 48] })
  }, [map, points])
  return null
}

function OsmStopsMap({ pickup, dropoff }) {
  const points = [pickup, dropoff].filter(Boolean)
  if (points.length === 0) return null
  return (
    <div className="mt-3 h-56 overflow-hidden rounded-lg border border-slate-200">
      <OsmCanvas center={points[0]} zoom={15}>
        {pickup && <Marker position={toLatLng(pickup)} icon={dotIcon('#2563eb')} title="Pickup" />}
        {dropoff && <Marker position={toLatLng(dropoff)} icon={dotIcon('#16a34a')} title="Drop-off" />}
        <FitStops points={points} />
      </OsmCanvas>
    </div>
  )
}

// Both points on one map, framed to fit.
function GoogleStopsMap({ pickup, dropoff }) {
  const points = [pickup, dropoff].filter(Boolean)
  if (points.length === 0) return null
  const bounds = points.length > 1
    ? {
        north: Math.max(pickup.lat, dropoff.lat),
        south: Math.min(pickup.lat, dropoff.lat),
        east: Math.max(pickup.lng, dropoff.lng),
        west: Math.min(pickup.lng, dropoff.lng),
      }
    : undefined
  return (
    <div className="mt-3 h-56 overflow-hidden rounded-lg border border-slate-200">
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={points[0]}
        defaultZoom={15}
        defaultBounds={bounds && { ...bounds, padding: 48 }}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
      >
        {pickup && (
          <AdvancedMarker position={pickup} title="Pickup">
            <Pin background="#2563eb" borderColor="#1e40af" glyphColor="#fff" />
          </AdvancedMarker>
        )}
        {dropoff && (
          <AdvancedMarker position={dropoff} title="Drop-off">
            <Pin background="#16a34a" borderColor="#166534" glyphColor="#fff" />
          </AdvancedMarker>
        )}
      </Map>
    </div>
  )
}

const StopsMap = withMapFallback(GoogleStopsMap, OsmStopsMap)

export default function StudentDetailsModal({ student, parentsById, vehiclesById, onEdit, onClose }) {
  const vehicle = vehiclesById[student.vehicleId]
  const parents = student.parentIds.map((id) => parentsById[id]).filter(Boolean)
  const inactive = student.status === 'inactive'

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={student.fullName}
      description={`GS ID ${student.gsId}${student.grade ? ` · ${student.grade}` : ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button icon={Pencil} onClick={onEdit}>
            Edit student
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <Badge tone={inactive ? 'gray' : 'green'}>{inactive ? 'Inactive' : 'Active'}</Badge>
        </div>

        <Section title="Monthly fee">
          <Info icon={Wallet} label="Amount">
            {student.monthlyFee == null ? <span className="text-amber-600">Not set</span> : formatFee(student.monthlyFee)}
          </Info>
        </Section>

        <Section title="Parents / guardians">
          {parents.length === 0 ? (
            <p className="text-sm text-amber-600">No parent or guardian associated.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {parents.map((p) => (
                <Info key={p.id} icon={User} label={p.relationship || 'Parent / guardian'}>
                  <div className="flex items-center gap-2 font-medium">
                    {p.fullName}
                    {p.status !== 'active' && (
                      <Badge tone={parentStatuses[p.status].tone}>{parentStatuses[p.status].label}</Badge>
                    )}
                  </div>
                  <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <Mail size={11} /> {p.email}
                  </a>
                  {p.phone && (
                    <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="ml-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Phone size={11} /> {p.phone}
                    </a>
                  )}
                </Info>
              ))}
            </div>
          )}
        </Section>

        <Section title="Transport">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info icon={Bus} label="Assigned vehicle">
              {vehicle ? (
                <>
                  {vehicle.name} <span className="text-slate-500">· {vehicle.registrationNumber}</span>
                  {vehicle.status === 'inactive' && <span className="ml-1 text-xs text-amber-600">(inactive)</span>}
                </>
              ) : (
                <span className="text-amber-600">Not assigned</span>
              )}
            </Info>
          </div>
        </Section>

        <Section title="Locations">
          <div className="grid gap-3 sm:grid-cols-2">
            <LocationCard title="Pickup" location={student.pickupLocation} color="#2563eb" />
            <LocationCard title="Drop-off" location={student.dropoffLocation} color="#16a34a" />
          </div>
          <StopsMap pickup={student.pickupLocation} dropoff={student.dropoffLocation} />
        </Section>
      </div>
    </Modal>
  )
}
