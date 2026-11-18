// Экран /profile. Единственное место вне функций родителя, где читается students.displayName: имя показывается
// самому ребёнку и больше никуда не идёт (tests/displayNameGuard.test.ts).
import { v } from "convex/values";
import { graph } from "../lib/content";
import { isDone } from "../lib/home/progress";
import { mutation, query } from "./_generated/server";
import { childOf, childOrNull } from "./session";

const lang = v.union(v.literal("uz"), v.literal("ru"));

export const view = query({
  args: { token: v.string() },
  returns: v.union(v.null(), v.object({
    name: v.union(v.string(), v.null()),
    grade: v.union(v.number(), v.null()),
    lang,
    goal: v.union(v.null(), v.literal("test_soon"), v.literal("improve"), v.literal("just_practice")),
    topics: v.object({ done: v.number(), total: v.number() }),
    taught: v.number(),
  })),
  handler: async (ctx, { token }) => {
    const child = await childOrNull(ctx, token);
    if (!child) return null;
    const rows = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", child._id)).take(20);
    return {
      name: child.displayName ?? null,
      grade: child.grade ?? null,
      lang: child.lang,
      goal: child.goal ?? null,
      topics: { done: rows.filter((r) => isDone(r.level)).length, total: graph.topics.length },
      taught: rows.filter((r) => r.level === "taught_bobr").length,
    };
  },
});

/** Язык ребёнка: от него зависят реплики LLM. Клиентский язык меняет вместе с этим хук useSetLang. */
export const setLang = mutation({
  args: { token: v.string(), lang },
  returns: v.null(),
  handler: async (ctx, { token, lang }) => {
    const child = await childOf(ctx, token);
    await ctx.db.patch("students", child._id, { lang });
    return null;
  },
});
