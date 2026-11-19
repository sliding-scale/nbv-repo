/**
 * Parent API for the admin dashboard.
 *
 * Client usage (admin-dashboard):
 *   useQuery(api.admin.parents.list)
 *   useMutation(api.admin.parents.create)      // { ...fields, studentIds }
 *   useMutation(api.admin.parents.update)      // { id, ...fields, studentIds }
 *   useMutation(api.admin.parents.deactivate)  // { id }
 *   useMutation(api.admin.parents.reactivate)  // { id }
 */
import { ConvexError, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, query, type QueryCtx } from "../_generated/server";
import { requireAdmin } from "../lib/auth";
import { cleanParentFields, setParentStudents, statusTimestamps, toParentView } from "../lib/parents";
import { parentFields } from "../lib/validators";

async function getParentOrThrow(ctx: QueryCtx, id: Id<"parents">) {
  const parent = await ctx.db.get(id);
  if (!parent) throw new ConvexError({ code: "NOT_FOUND", message: "This parent no longer exists." });
  return parent;
}

/** Every parent with the ids of their associated students, sorted by name. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [parents, students] = await Promise.all([
      ctx.db.query("parents").collect(),
      ctx.db.query("students").collect(),
    ]);

    const studentIdsByParent = new Map<string, Id<"students">[]>();
    for (const s of students) {
      for (const parentId of s.parentIds) {
        const ids = studentIdsByParent.get(parentId) ?? [];
        ids.push(s._id);
        studentIdsByParent.set(parentId, ids);
      }
    }

    return parents
      .map((p) => toParentView(p, studentIdsByParent.get(p._id) ?? []))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  },
});

/** Create a parent record and link it to students. Returns the new parent's id. */
export const create = mutation({
  args: { ...parentFields, studentIds: v.array(v.id("students")) },
  handler: async (ctx, { studentIds, ...args }) => {
    await requireAdmin(ctx);
    const fields = await cleanParentFields(ctx, args);
    const id = await ctx.db.insert("parents", {
      ...fields,
      invitedAt: Date.now(),
      ...statusTimestamps(fields.status),
    });
    await setParentStudents(ctx, id, studentIds);
    return id;
  },
});

/** Edit a parent's details, status and associated students. */
export const update = mutation({
  args: { id: v.id("parents"), ...parentFields, studentIds: v.array(v.id("students")) },
  handler: async (ctx, { id, studentIds, ...args }) => {
    await requireAdmin(ctx);
    const existing = await getParentOrThrow(ctx, id);
    const fields = await cleanParentFields(ctx, args, id);
    await ctx.db.patch(id, {
      ...fields,
      ...(fields.status !== existing.status && statusTimestamps(fields.status, existing)),
    });
    await setParentStudents(ctx, id, studentIds);
  },
});

/** Revoke a parent's access immediately. Their record and student links are kept. */
export const deactivate = mutation({
  args: { id: v.id("parents") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const parent = await getParentOrThrow(ctx, id);
    if (parent.status === "deactivated") return;
    await ctx.db.patch(id, { status: "deactivated", ...statusTimestamps("deactivated") });
  },
});

/**
 * Restore access. Parents who had already activated their account go back to
 * "active"; parents who never signed in go back to "invited".
 */
export const reactivate = mutation({
  args: { id: v.id("parents") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const parent = await getParentOrThrow(ctx, id);
    if (parent.status !== "deactivated") return;
    const status = parent.activatedAt ? "active" : "invited";
    await ctx.db.patch(id, { status, ...statusTimestamps(status, parent) });
  },
});
