// Публичный query урока: только проекция lessonView (без answer/distractors).
import { v } from "convex/values";
import { query } from "./_generated/server";
import { lessonView, viewValidator } from "./lessonView";

export const view = query({
  args: { studentId: v.id("students") },
  returns: viewValidator,
  handler: async (ctx, { studentId }) => {
    const s = await ctx.db.get("students", studentId);
    return s ? lessonView(s) : null;
  },
});
