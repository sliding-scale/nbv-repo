// GS IDs are compared case-insensitively and without surrounding spaces.
export const normaliseGsId = (value) => value.trim().toUpperCase()

/**
 * Every distinct location already saved on a student, so admins can reuse one
 * (e.g. siblings sharing a home, or a school gate) instead of searching again.
 * Returns [{ location, usedBy }] where usedBy is a short "Ayesha Khan +2" label.
 */
export function collectSavedLocations(students) {
  const byKey = new Map()
  for (const s of students) {
    for (const location of [s.pickupLocation, s.dropoffLocation]) {
      if (!location) continue
      const key = `${location.address}|${location.lat.toFixed(5)}|${location.lng.toFixed(5)}`
      const entry = byKey.get(key) ?? { location, names: new Set() }
      entry.names.add(s.fullName)
      byKey.set(key, entry)
    }
  }
  return [...byKey.values()]
    .map(({ location, names }) => {
      const [first, ...rest] = [...names]
      return { location, usedBy: rest.length ? `${first} +${rest.length}` : first }
    })
    .sort((a, b) => a.location.address.localeCompare(b.location.address))
}
