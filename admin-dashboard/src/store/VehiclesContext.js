import { createContext, useContext } from 'react'

export const VehiclesContext = createContext(null)

/**
 * Returns { vehicles, isLoading, addVehicle, updateVehicle, deleteVehicle, setVehicleStatus }.
 * Each vehicle has derived studentIds plus its latest telemetry flattened into
 * ignition / speed / gpsStatus / location / lastUpdated. Backed by backend/convex/admin/vehicles.ts.
 */
export function useVehicles() {
  const ctx = useContext(VehiclesContext)
  if (!ctx) throw new Error('useVehicles must be used inside <FleetProvider>')
  return ctx
}
