// Публичный query урока: только проекция lessonView (без answer/distractors).
import { v } from "convex/values";
import { query } from "./_generated/server";
import { lessonView, viewValidator } from "./lessonView";
import { studentIdOf, whoArgs } from "./session";

export const view = query({
  args: whoArgs,
  returns: viewValidator,
  handler: async (ctx, who) => {
    const studentId = await studentIdOf(ctx, who);
    const s = studentId && (await ctx.db.get("students", studentId));
    return s ? lessonView(s) : null;
  },
});
