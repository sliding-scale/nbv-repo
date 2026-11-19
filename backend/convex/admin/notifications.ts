/**
 * Admin notifications (requirement 4.7): one per ignition ON/OFF event, newest first.
 * Read state is per admin: events after the admin's lastReadAt are unread.
 *
 *   usePaginatedQuery(api.admin.notifications.list, {}, { initialNumItems })
 *   useQuery(api.admin.notifications.unreadCount)
 *   useMutation(api.admin.notifications.markAllRead)
 */
import { paginationOptsValidator } from "convex/server";
import { mutation, query, type QueryCtx } from "../_generated/server";
import { adminKey, requireAdmin } from "../lib/auth";

/** Unread counts above this are shown as "99+", so we never scan more. */
const UNREAD_CAP = 100;

async function lastReadAt(ctx: QueryCtx) {
  const key = await adminKey(ctx);
  const state = await ctx.db
    .query("adminNotificationState")
    .withIndex("by_adminKey", (q) => q.eq("adminKey", key))
    .unique();
  return state?.lastReadAt ?? 0;
}

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const readAt = await lastReadAt(ctx);
    const result = await ctx.db.query("ignitionEvents").withIndex("by_at").order("desc").paginate(paginationOpts);

    const vehicleIds = [...new Set(result.page.map((e) => e.vehicleId))];
    const vehicles = new Map((await Promise.all(vehicleIds.map((id) => ctx.db.get(id)))).filter((v) => v !== null).map((v) => [v._id, v]));

    return {
      ...result,
      page: result.page.map((e) => {
        const vehicle = vehicles.get(e.vehicleId);
        return {
          _id: e._id,
          at: e.at,
          state: e.state,
          location: e.location,
          tripId: e.tripId,
          vehicleId: e.vehicleId,
          vehicleName: vehicle?.name ?? "Deleted vehicle",
          registrationNumber: vehicle?.registrationNumber ?? "",
          unread: e.at > readAt,
        };
      }),
    };
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const readAt = await lastReadAt(ctx);
    const unread = await ctx.db
      .query("ignitionEvents")
      .withIndex("by_at", (q) => q.gt("at", readAt))
      .take(UNREAD_CAP);
    return unread.length;
  },
});

/** Mark every notification up to now as read for the signed-in admin. */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const key = await adminKey(ctx);
    const now = Date.now();
    const state = await ctx.db
      .query("adminNotificationState")
      .withIndex("by_adminKey", (q) => q.eq("adminKey", key))
      .unique();
    if (state) await ctx.db.patch(state._id, { lastReadAt: now });
    else await ctx.db.insert("adminNotificationState", { adminKey: key, lastReadAt: now });
  },
});
