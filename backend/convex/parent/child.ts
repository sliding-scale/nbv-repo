/**
 * The signed-in parent's child. Students store parent links, which can't be indexed,
 * so this scans. One child per parent for now: a child with a van assigned wins.
 */
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export async function findActiveChild(ctx: QueryCtx, parentId: Id<"parents">) {
  let child: Doc<"students"> | null = null;
  for await (const student of ctx.db.query("students")) {
    if (student.status !== "active" || !student.parentIds.includes(parentId)) continue;
    if (!child) child = student;
    if (student.vehicleId) {
      child = student;
      break;
    }
  }
  return child;
}
