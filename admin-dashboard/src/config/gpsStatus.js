// How fresh a vehicle's GPS location is. Graded by the backend from the age of the last fix
// (backend/convex/lib/ingestion.ts › gpsStatusFor); parked vans are allowed longer gaps.
export const gpsStatuses = {
  online: { label: 'GPS live', short: 'Live', tone: 'green', description: 'Recent GPS report' },
  weak: { label: 'Location stale', short: 'Stale', tone: 'amber', description: 'GPS hasn’t updated for a while' },
  offline: { label: 'Location unavailable', short: 'Unavailable', tone: 'red', description: 'No recent GPS report' },
}

/** Label for a vehicle, distinguishing "never reported" from "stopped reporting". */
export const gpsLabelFor = (vehicle) =>
  vehicle.lastUpdated ? gpsStatuses[vehicle.gpsStatus].label : 'No GPS data yet'

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/** 62 → "62° NE" */
export const formatHeading = (deg) => `${Math.round(deg)}° ${COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]}`
