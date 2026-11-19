// Fallback until Settings has a saved speed limit. The live value comes from useSpeedLimit().

/** Default speed limit in km/h. Matches backend/convex/lib/monitoringConfig.ts. */
export const SPEED_LIMIT_KMH = 60

/** A vehicle with ignition on and speed at or below this (km/h) counts as idling. */
export const IDLE_SPEED_KMH = 2
