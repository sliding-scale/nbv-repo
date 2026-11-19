/**
 * The signed-in parent's child's driver and van name. No live location.
 *
 *   useQuery(api.parent.driver.details)
 */
import { query } from "../_generated/server";
import { requireActiveParent } from "./access";
import { findActiveChild } from "./child";

export const details = query({
  args: {},
  handler: async (ctx) => {
    const parent = await requireActiveParent(ctx);
    const child = await findActiveChild(ctx, parent._id);
    if (!child) return { child: null, van: null };

    const vehicle = child.vehicleId ? await ctx.db.get(child.vehicleId) : null;
    return {
      child: { fullName: child.fullName, grade: child.grade },
      van: vehicle
        ? {
            name: vehicle.name,
            registrationNumber: vehicle.registrationNumber,
            model: vehicle.model,
            driverName: vehicle.driverName,
            driverPhone: vehicle.driverPhone ?? "",
          }
        : null,
    };
  },
});
