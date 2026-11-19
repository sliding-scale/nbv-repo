/**
 * The signed-in parent's own account.
 *
 *   useQuery(api.parent.account.me)
 */
import { query } from "../_generated/server";
import { requireActiveParent } from "./access";

/** Name, email and status of the signed-in parent. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const parent = await requireActiveParent(ctx);
    return {
      id: parent._id,
      fullName: parent.fullName,
      email: parent.email,
      status: parent.status,
      trackingEnabled: parent.trackingEnabled,
    };
  },
});
