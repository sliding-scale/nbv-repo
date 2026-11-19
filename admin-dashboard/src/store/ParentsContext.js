import { createContext, useContext } from 'react'

export const ParentsContext = createContext(null)

/**
 * Returns { parents, isLoading, trackingSchedule, addParent, updateParent, deactivateParent, reactivateParent }.
 * Each parent has `studentIds` (its associated students). Backed by Convex:
 * backend/convex/admin/parents.ts. The mutations return promises.
 */
export function useParents() {
  const ctx = useContext(ParentsContext)
  if (!ctx) throw new Error('useParents must be used inside <FleetProvider>')
  return ctx
}
