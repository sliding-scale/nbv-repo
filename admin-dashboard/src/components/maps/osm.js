import L from 'leaflet'

/** A round marker. Leaflet's default image breaks under Vite, so markers are drawn as HTML. */
export function dotIcon(color, size = 16) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function toLatLng(point) {
  return [point.lat, point.lng]
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}
