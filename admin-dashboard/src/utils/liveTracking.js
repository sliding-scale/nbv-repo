// Helpers for the Live Tracking map: what state each van is in and how to draw it.
import { IDLE_SPEED_KMH } from '../config/telemetry'

/** Marker colours per movement state. Full class names so Tailwind can detect them. */
export const movementStates = {
  moving: { label: 'Moving', color: '#2563eb', dot: 'bg-blue-600' },
  idling: { label: 'Idling', color: '#f59e0b', dot: 'bg-amber-500' },
  parked: { label: 'Parked', color: '#64748b', dot: 'bg-slate-500' },
}

/** moving = ignition on and above idle speed; idling = ignition on but (almost) still; parked = ignition off. */
export function movementStateFor(vehicle) {
  if (vehicle.ignition !== 'on') return 'parked'
  return vehicle.speed > IDLE_SPEED_KMH ? 'moving' : 'idling'
}

export const isSpeeding = (vehicle, limit) => vehicle.speed > limit

/** In-service vans are the ones shown on the live map. */
export const isActiveVehicle = (vehicle) => vehicle.status === 'active'

export const hasPosition = (vehicle) =>
  Boolean(vehicle.location) && Number.isFinite(vehicle.location.lat) && Number.isFinite(vehicle.location.lng)

export const positionOf = (vehicle) => ({ lat: vehicle.location.lat, lng: vehicle.location.lng })
