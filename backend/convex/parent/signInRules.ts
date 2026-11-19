/**
 * Rules for the parent app's email-code sign-in, plugged into Convex Auth (see convex/auth.ts).
 *
 * Convex Auth calls `createOrUpdateParentUser` twice per sign-in, inside its own mutations:
 *  1. type "email"        when a code is requested (before the code is created or sent)
 *  2. type "verification" when the parent enters the correct code
 * Throwing rejects that step and rolls back everything it wrote, so:
 *  - only emails an admin registered (and hasn't deactivated) ever get a login, a code or an email;
 *  - a parent deactivated between requesting and entering the code can't finish signing in.
 */
import type { GenericId } from "convex/values";
import { ConvexError } from "convex/values";
import type { AnyDataModel, GenericMutationCtx } from "convex/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { findParentByEmail } from "./access";
import { OTP_PROVIDER_ID } from "./otpEmail";

/** Minimum gap between two code emails to the same address. */
export const RESEND_COOLDOWN_MS = 60_000;

/** Wrong codes allowed per email per hour before Convex Auth blocks further attempts. */
export const MAX_FAILED_CODE_ATTEMPTS_PER_HOUR = 5;

type Args = {
  existingUserId: GenericId<"users"> | null;
  type: string;
  profile: Record<string, unknown>;
};

/** Error codes the parent app reacts to. */
const reject = (code: "NOT_REGISTERED" | "RESEND_TOO_SOON" | "UNSUPPORTED", message: string): never => {
  throw new ConvexError({ code, message });
};

/** Throws if a code was emailed to this address less than RESEND_COOLDOWN_MS ago. */
async function assertResendAllowed(ctx: MutationCtx, email: string) {
  const account = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) => q.eq("provider", OTP_PROVIDER_ID).eq("providerAccountId", email))
    .unique();
  if (!account) return;
  const pending = await ctx.db
    .query("authVerificationCodes")
    .withIndex("accountId", (q) => q.eq("accountId", account._id))
    .unique();
  if (pending && Date.now() - pending._creationTime < RESEND_COOLDOWN_MS) {
    reject("RESEND_TOO_SOON", "Please wait a minute before asking for another code.");
  }
}

export async function createOrUpdateParentUser(
  genericCtx: GenericMutationCtx<AnyDataModel>,
  args: Args,
): Promise<GenericId<"users">> {
  const ctx = genericCtx as unknown as MutationCtx;
  if (args.type !== "email" && args.type !== "verification") {
    reject("UNSUPPORTED", "This sign-in method isn't supported.");
  }

  const email = typeof args.profile.email === "string" ? args.profile.email.trim().toLowerCase() : "";
  const parent = email ? await findParentByEmail(ctx, email) : null;
  if (!parent || parent.status === "deactivated") {
    reject("NOT_REGISTERED", "This email isn't registered for VanTrack.");
  }
  const registered = parent!;

  if (args.type === "email") await assertResendAllowed(ctx, email);

  // One login per parent: reuse it if this email (or the parent record) already has one.
  let userId = (args.existingUserId as Id<"users"> | null) ?? registered.authUserId ?? null;
  if (userId && !(await ctx.db.get(userId))) userId = null;
  if (!userId) userId = await ctx.db.insert("users", { email });

  if (args.type === "verification") {
    // The parent proved they own the email: link the login and activate an invited account.
    await ctx.db.patch(userId, { email, emailVerificationTime: Date.now() });
    if (registered.authUserId !== userId || registered.status === "invited") {
      await ctx.db.patch(registered._id, {
        authUserId: userId,
        ...(registered.status === "invited" && { status: "active" as const, activatedAt: Date.now() }),
      });
    }
  }
  return userId;
}
