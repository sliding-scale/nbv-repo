/**
 * Student API for the admin dashboard.
 *
 * Client usage (admin-dashboard):
 *   useQuery(api.admin.students.list)
 *   useMutation(api.admin.students.create)
 *   useMutation(api.admin.students.update)
 *   useMutation(api.admin.students.setStatus)
 *
 * Riders of a vehicle are set through api.admin.vehicles.create/update.
 */
import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAdmin } from "../lib/auth";
import { ensureCurrentMonthCharges } from "../lib/finance";
import { cleanStudentFields } from "../lib/students";
import { studentFields, studentStatusValidator } from "../lib/validators";

/** Every student, sorted by name. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const students = await ctx.db.query("students").collect();
    return students
      .map(({ gsIdNormalized: _internal, ...student }) => student)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  },
});

/** Add a student. Returns the new student's id. */
export const create = mutation({
  args: studentFields,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const fields = await cleanStudentFields(ctx, args);
    const id = await ctx.db.insert("students", fields);
    if (fields.status === "active") await ensureCurrentMonthCharges(ctx, id);
    return id;
  },
});

/** Replace a student's editable details. */
export const update = mutation({
  args: { id: v.id("students"), ...studentFields },
  handler: async (ctx, { id, ...args }) => {
    await requireAdmin(ctx);
    if (!(await ctx.db.get(id))) {
      throw new ConvexError({ code: "NOT_FOUND", message: "This student no longer exists." });
    }
    const fields = await cleanStudentFields(ctx, args, id);
    await ctx.db.patch(id, fields);
    if (fields.status === "active") await ensureCurrentMonthCharges(ctx, id);
  },
});

/** Deactivate or reactivate a student record. The record and its assignments are kept. */
export const setStatus = mutation({
  args: { id: v.id("students"), status: studentStatusValidator },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    if (!(await ctx.db.get(id))) {
      throw new ConvexError({ code: "NOT_FOUND", message: "This student no longer exists." });
    }
    await ctx.db.patch(id, { status });
    if (status === "active") await ensureCurrentMonthCharges(ctx, id);
  },
});
