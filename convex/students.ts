// Создание ребёнка из бота. displayName — детские ПДн: см. комментарий в schema.ts и docs/specs/API_FOR_BOT.md.
import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { assertBot } from "./botAuth";

type CreateArgs = { parentId: Id<"parents">; name: string; grade: number; requestId?: string };

/** requestId (optional): повтор с тем же ключом у того же родителя возвращает уже созданного ребёнка, дубля нет. */
export async function createHandler(ctx: MutationCtx, { parentId, name, grade, requestId }: CreateArgs) {
  const parent = await ctx.db.get("parents", parentId);
  if (!parent) throw new Error("parent not found");
  const displayName = name.trim();
  if (displayName.length < 1 || displayName.length > 40) throw new Error("bad name");
  if (!Number.isInteger(grade) || grade < 1 || grade > 11) throw new Error("bad grade");
  if (requestId !== undefined) {
    if (requestId.length < 1 || requestId.length > 64) throw new Error("bad requestId");
    const mine = await ctx.db.query("students").withIndex("by_parent", (q) => q.eq("parentId", parentId)).take(50);
    const same = mine.find((s) => s.createRequestId === requestId);
    if (same) return { studentId: same._id };
  }
  const studentId = await ctx.db.insert("students", {
    lang: parent.lang, parentId, consent: false, state: "ONBOARD_CONSENT", riskCount: 0, displayName, grade,
    goal: parent.goal, testDate: parent.testDate, createRequestId: requestId,
  });
  await ctx.db.insert("parentLinks", { parentId, studentId });
  return { studentId };
}

export const create = mutation({
  args: { botSecret: v.string(), parentId: v.id("parents"), name: v.string(), grade: v.number(), requestId: v.optional(v.string()) },
  returns: v.object({ studentId: v.id("students") }),
  handler: async (ctx, { botSecret, ...args }) => {
    assertBot(botSecret);
    return await createHandler(ctx, args);
  },
});
