import { useEffect } from 'react'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { DEFAULT_MAP_CENTER } from '../../config/maps'
import OsmCanvas from './OsmCanvas'
import { dotIcon, toLatLng } from './osm'

function FollowPosition({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.panTo(toLatLng(position))
  }, [map, position])
  return null
}

function PlacePin({ onMove }) {
  useMapEvents({
    click(event) {
      if (onMove) onMove({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

/** One pin on OpenStreetMap. Click or drag moves it and reports { lat, lng }. */
export default function OsmPinMap({ position, onMove, className = 'h-64' }) {
  const editable = Boolean(onMove)
  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      <OsmCanvas center={position ?? DEFAULT_MAP_CENTER} zoom={position ? 16 : 12}>
        <PlacePin onMove={editable ? onMove : null} />
        {position && (
          <Marker
            position={toLatLng(position)}
            icon={dotIcon('#2563eb', 18)}
            draggable={editable}
            eventHandlers={
              editable
                ? {
                    dragend(event) {
                      const point = event.target.getLatLng()
                      onMove({ lat: point.lat, lng: point.lng })
                    },
                  }
                : undefined
            }
          />
        )}
        <FollowPosition position={position} />
      </OsmCanvas>
    </div>
  )
}
