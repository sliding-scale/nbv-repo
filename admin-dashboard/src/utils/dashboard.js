// Pure helpers that turn raw vehicle/trip data into dashboard figures.
// When the backend is ready these can move into a Convex query unchanged.

export function getDashboardSummary(vehicles, trips, alerts) {
  const count = (fn) => vehicles.filter(fn).length

  return {
    totalVehicles: vehicles.length,
    activeVehicles: count((v) => v.status === 'active'),
    inactiveVehicles: count((v) => v.status === 'inactive'),
    movingVehicles: count((v) => v.status === 'active' && v.speed > 0),
    gpsIssues: count((v) => v.gpsStatus !== 'online'),
    // Effective: at least one parent can currently see the van (see utils/tracking.js).
    trackingEnabled: count((v) => v.parentTracking.visible),
    trackingDisabled: count((v) => !v.parentTracking.visible),
    activeTrips: trips.length,
    recentSpeedAlerts: alerts.length,
  }
}

export function getGpsBreakdown(vehicles) {
  const counts = { online: 0, weak: 0, offline: 0 }
  for (const v of vehicles) counts[v.gpsStatus] += 1
  return counts
}

export function indexById(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]))
}

export function timeAgo(iso) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso)) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.round(hours / 24)} d ago`
}

export const formatToday = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

export const percent = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 100))
