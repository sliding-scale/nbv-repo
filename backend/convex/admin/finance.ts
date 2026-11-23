/**
 * Fee API for the admin dashboard.
 *
 * Client usage (admin-dashboard):
 *   useQuery(api.admin.finance.getSettings)
 *   useMutation(api.admin.finance.setSpeedLimit)
 *   useQuery(api.admin.finance.listMonth, { year, month })
 *   useQuery(api.admin.finance.arrears, { year, month })
 *   useQuery(api.admin.finance.history, { studentId })
 *   useMutation(api.admin.finance.ensureCurrentMonth)
 *   useMutation(api.admin.finance.markPaid)
 *   useMutation(api.admin.finance.markUnpaid)
 *
 * The parent app does not call this file.
 */
import { ConvexError, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { requireAdmin } from "../lib/auth";
import { SPEED_LIMIT_KMH } from "../lib/monitoringConfig";
import {
  assertPeriod,
  assertSpeedLimit,
  ensureCurrentMonthCharges,
  FEE_SETTINGS_KEY,
  getFeeSettings,
} from "../lib/finance";

const periodArgs = { year: v.number(), month: v.number() };

/** The saved fleet speed limit. Fees are stored on each student. */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const settings = await getFeeSettings(ctx);
    return {
      speedLimitKmh: settings?.speedLimitKmh ?? SPEED_LIMIT_KMH,
    };
  },
});

/** Save the fleet speed limit. The next tracker poll uses it for new speeding alerts. */
export const setSpeedLimit = mutation({
  args: { speedLimitKmh: v.number() },
  handler: async (ctx, { speedLimitKmh }) => {
    await requireAdmin(ctx);
    assertSpeedLimit(speedLimitKmh);
    const existing = await getFeeSettings(ctx);
    if (existing) await ctx.db.patch("feeSettings", existing._id, { speedLimitKmh });
    else await ctx.db.insert("feeSettings", { key: FEE_SETTINGS_KEY, speedLimitKmh });
  },
});

/** Fee rows for one month. One row per student who was billed that month. */
export const listMonth = query({
  args: periodArgs,
  handler: async (ctx, { year, month }) => {
    await requireAdmin(ctx);
    assertPeriod(year, month);
    return await ctx.db
      .query("feeCharges")
      .withIndex("by_year_and_month", (q) => q.eq("year", year).eq("month", month))
      .take(2000);
  },
});

/**
 * How many earlier months are still pending, per student.
 * Counts months strictly before the one on screen.
 */
export const arrears = query({
  args: periodArgs,
  handler: async (ctx, { year, month }) => {
    await requireAdmin(ctx);
    assertPeriod(year, month);

    const earlierYears = await ctx.db
      .query("feeCharges")
      .withIndex("by_status_and_year_and_month", (q) => q.eq("status", "pending").lt("year", year))
      .take(4000);

    const earlierThisYear =
      month === 1
        ? []
        : await ctx.db
            .query("feeCharges")
            .withIndex("by_status_and_year_and_month", (q) =>
              q.eq("status", "pending").eq("year", year).lt("month", month),
            )
            .take(4000);

    const counts: Record<Id<"students">, number> = {};
    for (const charge of [...earlierYears, ...earlierThisYear]) {
      counts[charge.studentId] = (counts[charge.studentId] ?? 0) + 1;
    }
    return counts;
  },
});

/** Every saved month for one student, newest first. */
export const history = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, { studentId }) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("feeCharges")
      .withIndex("by_studentId_and_year_and_month", (q) => q.eq("studentId", studentId))
      .order("desc")
      .take(240);
  },
});

/** Bill this month from each active student's own fee. Opening Finance calls this. */
export const ensureCurrentMonth = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    await ensureCurrentMonthCharges(ctx);
  },
});

/** Record a fee as paid. Method and note stay empty until the receipt step asks for them. */
export const markPaid = mutation({
  args: { id: v.id("feeCharges") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    if (!(await ctx.db.get(id))) {
      throw new ConvexError({ code: "NOT_FOUND", message: "This fee row no longer exists." });
    }
    await ctx.db.patch("feeCharges", id, {
      status: "paid",
      paidAt: Date.now(),
      paymentMethod: null,
      note: "",
    });
  },
});

/** Put a fee back to pending and clear the paid date, method, and note. */
export const markUnpaid = mutation({
  args: { id: v.id("feeCharges") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    if (!(await ctx.db.get(id))) {
      throw new ConvexError({ code: "NOT_FOUND", message: "This fee row no longer exists." });
    }
    await ctx.db.patch("feeCharges", id, {
      status: "pending",
      paidAt: null,
      paymentMethod: null,
      note: "",
    });
  },
});
