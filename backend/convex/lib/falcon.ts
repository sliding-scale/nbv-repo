/**
 * Falcon-i (Novsight Pakistan) tracking API: request/response shapes and parsing.
 * Docs: "API User Manual v1.0". Verified against the live API:
 *   - POST /Login { Id, Password } → { token } (JWT, ~30-day expiry in its `exp` claim)
 *   - POST /Vehicle/LastLocationStatus { Vehicles: "PLATE1,PLATE2", V: 1.1, F: 1 }
 *       → { status: "OK", statusCode: 200, data: [...] }   (unknown plates are skipped;
 *         if none are known: { status: "NotFound", statusCode: 404, data: [] } with HTTP 200)
 *     The manual says GET-with-body; POST with the same body works and is what we use.
 *   - Expired/invalid token → HTTP 401.
 *   - gpsTime has no time zone; it is Pakistan time (UTC+5).
 * We use flag F=1 only: F=3 adds the owner's name and phone number, which we must not store.
 */

import type { NormalizedReport } from "./ingestion";

export const FALCON_PROVIDER = "falcon";
export const DEFAULT_FALCON_API_URL = "https://client-api.falconitracking.com";
/** UTC offset of Falcon-i's gpsTime values. Override with the FALCON_GPS_UTC_OFFSET env var. */
export const DEFAULT_GPS_UTC_OFFSET = "+05:00";

/** One item of `data` in a LastLocationStatus response (flag 1). */
export type FalconReport = {
  vrn?: string;
  gpsTime?: string; // "2026-11-10T21:00:53" (local time, no offset)
  serverTime?: string; // always "0001-01-01T00:00:00" in practice; ignored
  speed?: number; // km/h
  ignitionStatus?: string; // "ON" | "OFF"
  lat?: number;
  lng?: number;
  landMark?: string; // "0.11 Km away From, Ziauddin Hospital, Karachi, Pakistan"
  angle?: number; // heading in degrees
  alertName?: string;
};

export type FalconLocationResponse = {
  status?: string;
  statusCode?: number;
  data?: FalconReport[];
  count?: number;
};

/** "2026-11-10T21:00:53" + "+05:00" → ms since epoch, or null if unparseable. */
export function parseFalconTime(gpsTime: string | undefined, utcOffset: string): number | null {
  if (!gpsTime || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(gpsTime)) return null;
  // Already has a zone (Z or ±hh:mm)? Use it as-is; otherwise apply the configured offset.
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(gpsTime);
  const ms = Date.parse(hasZone ? gpsTime : gpsTime.slice(0, 19) + utcOffset);
  return Number.isFinite(ms) ? ms : null;
}

/** Convert a Falcon-i report to our provider-neutral shape, or null if it's unusable. */
export function normalizeFalconReport(raw: FalconReport, utcOffset: string): NormalizedReport | null {
  const gpsAt = parseFalconTime(raw.gpsTime, utcOffset);
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  const speed = Number(raw.speed);
  const ignition = String(raw.ignitionStatus ?? "").trim().toUpperCase();
  if (!raw.vrn || gpsAt === null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (ignition !== "ON" && ignition !== "OFF") return null;

  return {
    vehicleKey: raw.vrn,
    gpsAt,
    lat,
    lng,
    speed: Number.isFinite(speed) && speed >= 0 ? speed : 0,
    ignition: ignition === "ON" ? "on" : "off",
    address: (raw.landMark ?? "").trim(),
    heading: Number.isFinite(Number(raw.angle)) ? Number(raw.angle) % 360 : null,
  };
}

/** Read `exp` from a JWT without verifying it (we only need to know when to log in again). */
export function jwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}
