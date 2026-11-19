import { useEffect, useState } from 'react';
import type { FunctionReturnType } from 'convex/server';
import { ConvexError } from 'convex/values';
import { api } from '@/lib/api';

/** What `api.parent.tracking.myVan` returns: the van (a status or its live position) and the child's stops. */
export type MyVan = FunctionReturnType<typeof api.parent.tracking.myVan>;
export type VanState = MyVan['van'];
export type LivePosition = Extract<VanState, { state: 'live' }>;

export type LatLng = { lat: number; lng: number };

/** The child's pickup or drop-off point, as drawn on the map. */
export type MapStop = LatLng & { kind: 'pickup' | 'dropoff'; label: string };

/** The child's stops that the school has set, ready for the map. */
export function stopsForMap(stops: MyVan['stops'] | undefined): MapStop[] {
  if (!stops) return [];
  const list: MapStop[] = [];
  if (stops.pickup) list.push({ kind: 'pickup', ...stops.pickup });
  if (stops.dropoff) list.push({ kind: 'dropoff', ...stops.dropoff });
  return list;
}

/** Google Maps key (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local). */
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
/** Web only: advanced markers need a Map ID; DEMO_MAP_ID works for development. */
export const GOOGLE_MAPS_MAP_ID = process.env.EXPO_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

/** Where the map opens before the van's position is known (Lahore, as in the admin dashboard). */
export const DEFAULT_CENTER: LatLng = { lat: 31.5204, lng: 74.3587 };
export const VAN_ZOOM = 16;
/** A normal 30-second step. A longer gap is placed on the map without sliding across the city. */
export const FOLLOW_GLIDE_KM = 0.8;

/** Great-circle distance in km, used to decide whether the camera should glide or jump. */
export function distanceKm(a: LatLng, b: LatLng) {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLng = (b.lng - a.lng) * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Trackers are polled every 30 s. A report older than this is shown as "not recent" (grey),
 * so the parent can tell the van may have moved since.
 */
export const STALE_AFTER_MS = 5 * 60_000;
export const isStale = (reportedAt: number, now: number) => now - reportedAt > STALE_AFTER_MS;

/** Current time, refreshed every `intervalMs`, so labels like "stale" update on their own. */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "1:13 PM" today, "Yesterday, 1:13 PM", otherwise "12 Nov, 1:13 PM". */
export function formatReportTime(reportedAt: number, now: number) {
  const at = new Date(reportedAt);
  const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  const today = new Date(now);
  if (sameDay(at, today)) return time;
  const yesterday = new Date(now);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(at, yesterday)) return `Yesterday, ${time}`;
  return `${at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`;
}

/** The `code` of a ConvexError thrown by the backend, e.g. "EMAIL_TAKEN", or null. */
export function convexErrorCode(error: unknown): string | null {
  if (error instanceof ConvexError && typeof error.data === 'object' && error.data && 'code' in error.data) {
    return String(error.data.code);
  }
  return null;
}

/** The backend's user-facing message for a ConvexError, or `fallback`. */
export function convexErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError && typeof error.data === 'object' && error.data && 'message' in error.data) {
    return String(error.data.message);
  }
  return fallback;
}
