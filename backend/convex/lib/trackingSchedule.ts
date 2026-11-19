import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { SCHOOL_TIME_ZONE } from "./finance";

export const TRACKING_SCHEDULE_KEY = "default";

/** Pickup 06:00–08:00 and drop-off 13:00–15:00 until an admin saves other times. */
export const DEFAULT_PICKUP_START = 6 * 60;
export const DEFAULT_PICKUP_END = 8 * 60;
export const DEFAULT_DROPOFF_START = 13 * 60;
export const DEFAULT_DROPOFF_END = 15 * 60;

export type TrackingOverride = "auto" | "on" | "off";
export type TrackingReason = "pickup" | "dropoff" | "closed" | "forced_on" | "forced_off";

export type TrackingWindows = {
  pickupStart: number;
  pickupEnd: number;
  dropoffStart: number;
  dropoffEnd: number;
  override: TrackingOverride;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

const fail = (field: string, message: string): never => {
  throw new ConvexError({ code: "INVALID_INPUT", field, message });
};

export const defaultWindows = (): TrackingWindows => ({
  pickupStart: DEFAULT_PICKUP_START,
  pickupEnd: DEFAULT_PICKUP_END,
  dropoffStart: DEFAULT_DROPOFF_START,
  dropoffEnd: DEFAULT_DROPOFF_END,
  override: "auto",
});

/** "06:00" → minutes from midnight. */
export function parseTime(value: string, field: string) {
  const match = TIME_PATTERN.exec(value.trim());
  if (match === null) return fail(field, "Enter a time like 06:00.");
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function assertWindow(start: number, end: number, field: string, label: string) {
  if (end <= start) fail(field, `${label} must end later than it starts.`);
}

/** Minutes from midnight in Asia/Karachi. Call from mutations only. */
export function schoolMinutes(now: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHOOL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  let hour = read("hour");
  const minute = read("minute");
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) throw new Error("Could not resolve the school time.");
  if (hour === 24) hour = 0;
  return hour * 60 + minute;
}

export function decideTracking(windows: TrackingWindows, now: number): { open: boolean; reason: TrackingReason } {
  const minute = schoolMinutes(now);
  if (minute >= windows.pickupStart && minute < windows.pickupEnd) return { open: true, reason: "pickup" };
  if (minute >= windows.dropoffStart && minute < windows.dropoffEnd) return { open: true, reason: "dropoff" };
  return { open: false, reason: "closed" };
}

export async function getTrackingSchedule(ctx: QueryCtx) {
  return await ctx.db
    .query("trackingSchedule")
    .withIndex("by_key", (q) => q.eq("key", TRACKING_SCHEDULE_KEY))
    .unique();
}

/** Write the windows and whether the school allows parent tracking. Skips the write when nothing changed. */
export async function applyTrackingSchedule(
  ctx: MutationCtx,
  now: number,
  patch?: Partial<TrackingWindows> & { enabled?: boolean },
) {
  const existing = await getTrackingSchedule(ctx);
  const windows: TrackingWindows = {
    pickupStart: patch?.pickupStart ?? existing?.pickupStart ?? DEFAULT_PICKUP_START,
    pickupEnd: patch?.pickupEnd ?? existing?.pickupEnd ?? DEFAULT_PICKUP_END,
    dropoffStart: patch?.dropoffStart ?? existing?.dropoffStart ?? DEFAULT_DROPOFF_START,
    dropoffEnd: patch?.dropoffEnd ?? existing?.dropoffEnd ?? DEFAULT_DROPOFF_END,
    override: "auto",
  };
  // A missing flag means on, so a schedule saved before the switch still follows the clock.
  const enabled = patch?.enabled ?? existing?.enabled !== false;
  // The switch closes parent tracking immediately, even in the middle of a pickup or drop-off window.
  const decision = enabled ? decideTracking(windows, now) : { open: false, reason: "forced_off" as const };
  const next = { key: TRACKING_SCHEDULE_KEY, ...windows, enabled, ...decision };
  if (
    existing &&
    existing.pickupStart === next.pickupStart &&
    existing.pickupEnd === next.pickupEnd &&
    existing.dropoffStart === next.dropoffStart &&
    existing.dropoffEnd === next.dropoffEnd &&
    existing.override === next.override &&
    existing.enabled === next.enabled &&
    existing.open === next.open &&
    existing.reason === next.reason
  ) {
    return existing;
  }
  if (existing) {
    await ctx.db.patch("trackingSchedule", existing._id, next);
    return { ...existing, ...next };
  }
  const id = await ctx.db.insert("trackingSchedule", next);
  return { ...next, _id: id };
}
