// Публичный query урока: только проекция lessonView (без answer/distractors).
import { v } from "convex/values";
import { query } from "./_generated/server";
import { lessonView, viewValidator } from "./lessonView";
import { studentIdOf, whoArgs } from "./session";
import { progressOf } from "./socraticState";

export const view = query({
  args: whoArgs,
  returns: viewValidator,
  handler: async (ctx, who) => {
    const studentId = await studentIdOf(ctx, who);
    const s = studentId && (await ctx.db.get("students", studentId));
    if (!s) return null;
    const row = s.currentTopic
      ? await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", s._id).eq("topic", s.currentTopic!)).unique()
      : null;
    return lessonView(s, await progressOf(ctx, s), row?.level ?? null);
  },
});
