/**
 * Email sign-in code for the parent app, sent with Resend.
 *
 * Code handling is done by Convex Auth: the code is stored only as a SHA-256 hash
 * (table authVerificationCodes), is deleted as soon as it is used or found expired,
 * and requesting a new code deletes the previous one.
 *
 * Deployment env vars:
 *   AUTH_RESEND_KEY   Resend API key
 *   AUTH_EMAIL_FROM   sender, e.g. "VanTrack <login@your-domain.com>" (must be a Resend-verified domain).
 *                     Falls back to Resend's test sender, which only delivers to your own Resend account email.
 *   AUTH_OTP_LOG_ONLY "true" = dev bypass: log the code to the Convex logs instead of sending it.
 */
import { Email } from "@convex-dev/auth/providers/Email";
import { generateRandomString, type RandomReader } from "@oslojs/crypto/random";
import { Resend } from "resend";

export const OTP_PROVIDER_ID = "resend-otp";
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;

const TEST_SENDER = "VanTrack <onboarding@resend.dev>";

const random: RandomReader = {
  read(bytes) {
    crypto.getRandomValues(bytes as Uint8Array<ArrayBuffer>);
  },
};

/** A new random 6-digit code. Call only from actions (or Convex Auth), where randomness is real. */
export function generateOtp() {
  return generateRandomString(random, "0123456789", OTP_LENGTH);
}

/** What the code is for; changes the wording of the email. */
export type CodePurpose = "sign-in" | "email-change";

const COPY: Record<CodePurpose, { heading: string; action: string; ignore: string }> = {
  "sign-in": {
    heading: "Your sign-in code",
    action: "Enter this code in the VanTrack app to sign in.",
    ignore: "If you didn't try to sign in, you can ignore this email.",
  },
  "email-change": {
    heading: "Confirm your new email",
    action: "Enter this code in the VanTrack app to use this address for signing in.",
    ignore: "If you didn't ask to change your VanTrack email, you can ignore this email.",
  },
};

function emailHtml(code: string, purpose: CodePurpose) {
  const copy = COPY[purpose];
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:16px;padding:32px">
          <tr><td style="font-size:18px;font-weight:700;padding-bottom:24px">VanTrack</td></tr>
          <tr><td style="font-size:22px;font-weight:700;padding-bottom:8px">${copy.heading}</td></tr>
          <tr><td style="font-size:15px;line-height:22px;color:#475569;padding-bottom:24px">
            ${copy.action} It expires in ${OTP_TTL_MINUTES} minutes and can only be used once.
          </td></tr>
          <tr><td align="center" style="background:#eff6ff;border-radius:12px;padding:20px;font-size:34px;font-weight:700;letter-spacing:10px;color:#1d4ed8">${code}</td></tr>
          <tr><td style="font-size:13px;line-height:19px;color:#64748b;padding-top:24px">
            ${copy.ignore} Never share this code with anyone.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/**
 * Emails a one-time code with Resend, or only logs it when AUTH_OTP_LOG_ONLY=true (dev bypass;
 * never set it on a production deployment). Throws if the email can't be sent.
 */
export async function sendCodeEmail(to: string, code: string, purpose: CodePurpose) {
  if (process.env.AUTH_OTP_LOG_ONLY === "true") {
    console.log(`[DEV] ${purpose === "sign-in" ? "Sign-in" : "Email-change"} code for ${to}: ${code}`);
    return;
  }
  const apiKey = process.env.AUTH_RESEND_KEY;
  if (!apiKey) throw new Error("AUTH_RESEND_KEY is not set on this Convex deployment.");

  const subject =
    purpose === "sign-in" ? `${code} is your VanTrack sign-in code` : `${code} is your VanTrack confirmation code`;
  const { error } = await new Resend(apiKey).emails.send({
    from: process.env.AUTH_EMAIL_FROM || TEST_SENDER,
    to: [to],
    subject,
    text: `${COPY[purpose].action} Your code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes and can only be used once. ${COPY[purpose].ignore}`,
    html: emailHtml(code, purpose),
  });
  if (error) throw new Error(`Could not send the email: ${JSON.stringify(error)}`);
}

export const ResendOTP = Email({
  id: OTP_PROVIDER_ID,
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: OTP_TTL_MINUTES * 60,
  async generateVerificationToken() {
    return generateOtp();
  },
  // Only reached for registered, non-deactivated parents: the createOrUpdateUser callback
  // (parent/signInRules.ts) runs first and rejects every other email before a code exists.
  async sendVerificationRequest({ identifier: email, token }) {
    await sendCodeEmail(email, token, "sign-in");
  },
});
