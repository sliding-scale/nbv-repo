/**
 * Convex Auth entry point. It has to live at convex/auth.ts: the client library calls
 * `auth:signIn` / `auth:signOut` by that path. Used only by the parent app (email-code
 * sign-in); the rules themselves live in convex/parent/. Admins sign in with Clerk.
 */
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./parent/otpEmail";
import { createOrUpdateParentUser, MAX_FAILED_CODE_ATTEMPTS_PER_HOUR } from "./parent/signInRules";

const DAY_MS = 24 * 60 * 60 * 1000;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP],
  callbacks: { createOrUpdateUser: createOrUpdateParentUser },
  // Parents stay signed in for 30 days of inactivity / 90 days in total, then enter a new code.
  session: { inactiveDurationMs: 30 * DAY_MS, totalDurationMs: 90 * DAY_MS },
  signIn: { maxFailedAttempsPerHour: MAX_FAILED_CODE_ATTEMPTS_PER_HOUR },
});
