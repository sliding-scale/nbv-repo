import { useEffect } from 'react'
import { AdvancedMarker, Map, Pin, useMap } from '@vis.gl/react-google-maps'
import { DEFAULT_MAP_CENTER, GOOGLE_MAPS_MAP_ID } from '../../config/maps'
import OsmPinMap from '../maps/OsmPinMap'
import { withMapFallback } from '../maps/withMapFallback'

// Keeps the map centred on the pin whenever the pin moves.
function FollowPosition({ position }) {
  const map = useMap()
  useEffect(() => {
    if (map && position) map.panTo(position)
  }, [map, position])
  return null
}

/**
 * Map with a single pin. When `onMove` is given, the admin can drag the pin
 * or click the map to place it; onMove receives { lat, lng }.
 */
function GooglePinMap({ position, onMove, className = 'h-64' }) {
  const editable = Boolean(onMove)

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      <Map
        mapId={GOOGLE_MAPS_MAP_ID}
        defaultCenter={position ?? DEFAULT_MAP_CENTER}
        defaultZoom={position ? 16 : 12}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        onClick={editable ? (e) => e.detail.latLng && onMove(e.detail.latLng) : undefined}
      >
        {position && (
          <AdvancedMarker
            position={position}
            draggable={editable}
            onDragEnd={editable ? (e) => e.latLng && onMove({ lat: e.latLng.lat(), lng: e.latLng.lng() }) : undefined}
          >
            <Pin background="#2563eb" borderColor="#1e40af" glyphColor="#fff" />
          </AdvancedMarker>
        )}
        <FollowPosition position={position} />
      </Map>
    </div>
  )
}

export default withMapFallback(GooglePinMap, OsmPinMap)
