// План ребёнка (этап 3): пересборка после диагностики, просмотр, принятие. Порядок и дни считает lib/planner.
import { v } from "convex/values";
import { DIAGNOSE } from "../lib/config";
import { graph } from "../lib/content";
import { buildPlan, type Plan, validTestDate } from "../lib/planner";
import type { TopicId, TopicLevel } from "../lib/types";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { childOf, childOrNull } from "./session";

const TZ_OFFSET_MS = 5 * 3600_000; // Asia/Tashkent
const TARGET = DIAGNOSE.targets[0] as TopicId; // topic элемента mixed_check

type StoredDay = { date: string; newTopics: string[]; reviewTopics: string[]; mixedCheck: boolean };
type Kind = "new" | "review" | "mixed_check";

/** Прошедшая, кривая или слишком далёкая дата теста → undefined (buildPlan не должен падать из-за ввода ребёнка). */
export function usableTestDate(testDate: string | undefined, today: string): string | undefined {
  return testDate && validTestDate(testDate, today) ? testDate : undefined;
}

/** Результат buildPlan → дни для таблицы plans. */
export function toStoredDays(plan: Plan): StoredDay[] {
  return plan.days.map((d) => ({
    date: d.date,
    newTopics: d.items.filter((i) => i.kind === "new").map((i) => i.topic),
    reviewTopics: d.items.filter((i) => i.kind === "review").map((i) => i.topic),
    mixedCheck: d.items.some((i) => i.kind === "mixed_check"),
  }));
}

/** День из таблицы plans → элементы для экрана (новые, review, mixed_check). */
export function dayItems(d: StoredDay): { topic: string; kind: Kind }[] {
  return [
    ...d.newTopics.map((topic) => ({ topic, kind: "new" as const })),
    ...d.reviewTopics.map((topic) => ({ topic, kind: "review" as const })),
    ...(d.mixedCheck ? [{ topic: TARGET, kind: "mixed_check" as const }] : []),
  ];
}

/** Пересобирает план ребёнка из topicStatus и заменяет строку plans. Зовут diagnose и другие mutations. */
export async function rebuildPlan(ctx: MutationCtx, studentId: Id<"students">): Promise<void> {
  const student = await ctx.db.get("students", studentId);
  if (!student) return;
  const now = Date.now();
  const today = new Date(now + TZ_OFFSET_MS).toISOString().slice(0, 10);
  const rows = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId)).take(20);
  const statuses: Partial<Record<TopicId, { level: TopicLevel; taughtAt?: number }>> = {};
  for (const r of rows) statuses[r.topic as TopicId] = { level: r.level, taughtAt: r.taughtAt };
  const testDate = usableTestDate(student.testDate, today);
  const plan = buildPlan({ graph, statuses, targets: [...DIAGNOSE.targets] as TopicId[], today, testDate, now });
  for (const old of await ctx.db.query("plans").withIndex("by_student", (q) => q.eq("studentId", studentId)).take(10))
    await ctx.db.delete("plans", old._id);
  await ctx.db.insert("plans", { studentId, testDate, order: plan.order, days: toStoredDays(plan) });
}

const ref = v.object({ topic: v.string(), title: v.string() });

export const view = query({
  args: { token: v.string() },
  returns: v.union(v.null(), v.object({
    testDate: v.union(v.string(), v.null()),
    gaps: v.array(v.string()),
    order: v.array(ref),
    days: v.array(v.object({
      date: v.string(),
      items: v.array(v.object({ topic: v.string(), title: v.string(), kind: v.union(v.literal("new"), v.literal("review"), v.literal("mixed_check")) })),
    })),
  })),
  handler: async (ctx, { token }) => {
    const child = await childOrNull(ctx, token);
    if (!child) return null;
    const title = (id: string) => graph.topics.find((t) => t.id === id)?.title[child.lang] ?? id;
    const plan = await ctx.db.query("plans").withIndex("by_student", (q) => q.eq("studentId", child._id)).order("desc").first();
    const rows = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", child._id)).take(20);
    return {
      testDate: plan?.testDate ?? null,
      gaps: rows.filter((r) => r.level === "gap").map((r) => r.topic),
      order: (plan?.order ?? []).map((topic) => ({ topic, title: title(topic) })),
      days: (plan?.days ?? []).map((d) => ({ date: d.date, items: dayItems(d).map((i) => ({ ...i, title: title(i.topic) })) })),
    };
  },
});

/** PLAN → HOME; из других стейтов — ничего. */
export const accept = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const child = await childOf(ctx, token);
    if (child.state === "PLAN") await ctx.db.patch("students", child._id, { state: "HOME" });
    return null;
  },
});
