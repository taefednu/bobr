// Экран родителя (Mini App /parent). Только сводка: текста ребёнка (turns.text, lastReply) здесь нет и быть не должно.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { houseState } from "../lib/houses";
import { buildPlan } from "../lib/planner";
import { randomString } from "../lib/telegram/secure";
import type { TopicId, TopicLevel } from "../lib/types";
import { internalMutation, query, type QueryCtx } from "./_generated/server";

const SESSION_TTL_MS = 7 * 24 * 3600_000;
const DAY_MS = 86_400_000;
const TZ_OFFSET_MS = 5 * 3600_000; // Asia/Tashkent
// Главная цель MVP — N9 (сложение с разными знаменателями); planner строит цепочку к ней.
const PLAN_TARGETS: TopicId[] = ["N9"];
const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Из parentLogin (после проверки initData): ищет родителя по Telegram id и заводит сессию. null — родитель не найден. */
export const startSession = internalMutation({
  args: { telegramUserId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { telegramUserId }) => {
    const p = await ctx.db.query("parents").withIndex("by_telegram_user", (q) => q.eq("telegramUserId", telegramUserId)).first();
    if (!p) return null;
    const token = randomString(TOKEN_ALPHABET, 48);
    await ctx.db.insert("parentSessions", { parentId: p._id, token, expiresAt: Date.now() + SESSION_TTL_MS });
    return token;
  },
});

const title = (id: TopicId, lang: "uz" | "ru") => graph.topics.find((t) => t.id === id)?.title[lang] ?? id;

// ponytail: Date.now() в query — осознанно (срок сессии, «дом гаснет»); подписка пересчитается при следующем изменении данных.
async function parentOf(ctx: QueryCtx, sessionToken: string) {
  const s = await ctx.db.query("parentSessions").withIndex("by_token", (q) => q.eq("token", sessionToken)).first();
  if (!s || s.expiresAt < Date.now()) throw new Error("unauthorized");
  const parent = await ctx.db.get("parents", s.parentId);
  if (!parent) throw new Error("unauthorized");
  return parent;
}

const planV = v.object({
  order: v.array(v.string()),
  days: v.array(v.object({ date: v.string(), items: v.array(v.object({ topic: v.string(), kind: v.string() })) })),
});
const topicRef = v.object({ topic: v.string(), title: v.string() });

export const dashboard = query({
  args: { sessionToken: v.string() },
  returns: v.object({
    parent: v.object({
      firstName: v.union(v.string(), v.null()), lang: v.union(v.literal("uz"), v.literal("ru")),
      goal: v.union(v.string(), v.null()), testDate: v.union(v.string(), v.null()),
    }),
    children: v.array(v.object({
      displayName: v.union(v.string(), v.null()),
      mahalla: v.array(v.object({ topic: v.string(), title: v.string(), state: v.string() })),
      topics: v.array(v.object({ topic: v.string(), title: v.string(), level: v.string() })),
      plan: planV,
      week: v.object({
        solvedSelf: v.number(), taughtBobr: v.number(), newTopics: v.array(topicRef), lastActive: v.union(v.number(), v.null()),
      }),
    })),
  }),
  handler: async (ctx, { sessionToken }) => {
    const parent = await parentOf(ctx, sessionToken);
    const lang = parent.lang;
    const now = Date.now();
    const today = new Date(now + TZ_OFFSET_MS).toISOString().slice(0, 10);
    const links = await ctx.db.query("parentLinks").withIndex("by_parent", (q) => q.eq("parentId", parent._id)).take(10);
    const children = [];
    for (const l of links) {
      const s = await ctx.db.get("students", l.studentId);
      if (!s) continue;
      const rows = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", s._id)).take(20);
      const byTopic = new Map(rows.map((r) => [r.topic, r]));
      const statuses: Partial<Record<TopicId, { level: TopicLevel; taughtAt?: number }>> = {};
      for (const r of rows) statuses[r.topic as TopicId] = { level: r.level, taughtAt: r.taughtAt };

      const stored = await ctx.db.query("plans").withIndex("by_student", (q) => q.eq("studentId", s._id)).order("desc").first();
      const plan = stored
        ? {
            order: stored.days.flatMap((d) => d.newTopics),
            days: stored.days.map((d) => ({
              date: d.date,
              items: [
                ...d.newTopics.map((topic) => ({ topic, kind: "new" })),
                ...d.reviewTopics.map((topic) => ({ topic, kind: "review" })),
                ...(d.mixedCheck ? [{ topic: PLAN_TARGETS[0], kind: "mixed_check" }] : []),
              ],
            })),
          }
        : buildPlan({ graph, statuses, targets: PLAN_TARGETS, today, testDate: parent.testDate, now });

      const week = (at?: number) => at !== undefined && now - at < 7 * DAY_MS;
      const fresh = rows.filter((r) => week(r.solvedSelfAt) || week(r.taughtAt));
      const lastTurn = await ctx.db.query("turns").withIndex("by_student_and_ts", (q) => q.eq("studentId", s._id)).order("desc").first();
      children.push({
        displayName: s.displayName ?? null,
        mahalla: graph.topics.map((t) => ({ topic: t.id, title: t.title[lang], state: houseState(byTopic.get(t.id), now) })),
        topics: rows.map((r) => ({ topic: r.topic, title: title(r.topic as TopicId, lang), level: r.level })),
        plan,
        week: {
          solvedSelf: rows.filter((r) => week(r.solvedSelfAt)).length,
          taughtBobr: rows.filter((r) => week(r.taughtAt)).length,
          newTopics: fresh.map((r) => ({ topic: r.topic, title: title(r.topic as TopicId, lang) })),
          lastActive: lastTurn?.ts ?? null, // только время, не текст
        },
      });
    }
    return {
      parent: { firstName: parent.firstName ?? null, lang, goal: parent.goal ?? null, testDate: parent.testDate ?? null },
      children,
    };
  },
});
