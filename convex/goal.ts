// Шаг «цель» (API_CHILD goal:set): только кнопки, без LLM и свободного текста.
import { v } from "convex/values";
import { normalizeGoal } from "../lib/planner";
import { mutation } from "./_generated/server";
import { childOf } from "./session";

const TZ_OFFSET_MS = 5 * 3600_000; // Asia/Tashkent

export const set = mutation({
  args: {
    token: v.string(),
    goal: v.union(v.literal("test_soon"), v.literal("improve"), v.literal("just_practice")),
    testDate: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { token, goal, testDate }) => {
    const child = await childOf(ctx, token);
    const today = new Date(Date.now() + TZ_OFFSET_MS).toISOString().slice(0, 10);
    const g = normalizeGoal({ goal, testDate, today });
    await ctx.db.patch("students", child._id, {
      goal: g.goal, testDate: g.testDate,
      ...(child.state === "GOAL_SETUP" ? { state: "DIAGNOSE" as const } : {}),
    });
    return null;
  },
});
