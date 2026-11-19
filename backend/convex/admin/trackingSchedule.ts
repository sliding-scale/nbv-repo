/**
 * School-wide parent tracking hours for the admin dashboard.
 *
 *   useQuery(api.admin.trackingSchedule.get)
 *   useMutation(api.admin.trackingSchedule.save)
 *   useMutation(api.admin.trackingSchedule.refresh)
 *
 * The parent app does not call this file. It reads the stored on/off flag.
 */
import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { requireAdmin } from "../lib/auth";
import {
  applyTrackingSchedule,
  assertWindow,
  defaultWindows,
  formatTime,
  getTrackingSchedule,
  parseTime,
  type TrackingOverride,
} from "../lib/trackingSchedule";

function viewOf(row: {
  pickupStart: number;
  pickupEnd: number;
  dropoffStart: number;
  dropoffEnd: number;
  override: TrackingOverride;
  enabled?: boolean;
  open: boolean;
  reason: "pickup" | "dropoff" | "closed" | "forced_on" | "forced_off";
}) {
  return {
    pickupStart: formatTime(row.pickupStart),
    pickupEnd: formatTime(row.pickupEnd),
    dropoffStart: formatTime(row.dropoffStart),
    dropoffEnd: formatTime(row.dropoffEnd),
    override: row.override,
    enabled: row.enabled !== false,
    open: row.open,
    reason: row.reason,
  };
}

/** Saved windows, override, and whether parents may track right now. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const row = await getTrackingSchedule(ctx);
    if (!row) return viewOf({ ...defaultWindows(), enabled: true, open: false, reason: "closed" });
    return viewOf(row);
  },
});

/** Recompute the on/off flag from the clock. Settings calls this when it opens. */
export const refresh = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    await applyTrackingSchedule(ctx, Date.now());
  },
});

/** Same recompute, from the minute job. No admin session. */
export const apply = internalMutation({
  args: {},
  handler: async (ctx) => {
    await applyTrackingSchedule(ctx, Date.now());
  },
});

/** Save the school-wide switch and the pickup and drop-off windows, then apply them immediately. */
export const save = mutation({
  args: {
    enabled: v.boolean(),
    pickupStart: v.string(),
    pickupEnd: v.string(),
    dropoffStart: v.string(),
    dropoffEnd: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const pickupStart = parseTime(args.pickupStart, "pickupStart");
    const pickupEnd = parseTime(args.pickupEnd, "pickupEnd");
    const dropoffStart = parseTime(args.dropoffStart, "dropoffStart");
    const dropoffEnd = parseTime(args.dropoffEnd, "dropoffEnd");
    assertWindow(pickupStart, pickupEnd, "pickupEnd", "Pickup");
    assertWindow(dropoffStart, dropoffEnd, "dropoffEnd", "Drop-off");
    await applyTrackingSchedule(ctx, Date.now(), {
      enabled: args.enabled,
      pickupStart,
      pickupEnd,
      dropoffStart,
      dropoffEnd,
    });
  },
});
