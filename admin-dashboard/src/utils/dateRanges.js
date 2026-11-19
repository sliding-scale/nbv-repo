// Date-range presets for history views, using the admin's local calendar days.

export const DAY = 86_400_000

export const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom dates' },
]

export const midnight = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const toInputDate = (ms) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const fromInputDate = (value) => {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

/** [from, to) in ms for a preset. `today` is local midnight; custom end dates are inclusive. */
export function rangeFor(preset, customFrom, customTo, today) {
  const tomorrow = today + DAY
  switch (preset) {
    case 'yesterday':
      return [today - DAY, today]
    case 'last7':
      return [today - 6 * DAY, tomorrow]
    case 'last30':
      return [today - 29 * DAY, tomorrow]
    case 'custom': {
      const from = customFrom ? fromInputDate(customFrom) : today
      const to = customTo ? fromInputDate(customTo) + DAY : tomorrow
      return from < to ? [from, to] : [to - DAY, from + DAY]
    }
    default:
      return [today, tomorrow]
  }
}
