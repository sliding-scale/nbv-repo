import { useEffect } from 'react'
import { MapContainer, useMap, ZoomControl } from 'react-leaflet'
import { setWorkerUrl } from 'maplibre-gl'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'leaflet/dist/leaflet.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import './osm-map.css'

setWorkerUrl(workerUrl)

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

function OpenFreeMap() {
  const map = useMap()
  useEffect(() => {
    const tiles = maplibreGL({ style: OPENFREEMAP_STYLE })
    tiles.addTo(map)
    return () => {
      map.removeLayer(tiles)
    }
  }, [map])
  return null
}

/** Leaflet map of OpenStreetMap tiles from OpenFreeMap. `center` is { lat, lng }. */
export default function OsmCanvas({ center, zoom = 12, children }) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} zoomControl={false} className="osm-map">
      <OpenFreeMap />
      <ZoomControl position="bottomright" />
      {children}
    </MapContainer>
  )
}
