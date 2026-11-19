/**
 * Change of sign-in email from the parent app (Settings). The new address must be confirmed
 * with a code sent to it, so a typo can never lock a parent out of their account.
 *
 *   1. useAction(api.parent.emailChange.request)({ newEmail })   → code emailed to newEmail
 *   2. useMutation(api.parent.emailChange.confirm)({ code })     → email switched
 *
 * Rules: 6-digit code, 10-minute expiry, single use, 5 wrong tries per request, 60 s between
 * requests. On success the parent record, the Convex Auth login and the user all move to the
 * new address in one transaction: the old email stops working and the new one signs in.
 */
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalMutation, mutation, type MutationCtx } from "../_generated/server";
import { normalizeEmail } from "../lib/parents";
import { requireActiveParent } from "./access";
import { generateOtp, OTP_PROVIDER_ID, OTP_TTL_MINUTES, sendCodeEmail } from "./otpEmail";

/** Minimum gap between two change requests from the same parent. */
export const REQUEST_COOLDOWN_MS = 60_000;
/** Wrong codes allowed per request before the parent has to ask for a new one. */
export const MAX_FAILED_ATTEMPTS = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ErrorCode = "INVALID_EMAIL" | "SAME_EMAIL" | "EMAIL_TAKEN" | "RESEND_TOO_SOON";
const reject = (code: ErrorCode, message: string): never => {
  throw new ConvexError({ code, message });
};

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// The parent id is mixed in so the same code never hashes the same way for two parents.
const hashCode = (parentId: Id<"parents">, code: string) => sha256Hex(`${parentId}:${code}`);

/** Step 1: emails a confirmation code to the new address. Returns the normalised address. */
export const request = action({
  args: { newEmail: v.string() },
  returns: v.string(),
  handler: async (ctx, { newEmail }): Promise<string> => {
    // The code is generated here: actions have real randomness, mutations don't.
    const code = generateOtp();
    const started: { requestId: Id<"emailChangeRequests">; email: string; parentId: Id<"parents"> } =
      await ctx.runMutation(internal.parent.emailChange.start, { newEmail, code });
    try {
      await sendCodeEmail(started.email, code, "email-change");
    } catch (error) {
      // Don't leave an unusable request behind (it would also block a retry for 60 s).
      await ctx.runMutation(internal.parent.emailChange.discard, { requestId: started.requestId });
      throw error;
    }
    return started.email;
  },
});

/**
 * Validates the new address and stores the request. Runs with the caller's auth (called from
 * `request`). Only the hash of `code` is stored.
 */
export const start = internalMutation({
  args: { newEmail: v.string(), code: v.string() },
  returns: v.object({ requestId: v.id("emailChangeRequests"), email: v.string(), parentId: v.id("parents") }),
  handler: async (ctx, { newEmail, code }) => {
    const parent = await requireActiveParent(ctx);
    const email = normalizeEmail(newEmail);
    if (!EMAIL_PATTERN.test(email)) reject("INVALID_EMAIL", "Enter a valid email address.");
    if (email === parent.emailNormalized) reject("SAME_EMAIL", "That's already your email address.");
    await assertEmailFree(ctx, email, parent._id);

    const existing = await ctx.db
      .query("emailChangeRequests")
      .withIndex("by_parentId", (q) => q.eq("parentId", parent._id))
      .unique();
    if (existing) {
      if (Date.now() - existing._creationTime < REQUEST_COOLDOWN_MS) {
        reject("RESEND_TOO_SOON", "Please wait a minute before asking for another code.");
      }
      await ctx.db.delete(existing._id);
    }

    const requestId = await ctx.db.insert("emailChangeRequests", {
      parentId: parent._id,
      newEmail: email,
      codeHash: await hashCode(parent._id, code),
      expiresAt: Date.now() + OTP_TTL_MINUTES * 60_000,
      failedAttempts: 0,
    });
    return { requestId, email, parentId: parent._id };
  },
});

export const discard = internalMutation({
  args: { requestId: v.id("emailChangeRequests") },
  returns: v.null(),
  handler: async (ctx, { requestId }) => {
    if (await ctx.db.get(requestId)) await ctx.db.delete(requestId);
    return null;
  },
});

/**
 * Step 2: checks the code and switches the email. Failures are returned rather than thrown,
 * so the failed-attempt count is saved (a thrown error would roll it back).
 */
export const confirm = mutation({
  args: { code: v.string() },
  returns: v.union(
    v.object({ ok: v.literal(true), email: v.string() }),
    v.object({
      ok: v.literal(false),
      reason: v.union(v.literal("no_request"), v.literal("expired"), v.literal("too_many_attempts"), v.literal("wrong_code")),
      attemptsLeft: v.number(),
    }),
  ),
  handler: async (ctx, { code }) => {
    const parent = await requireActiveParent(ctx);
    const req = await ctx.db
      .query("emailChangeRequests")
      .withIndex("by_parentId", (q) => q.eq("parentId", parent._id))
      .unique();
    if (!req) return { ok: false as const, reason: "no_request" as const, attemptsLeft: 0 };
    if (Date.now() > req.expiresAt) {
      await ctx.db.delete(req._id);
      return { ok: false as const, reason: "expired" as const, attemptsLeft: 0 };
    }
    if (req.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return { ok: false as const, reason: "too_many_attempts" as const, attemptsLeft: 0 };
    }
    if ((await hashCode(parent._id, code.trim())) !== req.codeHash) {
      const failedAttempts = req.failedAttempts + 1;
      await ctx.db.patch(req._id, { failedAttempts });
      const attemptsLeft = MAX_FAILED_ATTEMPTS - failedAttempts;
      return attemptsLeft > 0
        ? { ok: false as const, reason: "wrong_code" as const, attemptsLeft }
        : { ok: false as const, reason: "too_many_attempts" as const, attemptsLeft: 0 };
    }

    // Someone (e.g. an admin) may have taken the address since the code was sent.
    await assertEmailFree(ctx, req.newEmail, parent._id);

    await ctx.db.patch(parent._id, { email: req.newEmail, emailNormalized: req.newEmail });
    if (parent.authUserId) await moveLogin(ctx, parent.authUserId, req.newEmail);
    await ctx.db.delete(req._id);
    return { ok: true as const, email: req.newEmail };
  },
});

async function assertEmailFree(ctx: MutationCtx, email: string, parentId: Id<"parents">) {
  const clash = await ctx.db
    .query("parents")
    .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", email))
    .first();
  // Deliberately doesn't say who uses it: parents must not learn about other accounts.
  if (clash && clash._id !== parentId) reject("EMAIL_TAKEN", "This email address can't be used. Try another one.");
}

/**
 * Points the parent's email-code login at the new address, so the next sign-in with it reuses
 * the same user (and the old address has nothing to sign in to).
 */
async function moveLogin(ctx: MutationCtx, userId: Id<"users">, email: string) {
  // A leftover login for the new address that isn't this parent's can't be used by anyone
  // (no parent has that email), so remove it rather than collide with it.
  const leftover = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) => q.eq("provider", OTP_PROVIDER_ID).eq("providerAccountId", email))
    .unique();
  if (leftover && leftover.userId !== userId) await deleteAccount(ctx, leftover._id);

  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId).eq("provider", OTP_PROVIDER_ID))
    .take(10);
  const [keep, ...extra] = accounts;
  if (keep) await ctx.db.patch(keep._id, { providerAccountId: email });
  for (const a of extra) await deleteAccount(ctx, a._id);

  if (await ctx.db.get(userId)) await ctx.db.patch(userId, { email, emailVerificationTime: Date.now() });
}

async function deleteAccount(ctx: MutationCtx, accountId: Id<"authAccounts">) {
  const codes = await ctx.db
    .query("authVerificationCodes")
    .withIndex("accountId", (q) => q.eq("accountId", accountId))
    .take(10);
  for (const c of codes) await ctx.db.delete(c._id);
  await ctx.db.delete(accountId);
}
