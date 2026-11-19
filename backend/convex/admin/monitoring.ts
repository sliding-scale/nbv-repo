/**
 * Live monitoring reads for the admin dashboard. The tables are filled by tracker
 * ingestion (not built yet), so these return empty results until trackers report.
 *
 *   useQuery(api.admin.monitoring.activeTrips)
 *   useQuery(api.admin.monitoring.tripHistory, { from, to, vehicleId? })
 *   useQuery(api.admin.monitoring.speedAlertHistory, { paginationOpts, vehicleId? })
 *   useQuery(api.admin.monitoring.recentSpeedAlerts, { since })
 *   useQuery(api.admin.monitoring.vehicleDay, { vehicleId, since })
 */
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { query, type QueryCtx } from "../_generated/server";
import { requireAdmin } from "../lib/auth";
import { maxSpeed, trackDistanceKm } from "../lib/geo";

/** Most trips the history view returns at once. */
const HISTORY_LIMIT = 500;

async function positionsFor(ctx: QueryCtx, trip: Doc<"trips">, until: number) {
  return await ctx.db
    .query("positions")
    .withIndex("by_vehicle_t", (q) => q.eq("vehicleId", trip.vehicleId).gte("t", trip.startedAt).lte("t", until))
    .collect();
}

/** Trips with no ignition-OFF yet, newest first, with distance and top speed so far. */
export const activeTrips = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [inProgress, delayed] = await Promise.all([
      ctx.db.query("trips").withIndex("by_status", (q) => q.eq("status", "in_progress")).collect(),
      ctx.db.query("trips").withIndex("by_status", (q) => q.eq("status", "delayed")).collect(),
    ]);
    const now = Date.now();
    const trips = [...inProgress, ...delayed].sort((a, b) => b.startedAt - a.startedAt);
    return await Promise.all(
      trips.map(async (trip) => {
        const points = await positionsFor(ctx, trip, now);
        return { ...trip, distanceKm: trackDistanceKm(points), maxSpeed: maxSpeed(points) };
      }),
    );
  },
});

/**
 * Completed trips that started in [from, to), newest first, optionally for one vehicle.
 * Distance/top speed come from the stored summary, or are worked out from GPS points
 * for trips completed before summaries were recorded.
 */
export const tripHistory = query({
  args: { from: v.number(), to: v.number(), vehicleId: v.optional(v.id("vehicles")) },
  handler: async (ctx, { from, to, vehicleId }) => {
    await requireAdmin(ctx);
    const trips = vehicleId
      ? await ctx.db
          .query("trips")
          .withIndex("by_vehicle_startedAt", (q) => q.eq("vehicleId", vehicleId).gte("startedAt", from).lt("startedAt", to))
          .order("desc")
          .take(HISTORY_LIMIT)
      : await ctx.db
          .query("trips")
          .withIndex("by_startedAt", (q) => q.gte("startedAt", from).lt("startedAt", to))
          .order("desc")
          .take(HISTORY_LIMIT);

    const completed = trips.filter((t) => t.status === "completed" && t.endedAt !== null);
    const rows = await Promise.all(
      completed.map(async (trip) => {
        if (trip.distanceKm !== null && trip.maxSpeed !== null) return trip;
        const points = await positionsFor(ctx, trip, trip.endedAt!);
        return { ...trip, distanceKm: trackDistanceKm(points), maxSpeed: maxSpeed(points) };
      }),
    );
    return { trips: rows, truncated: trips.length === HISTORY_LIMIT };
  },
});

/**
 * Speed alert history, newest first, one page at a time (optionally for one vehicle).
 * Pass `paginationOpts: { numItems, cursor }`; the result has page, isDone, continueCursor.
 */
export const speedAlertHistory = query({
  args: { paginationOpts: paginationOptsValidator, vehicleId: v.optional(v.id("vehicles")) },
  handler: async (ctx, { paginationOpts, vehicleId }) => {
    await requireAdmin(ctx);
    const base = vehicleId
      ? ctx.db.query("speedAlerts").withIndex("by_vehicle_at", (q) => q.eq("vehicleId", vehicleId))
      : ctx.db.query("speedAlerts").withIndex("by_at");
    return await base.order("desc").paginate(paginationOpts);
  },
});

/** Speed alerts raised since `since` (ms), newest first. */
export const recentSpeedAlerts = query({
  args: { since: v.number() },
  handler: async (ctx, { since }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("speedAlerts")
      .withIndex("by_at", (q) => q.gte("at", since))
      .order("desc")
      .take(50);
  },
});

/**
 * Everything the vehicle details card needs for one vehicle since `since`
 * (the start of the admin's local day): ignition events, speed alerts, and trips with their GPS tracks.
 */
export const vehicleDay = query({
  args: { vehicleId: v.id("vehicles"), since: v.number() },
  handler: async (ctx, { vehicleId, since }) => {
    await requireAdmin(ctx);
    const [ignition, trips, positions, alerts] = await Promise.all([
      ctx.db
        .query("ignitionEvents")
        .withIndex("by_vehicle_at", (q) => q.eq("vehicleId", vehicleId).gte("at", since))
        .collect(),
      ctx.db
        .query("trips")
        .withIndex("by_vehicle_startedAt", (q) => q.eq("vehicleId", vehicleId).gte("startedAt", since))
        .collect(),
      ctx.db
        .query("positions")
        .withIndex("by_vehicle_t", (q) => q.eq("vehicleId", vehicleId).gte("t", since))
        .collect(),
      ctx.db
        .query("speedAlerts")
        .withIndex("by_vehicle_at", (q) => q.eq("vehicleId", vehicleId).gte("at", since))
        .order("desc")
        .collect(),
    ]);

    const now = Date.now();
    return {
      ignition: ignition.map(({ at, state, location, tripId }) => ({ at, state, location, tripId })),
      // Speed alerts recorded by ingestion today (one per continuous speeding event), newest first.
      speedAlerts: alerts.map(({ _id, at, endedAt, speed, speedLimit, lat, lng, address }) => ({
        id: _id,
        at,
        endedAt,
        speed,
        speedLimit,
        lat,
        lng,
        address,
      })),
      trips: trips.map((trip) => ({
        id: trip._id,
        type: trip.type,
        start: trip.startedAt,
        end: trip.endedAt,
        eta: trip.eta,
        progress: trip.progress,
        track: positions
          .filter((p) => p.t >= trip.startedAt && p.t <= (trip.endedAt ?? now))
          .map(({ t, lat, lng, speed }) => ({ t, lat, lng, speed })),
      })),
    };
  },
});
