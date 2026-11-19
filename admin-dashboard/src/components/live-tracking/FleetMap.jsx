import { useEffect, useRef } from 'react'
import { Map, useMap } from '@vis.gl/react-google-maps'
import { Maximize } from 'lucide-react'
import { DEFAULT_MAP_CENTER, GOOGLE_MAPS_MAP_ID } from '../../config/maps'
import OsmFleetMap from '../maps/OsmFleetMap'
import { withMapFallback } from '../maps/withMapFallback'
import { useSpeedLimit } from '../../hooks/useSpeedLimit'
import { movementStates, positionOf } from '../../utils/liveTracking'
import VehicleMarker from './VehicleMarker'

const FOCUS_ZOOM = 16

function fitTo(map, vehicles) {
  if (!map || vehicles.length === 0) return
  if (vehicles.length === 1) {
    map.panTo(positionOf(vehicles[0]))
    map.setZoom(FOCUS_ZOOM)
    return
  }
  const bounds = new window.google.maps.LatLngBounds()
  for (const v of vehicles) bounds.extend(positionOf(v))
  map.fitBounds(bounds, 64)
}

// Frames every van the first time positions arrive; after that the admin controls the view.
function FitOnFirstLoad({ vehicles }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || !map || vehicles.length === 0) return
    done.current = true
    fitTo(map, vehicles)
  }, [map, vehicles])
  return null
}

// Pans to the van picked from the side list. `focus.at` lets the same van be re-focused.
// The latest positions are read through a ref so live updates don't re-pan the map.
function FocusVehicle({ focus, vehiclesById }) {
  const map = useMap()
  const latest = useRef(vehiclesById)
  useEffect(() => {
    latest.current = vehiclesById
  })
  useEffect(() => {
    const vehicle = focus && latest.current[focus.id]
    if (!map || !vehicle) return
    map.panTo(positionOf(vehicle))
    if ((map.getZoom() ?? 0) < FOCUS_ZOOM) map.setZoom(FOCUS_ZOOM)
  }, [map, focus])
  return null
}

function FitAllButton({ vehicles }) {
  const map = useMap()
  return (
    <button
      type="button"
      onClick={() => fitTo(map, vehicles)}
      disabled={vehicles.length === 0}
      className="absolute top-3 left-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Maximize size={13} /> Show all vans
    </button>
  )
}

function Legend() {
  const speedLimit = useSpeedLimit()
  return (
    <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[0.7rem] text-slate-600 shadow">
      {Object.values(movementStates).map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1.5">
          <span className={`size-2.5 rounded-full ${s.dot}`} /> {s.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full ring-2 ring-red-500" /> Over {speedLimit} km/h
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-slate-400 opacity-50" /> GPS stale
      </span>
    </div>
  )
}

/** Google map with every located active van. Clicking a van calls onSelectVehicle(vehicle). */
function GoogleFleetMap({ vehicles, vehiclesById, highlightedId, focus, onSelectVehicle }) {
  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-slate-200">
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={DEFAULT_MAP_CENTER}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        fullscreenControl
        clickableIcons={false}
      >
        {vehicles.map((v) => (
          <VehicleMarker key={v.id} vehicle={v} highlighted={v.id === highlightedId} onClick={onSelectVehicle} />
        ))}
        <FitOnFirstLoad vehicles={vehicles} />
        <FocusVehicle focus={focus} vehiclesById={vehiclesById} />
        <FitAllButton vehicles={vehicles} />
      </Map>
      <Legend />
    </div>
  )
}

export default withMapFallback(GoogleFleetMap, OsmFleetMap)
