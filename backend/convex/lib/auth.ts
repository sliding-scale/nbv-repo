import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";

/**
 * Guard for admin-dashboard functions: requires a user signed in through Clerk
 * (verified by Convex via convex/auth.config.ts) whose token carries role "admin".
 * Parent-app sign-in and access checks live in convex/parent/.
 *
 * The role comes from the Clerk user's public metadata ({ "role": "admin" }), added to
 * the session token via Clerk → Configure → Sessions → Customize session token:
 *   { "role": "{{user.public_metadata.role}}" }
 */
export async function requireAdmin(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "You must be signed in as an admin." });
  }
  if (identity.role !== "admin") {
    throw new ConvexError({ code: "FORBIDDEN", message: "This account doesn't have admin access." });
  }
  return identity;
}

/** Stable key for per-admin state (e.g. notification read status): the Clerk user id. */
export async function adminKey(ctx: QueryCtx) {
  const identity = await requireAdmin(ctx);
  return identity.subject;
}
