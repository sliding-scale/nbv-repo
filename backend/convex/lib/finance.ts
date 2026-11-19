import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { SPEED_LIMIT_KMH } from "./monitoringConfig";

export const FEE_SETTINGS_KEY = "default";

/** School calendar. Matches the tracker clock (Pakistan, no daylight saving). */
export const SCHOOL_TIME_ZONE = "Asia/Karachi";

const MAX_MONTHLY_FEE = 10_000_000;
const MAX_SPEED_LIMIT_KMH = 300;
export const MAX_FEE_NOTE_LENGTH = 200;

const fail = (field: string, message: string): never => {
  throw new ConvexError({ code: "INVALID_INPUT", field, message });
};

/** Year and month (1–12) in the school timezone. Call from mutations only. */
export function schoolYearMonth(now = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHOOL_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(now));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const year = read("year");
  const month = read("month");
  if (!year || !month) throw new Error("Could not resolve the school month.");
  return { year, month };
}

export function assertMonthlyFee(monthlyFee: number) {
  if (!Number.isSafeInteger(monthlyFee) || monthlyFee < 1 || monthlyFee > MAX_MONTHLY_FEE) {
    fail("monthlyFee", "Enter a whole number greater than zero.");
  }
}

export function assertSpeedLimit(speedLimitKmh: number) {
  if (!Number.isSafeInteger(speedLimitKmh) || speedLimitKmh < 1 || speedLimitKmh > MAX_SPEED_LIMIT_KMH) {
    fail("speedLimitKmh", "Enter a whole number of km/h.");
  }
}

/** The saved limit, or 60 km/h when the admin has not changed it. */
export async function currentSpeedLimit(ctx: QueryCtx) {
  const settings = await getFeeSettings(ctx);
  return settings?.speedLimitKmh ?? SPEED_LIMIT_KMH;
}

export function assertPeriod(year: number, month: number) {
  if (!Number.isSafeInteger(year) || year < 2000 || year > 2100) fail("year", "Choose a valid year.");
  if (!Number.isSafeInteger(month) || month < 1 || month > 12) fail("month", "Choose a valid month.");
}

export async function getFeeSettings(ctx: QueryCtx) {
  return await ctx.db
    .query("feeSettings")
    .withIndex("by_key", (q) => q.eq("key", FEE_SETTINGS_KEY))
    .unique();
}

export function assertFeeNote(note: string) {
  const trimmed = note.trim();
  if (trimmed.length > MAX_FEE_NOTE_LENGTH) {
    fail("note", `Keep the note under ${MAX_FEE_NOTE_LENGTH} characters.`);
  }
  return trimmed;
}

/**
 * Bill the current school month from each student's own monthly fee.
 * Pass a student id to cover just that student. A missing row is created.
 * A pending row is updated to the student's current fee. A paid row stays as recorded.
 * Inactive students, and students with no fee, produce no rows.
 */
export async function ensureCurrentMonthCharges(ctx: MutationCtx, studentId?: Id<"students">) {
  const { year, month } = schoolYearMonth();
  const cover = async (student: Doc<"students"> | null) => {
    if (!student || student.status !== "active" || student.monthlyFee == null) return;
    const amount = student.monthlyFee;
    const existing = await ctx.db
      .query("feeCharges")
      .withIndex("by_studentId_and_year_and_month", (q) =>
        q.eq("studentId", student._id).eq("year", year).eq("month", month),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("feeCharges", {
        studentId: student._id,
        year,
        month,
        amount,
        status: "pending",
        paidAt: null,
        paymentMethod: null,
        note: "",
      });
      return;
    }
    if (existing.status === "pending" && existing.amount !== amount) {
      await ctx.db.patch(existing._id, { amount });
    }
  };

  if (studentId) {
    await cover(await ctx.db.get(studentId));
    return;
  }

  for await (const student of ctx.db.query("students")) {
    await cover(student);
  }
}
