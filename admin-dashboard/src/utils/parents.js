// Mirrors the backend rules in backend/convex/lib/parents.ts.
export const normaliseEmail = (value) => value.trim().toLowerCase()

/** Returns an error message, or null when the phone number is empty or valid. */
export function validatePhone(value) {
  const phone = value.trim()
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
    return 'Enter a valid phone number, e.g. +92 300 1234567.'
  }
  return null
}

/** "Invited 3 days ago" style line for the status column. */
export function statusSince(parent) {
  const at = { invited: parent.invitedAt, active: parent.activatedAt, deactivated: parent.deactivatedAt }[parent.status]
  if (!at) return null
  const days = Math.floor((Date.now() - at) / 86_400_000)
  const when = days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  const verb = { invited: 'Invited', active: 'Active since', deactivated: 'Deactivated' }[parent.status]
  return parent.status === 'active' ? `${verb} ${new Date(at).toLocaleDateString()}` : `${verb} ${when}`
}
