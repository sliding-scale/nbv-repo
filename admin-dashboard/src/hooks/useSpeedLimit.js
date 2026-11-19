import { useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import { SPEED_LIMIT_KMH } from '../config/telemetry'

/** The fleet speed limit in km/h. Falls back to 60 while settings are loading or unset. */
export function useSpeedLimit() {
  const settings = useQuery(api.admin.finance.getSettings)
  return settings?.speedLimitKmh ?? SPEED_LIMIT_KMH
}
