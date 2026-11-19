/**
 * Provider-neutral tracker ingestion. Each tracker integration (convex/integrations/*)
 * converts its API's data into NormalizedReport and calls ingestReport(); everything the
 * dashboard shows (live state, GPS history, ignition events, trips, speed alerts) is
 * derived here, in one place.
 */

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { haversineKm, isPlausibleStep, isUsableFix, maxSpeed, trackDistanceKm } from "./geo";
import {
  GPS_ONLINE_MAX_AGE_MS,
  GPS_STALE_MAX_AGE_MS,
  MIN_MOVE_METRES,
  PARKED_SAMPLE_MS,
} from "./monitoringConfig";
import { normalizeCode } from "./vehicles";

export type NormalizedReport = {
  vehicleKey: string; // registration number (Falcon-i "vrn")
  gpsAt: number; // GPS fix time, ms since epoch
  lat: number;
  lng: number;
  speed: number; // km/h
  ignition: "on" | "off";
  address: string; // "" if unknown
  heading: number | null;
};

export type IngestOutcome = "stored" | "duplicate" | "unknown_vehicle" | "inactive_vehicle";

/** online / weak (stale) / offline from how old the last GPS fix is (parked vans report less often). */
export function gpsStatusFor(reportedAt: number, ignition: "on" | "off", now: number): "online" | "weak" | "offline" {
  const mode = ignition === "on" ? "driving" : "parked";
  const age = now - reportedAt;
  if (age <= GPS_ONLINE_MAX_AGE_MS[mode]) return "online";
  if (age <= GPS_STALE_MAX_AGE_MS[mode]) return "weak";
  return "offline";
}

/** Look a report's vehicle up by registration number (case/space-insensitive). */
export async function findVehicle(ctx: MutationCtx, vehicleKey: string) {
  return await ctx.db
    .query("vehicles")
    .withIndex("by_registrationNormalized", (q) => q.eq("registrationNormalized", normalizeCode(vehicleKey)))
    .first();
}

const point = (r: NormalizedReport) => ({ lat: r.lat, lng: r.lng, address: r.address });

async function openTrip(
  ctx: MutationCtx,
  vehicle: Doc<"vehicles">,
  r: NormalizedReport,
  location: { lat: number; lng: number; address: string },
) {
  const riders = await ctx.db
    .query("students")
    .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicle._id))
    .collect();
  return await ctx.db.insert("trips", {
    vehicleId: vehicle._id,
    type: "",
    status: "in_progress",
    startedAt: r.gpsAt,
    endedAt: null,
    studentsOnboard: 0, // not reported by the tracker
    totalStudents: riders.filter((s) => s.status === "active").length,
    progress: null,
    eta: null,
    startLocation: location,
    endLocation: null,
    distanceKm: null,
    maxSpeed: null,
  });
}

async function closeTrip(
  ctx: MutationCtx,
  tripId: Id<"trips">,
  r: NormalizedReport,
  location: { lat: number; lng: number; address: string },
) {
  const trip = await ctx.db.get(tripId);
  if (!trip || trip.endedAt !== null) return;
  const positions = await ctx.db
    .query("positions")
    .withIndex("by_vehicle_t", (q) => q.eq("vehicleId", trip.vehicleId).gte("t", trip.startedAt).lte("t", r.gpsAt))
    .collect();
  await ctx.db.patch(tripId, {
    status: "completed",
    endedAt: r.gpsAt,
    endLocation: location,
    distanceKm: trackDistanceKm(positions),
    maxSpeed: maxSpeed(positions),
  });
}

/**
 * Process one tracker report. Idempotent: a report whose GPS time isn't newer than the
 * last one processed for that vehicle is ignored (duplicates and out-of-order reports).
 */
export async function ingestReport(
  ctx: MutationCtx,
  provider: string,
  r: NormalizedReport,
  now: number,
  speedLimitKmh: number,
): Promise<IngestOutcome> {
  const vehicle = await findVehicle(ctx, r.vehicleKey);
  if (!vehicle) return "unknown_vehicle";
  if (vehicle.status !== "active") return "inactive_vehicle";

  const state = await ctx.db.query("trackerState").withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicle._id)).unique();
  if (state && r.gpsAt <= state.lastGpsAt) return "duplicate";

  const ignitionChanged = state !== null && state.ignition !== r.ignition;
  let openTripId = state?.openTripId ?? null;
  let openAlertId = state?.openAlertId ?? null;

  // The map keeps the last believable fix. A missing fix or an impossible jump stays in
  // history, but it does not move the pin, the trip's start/end, or the speed-alert place.
  const shown = vehicle.telemetry;
  const anchor =
    state?.lastAccepted ??
    (shown && isUsableFix(shown) ? { t: shown.reportedAt, lat: shown.lat, lng: shown.lng } : null);
  const accepted = isUsableFix(r) && (anchor === null || isPlausibleStep(anchor, { t: r.gpsAt, lat: r.lat, lng: r.lng }));
  const place = accepted
    ? { lat: r.lat, lng: r.lng, address: r.address, heading: r.heading }
    : shown
      ? { lat: shown.lat, lng: shown.lng, address: shown.address, heading: shown.heading }
      : null;
  const where = place ? { lat: place.lat, lng: place.lng, address: place.address } : point(r);

  // 1. Store the GPS point. Every point while the engine is on; while parked only when the van
  //    moved or every few minutes, so parked vans don't flood the table with identical points.
  const last = state?.lastStored ?? null;
  const movedMetres = last ? haversineKm(last, r) * 1000 : Infinity;
  const shouldStore =
    r.ignition === "on" || ignitionChanged || !last || movedMetres >= MIN_MOVE_METRES || r.gpsAt - last.t >= PARKED_SAMPLE_MS;
  if (shouldStore) {
    await ctx.db.insert("positions", {
      vehicleId: vehicle._id,
      t: r.gpsAt,
      lat: r.lat,
      lng: r.lng,
      speed: r.speed,
      heading: r.heading,
      ignition: r.ignition,
    });
  }

  // 2. Ignition: OFF → ON starts a trip, ON → OFF ends it (requirements 4.4, 4.7).
  if (!state && r.ignition === "on") {
    // First report ever and the engine is already running: we didn't see it start, so open a
    // trip from here but don't raise an ignition notification for a change we didn't observe.
    openTripId = await openTrip(ctx, vehicle, r, where);
  } else if (ignitionChanged && r.ignition === "on") {
    openTripId = await openTrip(ctx, vehicle, r, where);
    await ctx.db.insert("ignitionEvents", { vehicleId: vehicle._id, at: r.gpsAt, state: "on", location: where, tripId: openTripId });
  } else if (ignitionChanged && r.ignition === "off") {
    const endedTrip = openTripId;
    if (endedTrip) await closeTrip(ctx, endedTrip, r, where);
    openTripId = null;
    await ctx.db.insert("ignitionEvents", { vehicleId: vehicle._id, at: r.gpsAt, state: "off", location: where, tripId: endedTrip });
  }

  // 3. Speed: one alert per continuous speeding event (requirement 4.6).
  if (r.speed > speedLimitKmh) {
    const open = openAlertId ? await ctx.db.get(openAlertId) : null;
    if (open && open.endedAt === null) {
      if (r.speed > open.speed) {
        await ctx.db.patch(open._id, { speed: r.speed, lat: where.lat, lng: where.lng, address: where.address });
      }
    } else {
      openAlertId = await ctx.db.insert("speedAlerts", {
        vehicleId: vehicle._id,
        at: r.gpsAt,
        speed: r.speed,
        speedLimit: speedLimitKmh,
        lat: where.lat,
        lng: where.lng,
        address: where.address,
        endedAt: null,
        tripId: openTripId,
      });
    }
  } else if (openAlertId) {
    await ctx.db.patch(openAlertId, { endedAt: r.gpsAt });
    openAlertId = null;
  }

  // 4. Live state shown everywhere in the dashboard. A rejected fix keeps the last place.
  if (place) {
    await ctx.db.patch(vehicle._id, {
      telemetry: {
        ignition: r.ignition,
        speed: r.speed,
        gpsStatus: gpsStatusFor(r.gpsAt, r.ignition, now),
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        heading: place.heading,
        reportedAt: r.gpsAt,
      },
    });
  }

  // 5. Remember this report for the next comparison. lastAccepted stays on the fix the map shows.
  const lastAccepted = accepted ? { t: r.gpsAt, lat: r.lat, lng: r.lng } : (state?.lastAccepted ?? anchor);
  const nextState = {
    vehicleId: vehicle._id,
    provider,
    lastGpsAt: r.gpsAt,
    ignition: r.ignition,
    openTripId,
    openAlertId,
    lastStored: shouldStore ? { t: r.gpsAt, lat: r.lat, lng: r.lng } : (last ?? null),
    ...(lastAccepted ? { lastAccepted } : {}),
  };
  if (state) await ctx.db.patch(state._id, nextState);
  else await ctx.db.insert("trackerState", nextState);

  return "stored";
}

/**
 * Re-grade every vehicle's GPS status by the age of its last fix, so a tracker that stops
 * reporting is shown as stale ("weak") and then unavailable ("offline") (requirement 4.2).
 */
export async function refreshGpsStatuses(ctx: MutationCtx, now: number) {
  let changed = 0;
  for (const v of await ctx.db.query("vehicles").collect()) {
    if (!v.telemetry) continue;
    const status = gpsStatusFor(v.telemetry.reportedAt, v.telemetry.ignition, now);
    if (status !== v.telemetry.gpsStatus) {
      await ctx.db.patch(v._id, { telemetry: { ...v.telemetry, gpsStatus: status } });
      changed++;
    }
  }
  return changed;
}
