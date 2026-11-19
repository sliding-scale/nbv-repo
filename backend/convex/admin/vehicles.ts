/**
 * Vehicle API for the admin dashboard.
 *
 *   useQuery(api.admin.vehicles.list)
 *   useMutation(api.admin.vehicles.create)     // { ...fields, studentIds }
 *   useMutation(api.admin.vehicles.update)     // { id, ...fields, studentIds }
 *   useMutation(api.admin.vehicles.setStatus)  // { id, status }
 *   useMutation(api.admin.vehicles.setParentTracking) // { id, enabled }
 *   useMutation(api.admin.vehicles.remove)     // { id }
 */
import { ConvexError, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query, type QueryCtx } from "../_generated/server";
import { requireAdmin } from "../lib/auth";
import { cleanVehicleFields, setVehicleRiders } from "../lib/vehicles";
import { recordStatusValidator, vehicleFields } from "../lib/validators";

async function getVehicleOrThrow(ctx: QueryCtx, id: Id<"vehicles">) {
  const vehicle = await ctx.db.get(id);
  if (!vehicle) throw new ConvexError({ code: "NOT_FOUND", message: "This vehicle no longer exists." });
  return vehicle;
}

/** Every vehicle with its latest telemetry, sorted by name. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const vehicles = await ctx.db.query("vehicles").collect();
    return vehicles
      .map(({ registrationNormalized: _r, ...vehicle }) => vehicle)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  },
});

/** Register a vehicle and choose its riders. Returns the new vehicle's id. */
export const create = mutation({
  args: { ...vehicleFields, studentIds: v.array(v.id("students")) },
  handler: async (ctx, { studentIds, ...args }) => {
    await requireAdmin(ctx);
    const fields = await cleanVehicleFields(ctx, args);
    const id = await ctx.db.insert("vehicles", { ...fields, telemetry: null });
    await setVehicleRiders(ctx, id, studentIds);
    return id;
  },
});

/** Edit a vehicle's details and riders. */
export const update = mutation({
  args: { id: v.id("vehicles"), ...vehicleFields, studentIds: v.array(v.id("students")) },
  handler: async (ctx, { id, studentIds, ...args }) => {
    await requireAdmin(ctx);
    await getVehicleOrThrow(ctx, id);
    await ctx.db.patch(id, await cleanVehicleFields(ctx, args, id));
    await setVehicleRiders(ctx, id, studentIds);
  },
});

/** Deactivate (out of service) or reactivate. Riders and settings are kept. */
export const setStatus = mutation({
  args: { id: v.id("vehicles"), status: recordStatusValidator },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    await getVehicleOrThrow(ctx, id);
    await ctx.db.patch(id, { status });
  },
});

/** Allow or block parents from tracking this van in the parent app. Works for inactive vans too. */
export const setParentTracking = mutation({
  args: { id: v.id("vehicles"), enabled: v.boolean() },
  handler: async (ctx, { id, enabled }) => {
    await requireAdmin(ctx);
    await getVehicleOrThrow(ctx, id);
    await ctx.db.patch(id, { parentTrackingEnabled: enabled });
  },
});

/**
 * Permanently delete a vehicle: unassigns its students and removes its monitoring history.
 * TODO: once trackers report for months, move history deletion into a scheduled batch job.
 */
export const remove = mutation({
  args: { id: v.id("vehicles") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await getVehicleOrThrow(ctx, id);

    const riders = await ctx.db.query("students").withIndex("by_vehicleId", (q) => q.eq("vehicleId", id)).collect();
    for (const s of riders) await ctx.db.patch(s._id, { vehicleId: null });

    const history = await Promise.all([
      ctx.db.query("positions").withIndex("by_vehicle_t", (q) => q.eq("vehicleId", id)).collect(),
      ctx.db.query("ignitionEvents").withIndex("by_vehicle_at", (q) => q.eq("vehicleId", id)).collect(),
      ctx.db.query("trips").withIndex("by_vehicle_startedAt", (q) => q.eq("vehicleId", id)).collect(),
      ctx.db.query("speedAlerts").withIndex("by_vehicle_at", (q) => q.eq("vehicleId", id)).collect(),
    ]);
    for (const doc of history.flat()) await ctx.db.delete(doc._id);

    await ctx.db.delete(id);
  },
});
