/** School clock, matching the backend (Asia/Karachi). Safe to call from the app; not from a Convex query. */
const TIME_ZONE = 'Asia/Karachi';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function schoolYearMonth(now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date(now));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month') };
}

export function monthName(month: number) {
  return MONTHS[month - 1] ?? '';
}

export function greeting(now = Date.now()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', hourCycle: 'h23' }).format(new Date(now)),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export function formatFee(amount: number) {
  return `Rs ${amount.toLocaleString('en-US')}`;
}

/** "18 Nov 2026" in the school timezone. */
export function formatPaidOn(ms: number) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
}
