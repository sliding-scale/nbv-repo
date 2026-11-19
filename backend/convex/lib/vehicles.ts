import { ConvexError, type Infer, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { vehicleFields } from "./validators";

const vehicleFieldsValidator = v.object(vehicleFields);
export type VehicleFields = Infer<typeof vehicleFieldsValidator>;

/** Registration numbers are compared upper-cased with spaces removed. */
export const normalizeCode = (value: string) => value.replace(/\s+/g, "").toUpperCase();

const fail = (field: string, message: string): never => {
  throw new ConvexError({ code: "INVALID_INPUT", field, message });
};

function cleanDriverPhone(value: string | undefined) {
  const phone = (value ?? "").trim();
  const digits = phone.replace(/\D/g, "");
  if (phone && (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15)) {
    fail("driverPhone", "Enter a valid phone number, e.g. +92 300 1234567.");
  }
  return phone;
}

export async function cleanVehicleFields(ctx: QueryCtx, fields: VehicleFields, excludeId?: Id<"vehicles">) {
  const name = fields.name.trim();
  if (!name) fail("name", "Enter a vehicle name or identifier.");

  const registrationNumber = fields.registrationNumber.trim().toUpperCase();
  const registrationNormalized = normalizeCode(registrationNumber);
  if (!registrationNormalized) fail("registrationNumber", "Enter the registration number.");
  const regClash = await ctx.db
    .query("vehicles")
    .withIndex("by_registrationNormalized", (q) => q.eq("registrationNormalized", registrationNormalized))
    .first();
  if (regClash && regClash._id !== excludeId) {
    fail("registrationNumber", `${regClash.name} already has this registration number.`);
  }

  return {
    ...fields,
    name,
    registrationNumber,
    registrationNormalized,
    model: fields.model.trim(),
    driverName: fields.driverName.trim(),
    driverPhone: cleanDriverPhone(fields.driverPhone),
  };
}

/**
 * Make `studentIds` exactly the students riding this vehicle. A student rides one van,
 * so listed students move here from any other van; others on this van are unassigned.
 */
export async function setVehicleRiders(ctx: MutationCtx, vehicleId: Id<"vehicles">, studentIds: Id<"students">[]) {
  const chosen = new Set(studentIds);
  for (const id of chosen) {
    const student = await ctx.db.get(id);
    if (!student) fail("studentIds", "One of the selected students no longer exists.");
    else if (student.vehicleId !== vehicleId) await ctx.db.patch(id, { vehicleId });
  }
  const current = await ctx.db
    .query("students")
    .withIndex("by_vehicleId", (q) => q.eq("vehicleId", vehicleId))
    .collect();
  for (const s of current) if (!chosen.has(s._id)) await ctx.db.patch(s._id, { vehicleId: null });
}
