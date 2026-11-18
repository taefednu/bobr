// Только для scripts/turn-smoke.sh (`npx convex run debug:snapshot`): internal, из браузера недоступно.
import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { studentIdOf } from "./session";

export const snapshot = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, who) => {
    const studentId = await studentIdOf(ctx, who);
    if (!studentId) return null;
    const s = await ctx.db.get("students", studentId);
    const topic = s?.currentTask?.topic ?? "N9";
    const row = await ctx.db.query("topicStatus")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", topic)).unique();
    const h = await ctx.db.query("houses")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", topic)).unique();
    return { answer: s?.currentTask?.answer ?? null, taskId: s?.currentTask?.id ?? null, streak: row?.streak ?? 0, level: row?.level ?? null, house: h?.state ?? null };
  },
});
