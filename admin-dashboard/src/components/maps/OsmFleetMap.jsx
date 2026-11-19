import { useEffect, useRef } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { Maximize } from 'lucide-react'
import { DEFAULT_MAP_CENTER } from '../../config/maps'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import { isSpeeding, movementStateFor, movementStates, positionOf } from '../../utils/liveTracking'
import OsmCanvas from './OsmCanvas'
import { dotIcon, toLatLng } from './osm'

const FOCUS_ZOOM = 16

function frame(map, vehicles) {
  if (!map || vehicles.length === 0) return
  if (vehicles.length === 1) {
    map.setView(toLatLng(positionOf(vehicles[0])), FOCUS_ZOOM)
    return
  }
  map.fitBounds(vehicles.map((vehicle) => toLatLng(positionOf(vehicle))), { padding: [64, 64] })
}

function FitOnFirstLoad({ vehicles }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || vehicles.length === 0) return
    done.current = true
    frame(map, vehicles)
  }, [map, vehicles])
  return null
}

function FocusVehicle({ focus, vehiclesById }) {
  const map = useMap()
  const latest = useRef(vehiclesById)
  useEffect(() => {
    latest.current = vehiclesById
  })
  useEffect(() => {
    const vehicle = focus && latest.current[focus.id]
    if (!vehicle) return
    map.panTo(toLatLng(positionOf(vehicle)))
    if (map.getZoom() < FOCUS_ZOOM) map.setZoom(FOCUS_ZOOM)
  }, [map, focus])
  return null
}

function FitAllButton({ vehicles }) {
  const map = useMap()
  return (
    <button
      type="button"
      onClick={() => frame(map, vehicles)}
      disabled={vehicles.length === 0}
      className="absolute top-3 left-3 z-[2] inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Maximize size={13} /> Show all vans
    </button>
  )
}

function VanDot({ vehicle, highlighted, onClick }) {
  const speedLimit = useSpeedLimit()
  const stateId = movementStateFor(vehicle)
  const state = movementStates[stateId]
  const speeding = isSpeeding(vehicle, speedLimit)
  const color = speeding ? '#dc2626' : state.color
  return (
    <Marker
      position={toLatLng(positionOf(vehicle))}
      icon={dotIcon(color, highlighted ? 22 : 16)}
      zIndexOffset={highlighted ? 1000 : 0}
      eventHandlers={{ click: () => onClick(vehicle) }}
      title={`${vehicle.name} · ${state.label}`}
    />
  )
}

/** Live vans on OpenStreetMap. Same clicks and camera as the Google fleet map. */
export default function OsmFleetMap({ vehicles, vehiclesById, highlightedId, focus, onSelectVehicle }) {
  const speedLimit = useSpeedLimit()
  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-slate-200">
      <OsmCanvas center={vehicles[0] ? positionOf(vehicles[0]) : DEFAULT_MAP_CENTER} zoom={12}>
        {vehicles.map((vehicle) => (
          <VanDot key={vehicle.id} vehicle={vehicle} highlighted={vehicle.id === highlightedId} onClick={onSelectVehicle} />
        ))}
        <FitOnFirstLoad vehicles={vehicles} />
        <FocusVehicle focus={focus} vehiclesById={vehiclesById} />
        <FitAllButton vehicles={vehicles} />
      </OsmCanvas>
      <div className="absolute bottom-3 left-3 z-[2] flex flex-wrap gap-x-3 gap-y-1 rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[0.7rem] text-slate-600 shadow">
        {Object.values(movementStates).map((state) => (
          <span key={state.label} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${state.dot}`} /> {state.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full ring-2 ring-red-500" /> Over {speedLimit} km/h
        </span>
      </div>
    </div>
  )
}
