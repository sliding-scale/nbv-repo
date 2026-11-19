import { ConvexError } from 'convex/values';

// Must match backend/convex/parent/otpEmail.ts.
export const OTP_PROVIDER = 'resend-otp';
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
/** Must match RESEND_COOLDOWN_MS in backend/convex/parent/signInRules.ts. */
export const RESEND_COOLDOWN_S = 60;

/** Error codes thrown by the backend's sign-in rules (backend/convex/parent/signInRules.ts). */
export type SignInErrorCode = 'NOT_REGISTERED' | 'RESEND_TOO_SOON' | 'UNSUPPORTED';

export function signInErrorCode(error: unknown): SignInErrorCode | null {
  if (error instanceof ConvexError && typeof error.data === 'object' && error.data && 'code' in error.data) {
    return error.data.code as SignInErrorCode;
  }
  return null;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Same normalisation the backend uses, so the request and the verification use one address. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
