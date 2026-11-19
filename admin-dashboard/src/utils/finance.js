/** School calendar for fees. Matches backend/convex/lib/finance.ts (Pakistan, no daylight saving). */
export const SCHOOL_TIME_ZONE = 'Asia/Karachi'

export function schoolYearMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHOOL_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now)
  const read = (type) => Number(parts.find((part) => part.type === type)?.value)
  return { year: read('year'), month: read('month') }
}

export function monthInputValue({ year, month }) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseMonthInput(value) {
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

export function formatMonth(year, month) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  )
}

export function formatFee(amount) {
  return `Rs ${Number(amount).toLocaleString('en-US')}`
}

export function formatPaidDate(ms) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: SCHOOL_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(ms)
}

export function arrearsLabel(count) {
  return count === 1 ? '1 month unpaid' : `${count} months unpaid`
}

/** A ledger row joined to the student, parents, and van already loaded in the dashboard. */
export function toFeeRow(charge, studentsById, parentsById, vehiclesById, arrears = 0) {
  const student = studentsById[charge.studentId]
  const parents = (student?.parentIds ?? []).map((id) => parentsById[id]).filter(Boolean)
  const vehicle = student?.vehicleId ? vehiclesById[student.vehicleId] : null
  return {
    id: charge._id,
    studentId: charge.studentId,
    studentName: student?.fullName ?? 'Unknown student',
    parentLabel: parents.map((parent) => parent.fullName).join(', '),
    vehicleId: student?.vehicleId ?? null,
    vanName: vehicle?.name ?? '',
    year: charge.year,
    month: charge.month,
    amount: charge.amount,
    status: charge.status,
    paidAt: charge.paidAt,
    arrears,
  }
}
