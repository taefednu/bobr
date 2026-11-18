// Махалля (карта домов) и старт урока по теме. Состояние домов — из таблицы houses, Date.now() в query нет.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { generateTask } from "../lib/fractions";
import type { TopicId } from "../lib/types";
import { mutation, query } from "./_generated/server";
import { childOf, childOrNull } from "./session";

const SEED = 101; // как у submitAnswer: первая задача темы, дальше 102, 103…

// Темы, по которым генератор умеет задачи (зонд один раз при загрузке модуля).
const GENERATED = new Set<string>(graph.topics.map((t) => t.id).filter((id) => {
  try { generateTask(id, "word", SEED); return true; } catch { return false; }
}));

export const view = query({
  args: { token: v.string() },
  returns: v.union(v.null(), v.object({
    lang: v.union(v.literal("uz"), v.literal("ru")),
    state: v.string(),
    houses: v.array(v.object({
      topic: v.string(), title: v.string(),
      state: v.union(v.literal("empty"), v.literal("scaffold"), v.literal("built"), v.literal("alive"), v.literal("dimmed")),
      prereqs: v.array(v.string()), inPlan: v.boolean(), canStart: v.boolean(),
    })),
    next: v.union(v.string(), v.null()),
  })),
  handler: async (ctx, { token }) => {
    const child = await childOrNull(ctx, token);
    if (!child) return null;
    const houses = await ctx.db.query("houses").withIndex("by_student_and_topic", (q) => q.eq("studentId", child._id)).take(20);
    const rows = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", child._id)).take(20);
    const plan = await ctx.db.query("plans").withIndex("by_student", (q) => q.eq("studentId", child._id)).order("desc").first();
    const order: string[] = plan?.order ?? [];
    const level = new Map(rows.map((r) => [r.topic as string, r.level]));
    return {
      lang: child.lang,
      state: child.state,
      houses: graph.topics.map((t) => ({
        topic: t.id, title: t.title[child.lang],
        state: houses.find((h) => h.topic === t.id)?.state ?? ("empty" as const),
        prereqs: t.prereqs,
        inPlan: order.includes(t.id),
        canStart: order.includes(t.id) && GENERATED.has(t.id),
      })),
      next: order.find((id) => { const l = level.get(id); return l === undefined || l === "gap"; }) ?? null,
    };
  },
});

/** HOME → LESSON_SOLVE по теме из плана. Задача без seed, как в startDemoLesson. */
export const startLesson = mutation({
  args: { token: v.string(), topic: v.string() },
  returns: v.null(),
  handler: async (ctx, { token, topic }) => {
    const child = await childOf(ctx, token);
    const id = graph.topics.find((t) => t.id === topic)?.id as TopicId | undefined; // topic с клиента — только из графа
    const plan = await ctx.db.query("plans").withIndex("by_student", (q) => q.eq("studentId", child._id)).order("desc").first();
    if (child.state !== "HOME" || !id || !GENERATED.has(id) || !plan?.order?.includes(id)) throw new Error("cannot start");
    const { seed: _seed, ...task } = generateTask(id, "word", SEED);
    await ctx.db.patch("students", child._id, {
      currentTopic: id, currentTask: task, state: "LESSON_SOLVE", hintLevel: 0, wrongOnTask: 0,
      lastReply: undefined, lastVerdict: undefined,
    });
    return null;
  },
});
