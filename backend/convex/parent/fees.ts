/**
 * Fee rows for the signed-in parent's child. The parent app chooses the school month.
 * This query does not read the clock. The admin note is not included.
 *
 *   useQuery(api.parent.fees.mine)
 */
import { query } from "../_generated/server";
import { requireActiveParent } from "./access";
import { findActiveChild } from "./child";

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const parent = await requireActiveParent(ctx);
    const child = await findActiveChild(ctx, parent._id);
    if (!child) return { childName: null, charges: [] };

    const rows = await ctx.db
      .query("feeCharges")
      .withIndex("by_studentId_and_year_and_month", (q) => q.eq("studentId", child._id))
      .collect();
    rows.sort((a, b) => b.year - a.year || b.month - a.month);

    return {
      childName: child.fullName,
      charges: rows.map((row) => ({
        year: row.year,
        month: row.month,
        amount: row.amount,
        status: row.status,
        paidAt: row.paidAt,
        paymentMethod: row.paymentMethod,
      })),
    };
  },
});
