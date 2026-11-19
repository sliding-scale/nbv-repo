// Effective parent tracking: who can actually see which van. Mirrors the parent app, so the
// dashboard shows what parents can do right now.
//
// A parent sees a van only if ALL of these are true:
//   - the school tracking switch is on (Settings)
//   - school tracking hours are open
//   - the parent's account isn't deactivated
//   - the van allows parent tracking (Vehicles tab)
//   - one of the parent's children rides that van

export const parentCanTrack = (parent) => parent.status !== 'deactivated'

/** Whether this parent can see a van right now. The school switch and the open window apply to every parent. */
export const parentTrackingLive = (parent, schedule) => {
  if (parent.status === 'deactivated') return false
  if (schedule?.enabled === false || schedule?.reason === 'forced_off') return false
  return schedule?.open === true
}

/**
 * `schedule` is the school-wide switch and the open window. A missing `enabled` means on.
 *
 * Returns
 *   byVehicle[vehicleId] = { allowed, parentCount, viewerCount, visible, scheduleOpen, scheduleEnabled, scheduleReason }
 *   byParent[parentId]   = { vanCount, visibleVanCount }
 * where `visible` means at least one parent can currently track the van.
 */
export function computeParentTracking(vehicles, students, parents, schedule = { open: true, enabled: true, reason: 'pickup' }) {
  const scheduleEnabled = schedule.enabled !== false && schedule.reason !== 'forced_off'
  const scheduleOpen = schedule.open === true
  const scheduleReason = schedule.reason ?? 'closed'
  const parentsById = Object.fromEntries(parents.map((p) => [p._id ?? p.id, p]))
  const vehiclesById = Object.fromEntries(vehicles.map((v) => [v._id ?? v.id, v]))

  const parentIdsByVehicle = {}
  const vehicleIdsByParent = {}
  for (const s of students) {
    if (!s.vehicleId) continue
    for (const pid of s.parentIds) {
      ;(parentIdsByVehicle[s.vehicleId] ??= new Set()).add(pid)
      ;(vehicleIdsByParent[pid] ??= new Set()).add(s.vehicleId)
    }
  }

  const canTrackNow = (parent) => parentTrackingLive(parent, { open: scheduleOpen, enabled: scheduleEnabled })

  const byVehicle = {}
  for (const v of vehicles) {
    const id = v._id ?? v.id
    const ids = [...(parentIdsByVehicle[id] ?? [])].filter((pid) => parentsById[pid])
    const viewerCount = ids.filter((pid) => canTrackNow(parentsById[pid])).length
    byVehicle[id] = {
      allowed: v.parentTrackingEnabled,
      parentCount: ids.length,
      viewerCount: v.parentTrackingEnabled ? viewerCount : 0,
      visible: v.parentTrackingEnabled && viewerCount > 0,
      scheduleOpen,
      scheduleEnabled,
      scheduleReason,
    }
  }

  const byParent = {}
  for (const p of parents) {
    const id = p._id ?? p.id
    const vans = [...(vehicleIdsByParent[id] ?? [])].map((vid) => vehiclesById[vid]).filter(Boolean)
    byParent[id] = {
      vanCount: vans.length,
      visibleVanCount: canTrackNow(p) ? vans.filter((v) => v.parentTrackingEnabled).length : 0,
    }
  }

  return { byVehicle, byParent }
}

/** Short label + tone for a vehicle's effective tracking, used in tables and cards. */
export function vehicleTrackingLabel(t) {
  if (!t.allowed) return { label: 'Off for this van', tone: 'gray' }
  if (t.parentCount === 0) return { label: 'No parents linked', tone: 'gray' }
  if (t.scheduleEnabled === false) return { label: 'Tracking off', tone: 'gray' }
  if (t.scheduleOpen === false) return { label: 'Off outside school hours', tone: 'gray' }
  if (t.viewerCount === 0) return { label: 'No active parents', tone: 'gray' }
  return { label: `Visible to ${t.viewerCount} ${t.viewerCount === 1 ? 'parent' : 'parents'}`, tone: 'blue' }
}
