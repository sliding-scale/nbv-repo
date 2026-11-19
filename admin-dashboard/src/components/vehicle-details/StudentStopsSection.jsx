import { useEffect, useMemo, useRef } from 'react'
import { AdvancedMarker, Map, Pin } from '@vis.gl/react-google-maps'
import L from 'leaflet'
import { Marker, useMap as useLeafletMap } from 'react-leaflet'
import { Bus, ExternalLink, MapPinned } from 'lucide-react'
import EmptyState from '../common/EmptyState'
import { GOOGLE_MAPS_MAP_ID, googleMapsLink } from '../../config/maps'
import OsmCanvas from '../maps/OsmCanvas'
import { dotIcon, escapeHtml, toLatLng } from '../maps/osm'
import { withMapFallback } from '../maps/withMapFallback'
import { useStudents } from '../../store/StudentsContext'
import { Section } from './shared'

const COLORS = {
  pickup: { background: '#2563eb', border: '#1e40af', label: 'Pickup' },
  dropoff: { background: '#16a34a', border: '#166534', label: 'Drop-off' },
}

// How many names a shared pin (e.g. the school gate) lists before "+N more".
const MAX_NAMES_ON_PIN = 3

const studentLabel = (s) => `${s.fullName} – ${s.gsId}`

/**
 * One pin per place. Students sharing an exact spot (typically the school drop-off)
 * share a pin, so labels don't stack on top of each other.
 */
function groupStops(students) {
  const groups = new globalThis.Map()
  for (const s of students) {
    for (const kind of ['pickup', 'dropoff']) {
      const loc = kind === 'pickup' ? s.pickupLocation : s.dropoffLocation
      if (!loc) continue
      const key = `${kind}:${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`
      const group = groups.get(key) ?? { key, kind, position: { lat: loc.lat, lng: loc.lng }, students: [] }
      group.students.push(s)
      groups.set(key, group)
    }
  }
  return [...groups.values()]
}

function boundsOf(points) {
  if (points.length < 2) return undefined
  return {
    north: Math.max(...points.map((p) => p.lat)),
    south: Math.min(...points.map((p) => p.lat)),
    east: Math.max(...points.map((p) => p.lng)),
    west: Math.min(...points.map((p) => p.lng)),
    padding: 56,
  }
}

function StopPin({ group }) {
  const color = COLORS[group.kind]
  const names = group.students.map(studentLabel)
  const shown = names.slice(0, MAX_NAMES_ON_PIN)
  const extra = names.length - shown.length
  return (
    <AdvancedMarker position={group.position} title={`${color.label}\n${names.join('\n')}`}>
      <div className="flex flex-col items-center">
        <div
          className="mb-1 max-w-52 rounded-md border bg-white px-1.5 py-0.5 text-[0.68rem] leading-tight font-medium text-slate-800 shadow"
          style={{ borderColor: color.background }}
        >
          {shown.map((n) => (
            <div key={n} className="truncate">
              {n}
            </div>
          ))}
          {extra > 0 && <div className="text-slate-500">+{extra} more</div>}
        </div>
        <Pin background={color.background} borderColor={color.border} glyphColor="#fff" scale={0.9} />
      </div>
    </AdvancedMarker>
  )
}

function FitStops({ points }) {
  const map = useLeafletMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || points.length === 0) return
    done.current = true
    if (points.length === 1) map.setView(toLatLng(points[0]), 14)
    else map.fitBounds(points.map(toLatLng), { padding: [56, 56] })
  }, [map, points])
  return null
}

function labelHtml(group) {
  const color = COLORS[group.kind]
  const names = group.students.map(studentLabel)
  const shown = names.slice(0, MAX_NAMES_ON_PIN)
  const extra = names.length - shown.length
  const lines = [...shown, ...(extra > 0 ? [`+${extra} more`] : [])]
    .map((line) => `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(line)}</div>`)
    .join('')
  return `<div style="display:flex;flex-direction:column;align-items:center">
    <div style="margin-bottom:4px;max-width:13rem;border:1px solid ${color.background};background:#fff;border-radius:6px;padding:2px 6px;font-size:11px;line-height:1.2;color:#1e293b">${lines}</div>
    <span style="display:block;width:14px;height:14px;border-radius:999px;background:${color.background};border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.35)"></span>
  </div>`
}

function OsmStopsMap({ vehicle, groups }) {
  const vehiclePoint = vehicle.location ? { lat: vehicle.location.lat, lng: vehicle.location.lng } : null
  const points = [...groups.map((g) => g.position), ...(vehiclePoint ? [vehiclePoint] : [])]
  if (points.length === 0) return null
  return (
    <div className="mb-3">
      <div className="h-72 overflow-hidden rounded-lg border border-slate-200">
        <OsmCanvas center={points[0]} zoom={14}>
          {groups.map((group) => (
            <Marker
              key={group.key}
              position={toLatLng(group.position)}
              icon={L.divIcon({ className: '', html: labelHtml(group), iconSize: [160, 48], iconAnchor: [80, 48] })}
              title={`${COLORS[group.kind].label}: ${group.students.map(studentLabel).join(', ')}`}
            />
          ))}
          {vehiclePoint && (
            <Marker position={toLatLng(vehiclePoint)} icon={dotIcon('#0f172a', 18)} title={`${vehicle.name} (last reported location)`} zIndexOffset={1000} />
          )}
          <FitStops points={points} />
        </OsmCanvas>
      </div>
      <StopLegend vehicle={vehicle} vehiclePoint={vehiclePoint} />
    </div>
  )
}

function StopLegend({ vehicle, vehiclePoint }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full" style={{ background: COLORS.pickup.background }} /> Pickup
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full" style={{ background: COLORS.dropoff.background }} /> Drop-off
      </span>
      {vehiclePoint && (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-900" /> {vehicle.name}
        </span>
      )}
    </div>
  )
}

function GoogleStopsMap({ vehicle, groups }) {
  const vehiclePoint = vehicle.location ? { lat: vehicle.location.lat, lng: vehicle.location.lng } : null
  const points = [...groups.map((g) => g.position), ...(vehiclePoint ? [vehiclePoint] : [])]
  if (points.length === 0) return null

  return (
    <div className="mb-3">
      <div className="h-72 overflow-hidden rounded-lg border border-slate-200">
        <Map
          mapId={GOOGLE_MAPS_MAP_ID}
          defaultCenter={points[0]}
          defaultZoom={14}
          defaultBounds={boundsOf(points)}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
        >
          {groups.map((g) => (
            <StopPin key={g.key} group={g} />
          ))}
          {vehiclePoint && (
            <AdvancedMarker position={vehiclePoint} title={`${vehicle.name} (last reported location)`} zIndex={1000}>
              <div className="grid size-8 place-items-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg">
                <Bus size={16} />
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </div>
      <StopLegend vehicle={vehicle} vehiclePoint={vehiclePoint} />
    </div>
  )
}

const StopsMap = withMapFallback(GoogleStopsMap, OsmStopsMap)

function Place({ location, kind }) {
  if (!location) return <span className="text-xs text-amber-600">Not configured</span>
  const text = location.label ? `${location.label} · ${location.address}` : location.address
  return (
    <a
      href={googleMapsLink(location)}
      target="_blank"
      rel="noreferrer"
      title={`${COLORS[kind].label}: ${text} (open in Google Maps)`}
      className="inline-flex max-w-full items-center gap-1 text-xs text-slate-700 hover:text-blue-600 hover:underline"
    >
      <span className="size-2 shrink-0 rounded-full" style={{ background: COLORS[kind].background }} />
      <span className="truncate">{text || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</span>
      <ExternalLink size={10} className="shrink-0" />
    </a>
  )
}

/** Every student riding this van, with their pickup and drop-off on a map and in a list. */
export default function StudentStopsSection({ vehicle }) {
  const { students } = useStudents()
  const riders = useMemo(
    () =>
      students
        .filter((s) => s.vehicleId === vehicle.id)
        .sort((a, b) => (a.status === b.status ? a.fullName.localeCompare(b.fullName) : a.status === 'active' ? -1 : 1)),
    [students, vehicle.id],
  )
  const groups = useMemo(() => groupStops(riders.filter((s) => s.status === 'active')), [riders])
  const missing = riders.filter((s) => s.status === 'active' && (!s.pickupLocation || !s.dropoffLocation)).length

  return (
    <Section
      icon={MapPinned}
      title="Student pickups & drop-offs"
      aside={<span className="text-xs text-slate-500">{riders.length} {riders.length === 1 ? 'student' : 'students'}</span>}
    >
      {riders.length === 0 ? (
        <EmptyState>No students are assigned to this van. Assign them in the Vehicles or Students tab.</EmptyState>
      ) : (
        <>
          <StopsMap vehicle={vehicle} groups={groups} />
          {missing > 0 && (
            <p className="mb-2 text-xs text-amber-700">
              {missing} {missing === 1 ? 'student is' : 'students are'} missing a pickup or drop-off location.
            </p>
          )}
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[0.7rem] font-semibold tracking-wide text-slate-500 uppercase sm:grid">
              <span>Student</span>
              <span>Pickup</span>
              <span>Drop-off</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {riders.map((s) => (
                <li
                  key={s.id}
                  className={`grid gap-1.5 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.3fr)] sm:items-center sm:gap-3 ${
                    s.status === 'active' ? '' : 'opacity-60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{s.fullName}</div>
                    <div className="text-xs text-slate-500">
                      {s.gsId}
                      {s.status !== 'active' && ' · inactive'}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Place location={s.pickupLocation} kind="pickup" />
                  </div>
                  <div className="min-w-0">
                    <Place location={s.dropoffLocation} kind="dropoff" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Section>
  )
}
