// Pure calculations over raw GPS/ignition data. No React, no mock data, so this
// can move into a Convex function unchanged once real tracker data arrives.
//
// Track point: { t: ms timestamp, lat, lng, speed: km/h }
// Ignition event: { at: ms timestamp, state: 'on' | 'off' }

import { IDLE_SPEED_KMH } from '../config/telemetry'

const EARTH_RADIUS_KM = 6371
const toRad = (deg) => (deg * Math.PI) / 180

/** Great-circle distance between two points, in km (haversine formula). */
export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

// A jump implying more than this speed is a GPS glitch, not real movement.
const MAX_PLAUSIBLE_KMH = 160

const isValidPoint = (p) =>
  Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 && !(p.lat === 0 && p.lng === 0)

/**
 * Points safe to measure distance with: valid coordinates, time-ordered, no duplicate
 * timestamps, no impossible jumps. Mirrors cleanTrack() in backend/convex/lib/geo.ts.
 */
export function cleanTrack(track) {
  const out = []
  for (const p of track.filter(isValidPoint).sort((a, b) => a.t - b.t)) {
    const prev = out.at(-1)
    if (prev) {
      if (p.t === prev.t) continue
      if (haversineKm(prev, p) / ((p.t - prev.t) / 3_600_000) > MAX_PLAUSIBLE_KMH) continue
    }
    out.push(p)
  }
  return out
}

/** Distance travelled along a track in km, after dropping duplicate/invalid GPS points. */
export function trackDistanceKm(track) {
  const clean = cleanTrack(track)
  let km = 0
  for (let i = 1; i < clean.length; i++) km += haversineKm(clean[i - 1], clean[i])
  return km
}

/** Speed statistics for a track. Average is over moving time only, so idling doesn't drag it down. */
export function speedStats(track) {
  if (track.length === 0) return { max: 0, avgMoving: 0, maxAt: null }
  let max = track[0]
  let movingSum = 0
  let movingCount = 0
  for (const p of track) {
    if (p.speed > max.speed) max = p
    if (p.speed > IDLE_SPEED_KMH) {
      movingSum += p.speed
      movingCount++
    }
  }
  return { max: max.speed, maxAt: max.t, avgMoving: movingCount ? movingSum / movingCount : 0 }
}

// Gaps between track points longer than this aren't counted as idling (tracker was off/asleep).
const MAX_SAMPLE_GAP_MS = 2 * 60_000

/**
 * Ignition summary from a day's on/off events (oldest first) up to `now`.
 * `tracks` is one GPS track per trip; idle time is measured within each track only.
 * Returns { state, since, onMs, idleMs, sessions: [{ start, end|null }] }.
 */
export function ignitionSummary(events, tracks, now) {
  const sessions = []
  let open = null
  for (const e of events) {
    if (e.state === 'on' && !open) open = { start: e.at, end: null }
    if (e.state === 'off' && open) {
      open.end = e.at
      sessions.push(open)
      open = null
    }
  }
  if (open) sessions.push(open)

  const onMs = sessions.reduce((sum, s) => sum + ((s.end ?? now) - s.start), 0)

  // Idle = ignition on while (nearly) stationary, measured between consecutive track points.
  let idleMs = 0
  for (const track of tracks) {
    for (let i = 1; i < track.length; i++) {
      const gap = track[i].t - track[i - 1].t
      if (track[i - 1].speed <= IDLE_SPEED_KMH && gap <= MAX_SAMPLE_GAP_MS) idleMs += gap
    }
  }

  const last = events.at(-1)
  return { state: last?.state ?? 'off', since: last?.at ?? null, onMs, idleMs, sessions }
}

/** "1 h 05 min", "12 min", "45 s" */
export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  if (totalSeconds < 60) return `${totalSeconds} s`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${String(minutes % 60).padStart(2, '0')} min`
}

export const formatKm = (km) => `${km < 10 ? km.toFixed(2) : km.toFixed(1)} km`

export const formatClock = (ms) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })

export const formatDateTime = (ms) =>
  new Date(ms).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
