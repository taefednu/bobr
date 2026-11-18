// Создание ребёнка из бота. displayName — детские ПДн: см. комментарий в schema.ts и docs/specs/API_FOR_BOT.md.
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertBot } from "./botAuth";

export const create = mutation({
  args: { botSecret: v.string(), parentId: v.id("parents"), name: v.string(), grade: v.number() },
  returns: v.object({ studentId: v.id("students") }),
  handler: async (ctx, { botSecret, parentId, name, grade }) => {
    assertBot(botSecret);
    const parent = await ctx.db.get("parents", parentId);
    if (!parent) throw new Error("parent not found");
    const displayName = name.trim();
    if (displayName.length < 1 || displayName.length > 40) throw new Error("bad name");
    if (!Number.isInteger(grade) || grade < 1 || grade > 11) throw new Error("bad grade");
    const studentId = await ctx.db.insert("students", {
      lang: parent.lang, parentId, consent: false, state: "ONBOARD_CONSENT", riskCount: 0, displayName, grade,
      goal: parent.goal, testDate: parent.testDate,
    });
    await ctx.db.insert("parentLinks", { parentId, studentId });
    return { studentId };
  },
});
