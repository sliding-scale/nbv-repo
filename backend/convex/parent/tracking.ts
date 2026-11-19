/**
 * Live location of the signed-in parent's child's van, plus the child's own pickup and
 * drop-off points.
 *
 *   useQuery(api.parent.tracking.myVan)  →  { van, stops }
 *
 * `van` carries only the van's position and when the tracker last reported it: never speed,
 * ignition, heading, address, driver or trip details. The query is reactive, so the app updates
 * on its own each time tracker ingestion writes new telemetry, and switches off as soon as the
 * school switch is off, the schedule closes, or this van's parent tracking is off.
 *
 * `stops` are the child's pickup/drop-off places set by the school (Students page). They're the
 * parent's own child's data, not the van's location, so they're returned even when tracking is off.
 */
import { v } from "convex/values";
import { query } from "../_generated/server";
import { getTrackingSchedule } from "../lib/trackingSchedule";
import type { Location } from "../lib/validators";
import { requireActiveParent } from "./access";
import { findActiveChild } from "./child";

const vanValidator = v.union(
  // No active child is linked to this parent yet.
  v.object({ state: v.literal("no_child") }),
  // A child is linked but has no van assigned.
  v.object({ state: v.literal("no_van") }),
  // The van is marked out of service on the Vehicles page.
  v.object({ state: v.literal("out_of_service") }),
  // The school switch is off, or this van's parent tracking is off.
  v.object({ state: v.literal("tracking_off") }),
  // Outside the pickup and drop-off windows.
  v.object({ state: v.literal("outside_hours") }),
  // Tracking is allowed but the van's tracker hasn't reported a position yet.
  v.object({ state: v.literal("no_location") }),
  v.object({
    state: v.literal("live"),
    lat: v.number(),
    lng: v.number(),
    reportedAt: v.number(), // GPS fix time of the last tracker report, ms since epoch
  }),
);

/** A pickup/drop-off point: position and its short label ("" if the school didn't name it). */
const stopValidator = v.union(v.object({ lat: v.number(), lng: v.number(), label: v.string() }), v.null());

export const myVanValidator = v.object({
  van: vanValidator,
  stops: v.object({ pickup: stopValidator, dropoff: stopValidator }),
});

const toStop = (loc: Location | null) => (loc ? { lat: loc.lat, lng: loc.lng, label: loc.label } : null);

export const myVan = query({
  args: {},
  returns: myVanValidator,
  handler: async (ctx) => {
    const parent = await requireActiveParent(ctx);
    const child = await findActiveChild(ctx, parent._id);

    const stops = { pickup: toStop(child?.pickupLocation ?? null), dropoff: toStop(child?.dropoffLocation ?? null) };
    const result = (van: (typeof myVanValidator.type)["van"]) => ({ van, stops });

    if (!child) return result({ state: "no_child" });
    if (!child.vehicleId) return result({ state: "no_van" });

    const vehicle = await ctx.db.get(child.vehicleId);
    if (!vehicle) return result({ state: "no_van" });
    const schedule = await getTrackingSchedule(ctx);
    // The school switch closes tracking immediately, including during an open pickup or drop-off window.
    if (!schedule || schedule.enabled === false || schedule.reason === "forced_off") {
      return result({ state: "tracking_off" });
    }
    if (!schedule.open) return result({ state: "outside_hours" });
    if (!vehicle.parentTrackingEnabled) return result({ state: "tracking_off" });
    if (vehicle.status !== "active") return result({ state: "out_of_service" });
    if (!vehicle.telemetry) return result({ state: "no_location" });

    const { lat, lng, reportedAt } = vehicle.telemetry;
    return result({ state: "live", lat, lng, reportedAt });
  },
});
