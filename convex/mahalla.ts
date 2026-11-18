// Махалля (карта домов) и старт урока по теме. Состояние домов — из таблицы houses, Date.now() в query нет.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { generateTask } from "../lib/fractions";
import type { TopicId } from "../lib/types";
import { pickNext } from "../lib/home/progress";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { childOf, childOrNull } from "./session";
import { beginLesson } from "./socraticState";

const SEED = 101; // первая сессия темы: 101, 102, 103… (демо-путь). Каждая следующая сессия сдвигает seed на SESSION_STEP.
const SESSION_STEP = 100; // больше LESSON.maxTasksPerTopicPerSession, диапазоны сессий не пересекаются
const MAX_SESSIONS = 50; // ponytail: после 50 сессий темы seed повторится

// Темы, по которым генератор умеет задачи (зонд один раз при загрузке модуля).
export const GENERATED = new Set<string>(graph.topics.map((t) => t.id).filter((id) => {
  try { generateTask(id, "word", SEED); return true; } catch { return false; }
}));

/** План и уровни тем ребёнка. `next` — первая тема плана без прохождения, с которой стартует mahalla:startLesson
 *  (в плане и в GENERATED), иначе стрелка баннера /home мертва. Общий для mahalla:view и home:view. */
export async function planProgress(ctx: QueryCtx, studentId: Id<"students">) {
  const rows = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId)).take(20);
  const plan = await ctx.db.query("plans").withIndex("by_student", (q) => q.eq("studentId", studentId)).order("desc").first();
  const order: string[] = plan?.order ?? [];
  const level = new Map(rows.map((r) => [r.topic as string, r.level as string]));
  return { rows, plan, order, level, next: pickNext(order, (t) => level.get(t), (t) => GENERATED.has(t)) };
}

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
    const { order, next } = await planProgress(ctx, child._id);
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
      next,
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
    // Из махалли можно начать тему и после урока или брошенной сцены «Научи Bobr» (в HOME сами не возвращаются); из CRISIS и до плана — нельзя.
    const from = (["HOME", "LESSON_SOLVE", "TOPIC_DONE", "TEACH_BOBR", "BOBR_QUESTION", "BOBR_ATTEMPT", "JUDGING"] as string[]).includes(child.state);
    if (!from || !id || !GENERATED.has(id) || !plan?.order?.includes(id)) throw new Error("cannot start");
    // Re-entering an active lesson (including another device) cannot erase its ladder.
    if (child.state === "LESSON_SOLVE" && child.currentTask && child.currentTopic === id) return null;
    // Seed зависит от номера сессии темы (101, 201, …): повторная сессия не выдаёт уже решённые задачи. Дальше conductor: seed + 1.
    const earlier = await ctx.db.query("lessonSessions")
      .withIndex("by_student_and_topicNodeId_and_startedAt", (q) => q.eq("studentId", child._id).eq("topicNodeId", id)).take(MAX_SESSIONS);
    const { seed: _seed, ...task } = generateTask(id, "word", SEED + SESSION_STEP * earlier.length);
    // Новая сессия темы: выдана 1 задача (эта), серия с нуля. Иначе submitAnswer при счётчике 0 (после диагностики)
    // выдаёт ту же задачу ещё раз, а при старом счётчике 8 сразу закрывает тему.
    const row = await ctx.db.query("topicStatus")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", child._id).eq("topic", id)).unique();
    if (row) await ctx.db.patch("topicStatus", row._id, { tasksThisSession: 1, streak: 0 });
    await ctx.db.patch("students", child._id, {
      currentTopic: id, state: "LESSON_SOLVE", hintLevel: undefined, wrongOnTask: undefined,
      turnNo: (child.turnNo ?? 0) + 1,
      lastReply: undefined, lastVerdict: undefined,
    });
    await beginLesson(ctx, child._id, task, Date.now());
    return null;
  },
});

export const setInterestTheme = mutation({
  args: { token: v.string(), theme: v.union(v.literal("Nonvoyxona"), v.literal("Football"), v.literal("Minecraft")) },
  returns: v.null(),
  handler: async (ctx, { token, theme }) => {
    const child = await childOf(ctx, token);
    await ctx.db.patch("students", child._id, { interestTheme: theme });
    return null;
  },
});
