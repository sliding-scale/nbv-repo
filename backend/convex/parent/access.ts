/**
 * Who is calling a parent-app function. Start every function in convex/parent/ with
 * `requireActiveParent(ctx)`.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import { normalizeEmail } from "../lib/parents";

/** The parent record an admin created for this email, or null. */
export async function findParentByEmail(ctx: QueryCtx, email: string) {
  return await ctx.db
    .query("parents")
    .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", normalizeEmail(email)))
    .unique();
}

/**
 * The signed-in parent. Rejects anyone not signed in through the parent app's email-code
 * login (admins' Clerk tokens have a different issuer) and parents an admin has deactivated,
 * so deactivation takes effect on the parent's very next request. Read-only, so it works in queries.
 */
export async function requireActiveParent(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity?.issuer === process.env.CONVEX_SITE_URL ? await getAuthUserId(ctx) : null;
  if (!userId) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: "Please sign in." });
  }

  const parent = await ctx.db
    .query("parents")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", userId))
    .unique();
  if (!parent || parent.status === "deactivated") {
    throw new ConvexError({ code: "FORBIDDEN", message: "Your account doesn't have access. Contact the school." });
  }
  return parent;
}
