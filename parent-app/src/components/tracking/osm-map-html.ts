/** Leaflet page used when Google Maps cannot draw. Tiles come from OpenFreeMap (OpenStreetMap data, no key). */
export const OSM_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl.css" />
<style>html,body,#map{height:100%;margin:0;background:#f1f5f9}.maplibregl-ctrl-attrib,.leaflet-control-attribution{font-size:11px}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl.js"></script>
<script src="https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js"></script>
<script>
var map = L.map('map', { zoomControl: false }).setView([31.5204, 74.3587], 12);
L.maplibreGL({ style: 'https://tiles.openfreemap.org/styles/liberty' }).addTo(map);
var layer = L.layerGroup().addTo(map);
var framed = false;
var lastVan = null;
var lastFollow = true;
function icon(color, size) {
  return L.divIcon({
    className: '',
    html: '<span style="display:block;width:' + size + 'px;height:' + size + 'px;border-radius:999px;background:' + color + ';border:2px solid #fff;box-shadow:0 1px 4px rgba(15,23,42,.35)"></span>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}
function apply(state) {
  layer.clearLayers();
  (state.stops || []).forEach(function (stop) {
    L.marker([stop.lat, stop.lng], {
      icon: icon(stop.kind === 'pickup' ? '#2563eb' : '#16a34a', 14),
      interactive: false
    }).addTo(layer);
  });
  if (state.van) {
    L.marker([state.van.lat, state.van.lng], {
      icon: icon(state.stale ? '#94a3b8' : '#2563eb', 18),
      interactive: false,
      zIndexOffset: 1000
    }).addTo(layer);
  }
  if (!state.loaded) return;
  var vanKey = state.van ? state.van.lat + ',' + state.van.lng : null;
  if (!framed) {
    framed = true;
    lastVan = vanKey;
    lastFollow = !!state.follow;
    var points = (state.van ? [state.van] : []).concat(state.stops || []);
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 16);
    else if (points.length > 1) map.fitBounds(points.map(function (point) { return [point.lat, point.lng]; }), { padding: [80, 80] });
    return;
  }
  var recentred = !!state.follow && !lastFollow;
  var moved = vanKey !== lastVan;
  var previous = lastVan ? lastVan.split(',') : null;
  var glide = false;
  if (state.van && previous && previous.length === 2) {
    var toRad = Math.PI / 180;
    var dLat = (state.van.lat - Number(previous[0])) * toRad;
    var dLng = (state.van.lng - Number(previous[1])) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Number(previous[0]) * toRad) * Math.cos(state.van.lat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    glide = 2 * 6371 * Math.asin(Math.sqrt(h)) <= 0.8;
  }
  lastFollow = !!state.follow;
  lastVan = vanKey;
  if (state.van && state.follow && (recentred || moved)) {
    if (glide) map.panTo([state.van.lat, state.van.lng]);
    else map.setView([state.van.lat, state.van.lng], map.getZoom(), { animate: false });
    if (recentred && map.getZoom() < 16) map.setZoom(16);
  }
}
function onMessage(event) {
  if (typeof event.data !== 'string' || event.data.charAt(0) !== '{') return;
  try { apply(JSON.parse(event.data)); } catch (error) {}
}
document.addEventListener('message', onMessage);
window.addEventListener('message', onMessage);
map.on('dragstart', function () {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('pan');
  else if (window.parent && window.parent !== window) window.parent.postMessage('pan', '*');
});
</script>
</body>
</html>`;
