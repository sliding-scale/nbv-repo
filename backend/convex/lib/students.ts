import { ConvexError, type Infer, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { assertMonthlyFee } from "./finance";
import { cleanLocation } from "./locations";
import { studentFields } from "./validators";

const studentFieldsValidator = v.object(studentFields);
export type StudentFields = Infer<typeof studentFieldsValidator>;

export const normalizeGsId = (gsId: string) => gsId.trim().toUpperCase();

const fail = (field: string, message: string): never => {
  throw new ConvexError({ code: "INVALID_INPUT", field, message });
};

/**
 * Trims/normalises incoming student fields and enforces the rules the dashboard form
 * also checks: required name, required and unique GS ID, coordinates in range.
 * `excludeId` is the student being edited (so it doesn't clash with itself).
 */
export async function cleanStudentFields(
  ctx: QueryCtx,
  fields: StudentFields,
  excludeId?: Id<"students">,
) {
  const fullName = fields.fullName.trim();
  if (!fullName) fail("fullName", "Enter the student's full name.");

  const monthlyFee = fields.monthlyFee ?? fail("monthlyFee", "Enter a whole number greater than zero.");
  assertMonthlyFee(monthlyFee);

  const gsIdNormalized = normalizeGsId(fields.gsId);
  if (!gsIdNormalized) fail("gsId", "Enter the GS ID.");

  const clash = await ctx.db
    .query("students")
    .withIndex("by_gsIdNormalized", (q) => q.eq("gsIdNormalized", gsIdNormalized))
    .first();
  if (clash && clash._id !== excludeId) {
    fail("gsId", `This GS ID already belongs to ${clash.fullName}.`);
  }

  const parentIds = [...new Set(fields.parentIds)];
  for (const id of parentIds) {
    if (!(await ctx.db.get(id))) fail("parentIds", "One of the selected parents no longer exists.");
  }

  if (fields.vehicleId && !(await ctx.db.get(fields.vehicleId))) fail("vehicleId", "The selected vehicle no longer exists.");

  return {
    ...fields,
    fullName,
    gsId: gsIdNormalized,
    gsIdNormalized,
    grade: fields.grade.trim(),
    monthlyFee,
    parentIds,
    pickupLocation: cleanLocation("pickupLocation", fields.pickupLocation),
    dropoffLocation: cleanLocation("dropoffLocation", fields.dropoffLocation),
  };
}
