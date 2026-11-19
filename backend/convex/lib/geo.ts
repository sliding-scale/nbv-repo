/**
 * GPS maths shared by monitoring queries (and, later, tracker ingestion).
 * Mirrors admin-dashboard/src/utils/telemetry.js so both sides agree on distances.
 */

export type TrackPoint = { t: number; lat: number; lng: number; speed: number };

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Faster than any school van can go: a jump implying more than this is a GPS glitch. */
const MAX_PLAUSIBLE_KMH = 160;

/** A real GPS fix. `0, 0` is a tracker with no position, not a place in the ocean. */
export function isUsableFix(p: { lat: number; lng: number }) {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180 &&
    !(p.lat === 0 && p.lng === 0)
  );
}

/** True when `next` could be the same van a moment after `prev`, rather than a GPS jump. */
export function isPlausibleStep(
  prev: { t: number; lat: number; lng: number },
  next: { t: number; lat: number; lng: number },
) {
  if (!isUsableFix(next) || next.t <= prev.t) return false;
  const hours = (next.t - prev.t) / 3_600_000;
  return haversineKm(prev, next) / hours <= MAX_PLAUSIBLE_KMH;
}

/** Great-circle distance between two points, in km (haversine formula). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Points safe to measure distance with: valid coordinates, time-ordered, no duplicate
 * timestamps, and no impossible jumps (which would inflate the distance).
 */
export function cleanTrack(points: TrackPoint[]): TrackPoint[] {
  const sorted = points.filter(isUsableFix).sort((a, b) => a.t - b.t);
  const out: TrackPoint[] = [];
  for (const p of sorted) {
    const prev = out[out.length - 1];
    if (prev && !isPlausibleStep(prev, p)) continue;
    out.push(p);
  }
  return out;
}

/** Distance along a track in km, after dropping duplicate/invalid points. */
export function trackDistanceKm(points: TrackPoint[]) {
  const track = cleanTrack(points);
  let km = 0;
  for (let i = 1; i < track.length; i++) km += haversineKm(track[i - 1], track[i]);
  return km;
}

export const maxSpeed = (points: TrackPoint[]) =>
  points.reduce((max, p) => (Number.isFinite(p.speed) && p.speed > max ? p.speed : max), 0);
