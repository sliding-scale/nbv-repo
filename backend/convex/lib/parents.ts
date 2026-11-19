import { ConvexError, type Infer, v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { parentFields, type ParentStatus } from "./validators";

const parentFieldsValidator = v.object(parentFields);
export type ParentFields = Infer<typeof parentFieldsValidator>;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (field: string, message: string): never => {
  throw new ConvexError({ code: "INVALID_INPUT", field, message });
};

/**
 * Trims/normalises incoming parent fields and enforces: required name,
 * required, well-formed and unique email, plausible phone number if given.
 */
export async function cleanParentFields(ctx: QueryCtx, fields: ParentFields, excludeId?: Id<"parents">) {
  const fullName = fields.fullName.trim();
  if (!fullName) fail("fullName", "Enter the parent's full name.");

  const emailNormalized = normalizeEmail(fields.email);
  if (!emailNormalized) fail("email", "Enter an email address.");
  if (!EMAIL_PATTERN.test(emailNormalized)) fail("email", "Enter a valid email address.");

  const clash = await ctx.db
    .query("parents")
    .withIndex("by_emailNormalized", (q) => q.eq("emailNormalized", emailNormalized))
    .first();
  if (clash && clash._id !== excludeId) fail("email", `This email is already used by ${clash.fullName}.`);

  const phone = fields.phone.trim();
  const digits = phone.replace(/\D/g, "");
  if (phone && (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15)) {
    fail("phone", "Enter a valid phone number, e.g. +92 300 1234567.");
  }

  return {
    fullName,
    email: emailNormalized,
    emailNormalized,
    phone,
    relationship: fields.relationship.trim(),
    status: fields.status,
    trackingEnabled: fields.trackingEnabled,
  };
}

/** Timestamps to record when a parent moves into `status`. */
export function statusTimestamps(status: ParentStatus, existing?: Doc<"parents">) {
  const now = Date.now();
  if (status === "active") return { activatedAt: existing?.activatedAt ?? now };
  if (status === "deactivated") return { deactivatedAt: now };
  return { invitedAt: now };
}

/**
 * Make `studentIds` exactly the students linked to this parent.
 * Links are stored on the student (student.parentIds).
 */
export async function setParentStudents(ctx: MutationCtx, parentId: Id<"parents">, studentIds: Id<"students">[]) {
  const chosen = new Set(studentIds);

  for (const id of chosen) {
    if (!(await ctx.db.get(id))) fail("studentIds", "One of the selected students no longer exists.");
  }

  // Small school-sized table: a full scan is simpler than a join table here.
  const students = await ctx.db.query("students").collect();
  for (const s of students) {
    const linked = s.parentIds.includes(parentId);
    if (chosen.has(s._id) && !linked) {
      await ctx.db.patch(s._id, { parentIds: [...s.parentIds, parentId] });
    } else if (!chosen.has(s._id) && linked) {
      await ctx.db.patch(s._id, { parentIds: s.parentIds.filter((p) => p !== parentId) });
    }
  }
}

/** Public shape of a parent: internal fields removed, linked students attached. */
export function toParentView(parent: Doc<"parents">, studentIds: Id<"students">[]) {
  const { emailNormalized: _e, ...rest } = parent;
  return { ...rest, studentIds };
}

/**
 * Account and van checks for live location. The parent app also requires the school
 * tracking switch to be on and a pickup or drop-off window to be open.
 */
export function canParentTrack(parent: Doc<"parents">, vehicleAllowsParentTracking: boolean) {
  return parent.status !== "deactivated" && vehicleAllowsParentTracking;
}
