// Экран родителя (Mini App /parent). Только сводка: текста ребёнка (turns.text, lastReply) здесь нет и быть не должно.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { houseState } from "../lib/houses";
import { buildPlan, validTestDate } from "../lib/planner";
import { randomString } from "../lib/telegram/secure";
import type { TopicId, TopicLevel } from "../lib/types";
import { internalMutation, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { learningSupportFor, learningSupportValidator, weeklySupportFor, weeklySupportValidator } from "./socraticTelemetry";

const SESSION_TTL_MS = 7 * 24 * 3600_000;
const DAY_MS = 86_400_000;
const TZ_OFFSET_MS = 5 * 3600_000; // Asia/Tashkent
// Главная цель MVP — N9 (сложение с разными знаменателями); planner строит цепочку к ней.
const PLAN_TARGETS: TopicId[] = ["N9"];
const DEFAULT_NOTIFICATIONS = { taughtBobr: true, dailySummary: true, forgotten: true };
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

const IDLE_MS = 5 * 60_000; // пауза между действиями дольше 5 минут не считается занятием
const WEEK_TURN_LIMIT = 2000;
const WEEK_EVENT_LIMIT = 200;
const MAX_PAUSE_MS = 30 * DAY_MS;
const dayKey = (t: number) => new Date(t + TZ_OFFSET_MS).toISOString().slice(0, 10);

/** Минуты по дням из меток времени (по возрастанию): сумма промежутков ≤ 5 мин, день — по началу промежутка. Только код, без текста. */
export function minutesByDay(ts: readonly number[], days: readonly string[]) {
  const ms = new Map(days.map((d) => [d, 0]));
  for (let i = 1; i < ts.length; i++) {
    const gap = ts[i] - ts[i - 1];
    const k = dayKey(ts[i - 1]);
    if (gap > 0 && gap <= IDLE_MS && ms.has(k)) ms.set(k, ms.get(k)! + gap);
  }
  return days.map((date) => ({ date, minutes: Math.round(ms.get(date)! / 60_000) }));
}

const planV = v.object({
  order: v.array(v.string()),
  days: v.array(v.object({ date: v.string(), items: v.array(v.object({ topic: v.string(), kind: v.string() })) })),
});
const notificationsV = v.object({ taughtBobr: v.boolean(), dailySummary: v.boolean(), forgotten: v.boolean() });
const topicRef = v.object({ topic: v.string(), title: v.string() });

const dashboardReturns = v.object({
    parent: v.object({
      firstName: v.union(v.string(), v.null()), lang: v.union(v.literal("uz"), v.literal("ru")),
      goal: v.union(v.string(), v.null()), testDate: v.union(v.string(), v.null()),
      notifications: notificationsV, pausedUntil: v.union(v.number(), v.null()),
    }),
    children: v.array(v.object({
      displayName: v.union(v.string(), v.null()),
      mahalla: v.array(v.object({ topic: v.string(), title: v.string(), state: v.string() })),
      topics: v.array(v.object({
        topic: v.string(), title: v.string(), level: v.string(),
        solvedSelfAt: v.union(v.number(), v.null()), taughtAt: v.union(v.number(), v.null()),
      })),
      mistakes: v.array(v.object({ topic: v.string(), tag: v.string(), count: v.number() })), // тип ошибки (код тега), без цитат
      plan: planV,
      learningSupport: learningSupportValidator,
      week: v.object({
        solvedSelf: v.number(), taughtBobr: v.number(), newTopics: v.array(topicRef), lastActive: v.union(v.number(), v.null()),
        socratic: weeklySupportValidator,
        minutes: v.number(), activeDays: v.number(),
        minutesByDay: v.array(v.object({ date: v.string(), minutes: v.number() })),
        minutesLimited: v.boolean(), // true: ходов больше лимита выборки, минуты занижены
      }),
    })),
});

export async function dashboardHandler(ctx: QueryCtx, { sessionToken }: { sessionToken: string }) {
    const parent = await parentOf(ctx, sessionToken);
    const lang = parent.lang;
    const now = Date.now();
    const today = dayKey(now);
    const days = Array.from({ length: 7 }, (_, i) => dayKey(now - (6 - i) * DAY_MS));
    const windowStart = Date.parse(`${days[0]}T00:00:00Z`) - TZ_OFFSET_MS;
    const links = await ctx.db.query("parentLinks").withIndex("by_parent", (q) => q.eq("parentId", parent._id)).take(10);
    const children: (typeof dashboardReturns.type)["children"] = [];
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
        : buildPlan({ graph, statuses, targets: PLAN_TARGETS, today, testDate: parent.testDate && validTestDate(parent.testDate, today) ? parent.testDate : undefined, now });

      const week = (at?: number) => at !== undefined && now - at < 7 * DAY_MS;
      const fresh = rows.filter((r) => week(r.solvedSelfAt) || week(r.taughtAt));
      const events = await ctx.db.query("escalationEvents").withIndex("by_student_and_timestamp", (q) => q.eq("studentId", s._id).gte("timestamp", now - 7 * DAY_MS))
        .order("desc").take(WEEK_EVENT_LIMIT);
      const counts = new Map<string, number>();
      for (const e of events) if (e.misconceptionTag) counts.set(`${e.topicNodeId}|${e.misconceptionTag}`, (counts.get(`${e.topicNodeId}|${e.misconceptionTag}`) ?? 0) + 1);
      const mistakes = new Map<string, number>(); // топ-тег на тему
      const best = new Map<string, [string, number]>();
      for (const [k, c] of counts) { const t = k.split("|")[0]; if (c > (best.get(t)?.[1] ?? 0)) best.set(t, [k, c]); }
      for (const [k, c] of best.values()) mistakes.set(k, c);
      const turnRows = await ctx.db.query("turns").withIndex("by_student_and_ts", (q) => q.eq("studentId", s._id).gte("ts", windowStart))
        .take(WEEK_TURN_LIMIT + 1);
      const perDay = minutesByDay(turnRows.slice(0, WEEK_TURN_LIMIT).map((t) => t.ts), days);
      const lastTurn = await ctx.db.query("turns").withIndex("by_student_and_ts", (q) => q.eq("studentId", s._id)).order("desc").first();
      children.push({
        displayName: s.displayName ?? null,
        mahalla: graph.topics.map((t) => ({ topic: t.id, title: t.title[lang], state: houseState(byTopic.get(t.id), now) })),
        topics: rows.map((r) => ({ topic: r.topic, title: title(r.topic as TopicId, lang), level: r.level, solvedSelfAt: r.solvedSelfAt ?? null, taughtAt: r.taughtAt ?? null })),
        mistakes: [...mistakes.entries()].map(([k, count]) => { const [topic, tag] = k.split("|"); return { topic, tag, count }; }),
        plan,
        learningSupport: await learningSupportFor(ctx, s._id),
        week: {
          solvedSelf: rows.filter((r) => week(r.solvedSelfAt)).length,
          taughtBobr: rows.filter((r) => week(r.taughtAt)).length,
          newTopics: fresh.map((r) => ({ topic: r.topic, title: title(r.topic as TopicId, lang) })),
          lastActive: lastTurn?.ts ?? null, // только время, не текст
          socratic: await weeklySupportFor(ctx, s._id, now - 7 * DAY_MS),
          minutes: perDay.reduce((a, d) => a + d.minutes, 0),
          activeDays: perDay.filter((d) => d.minutes > 0).length,
          minutesByDay: perDay,
          minutesLimited: turnRows.length > WEEK_TURN_LIMIT,
        },
      });
    }
    return {
      parent: {
        firstName: parent.firstName ?? null, lang, goal: parent.goal ?? null, testDate: parent.testDate ?? null,
        notifications: parent.notifications ?? DEFAULT_NOTIFICATIONS, pausedUntil: parent.pausedUntil ?? null,
      },
      children,
    };
}

export const dashboard = query({ args: { sessionToken: v.string() }, returns: dashboardReturns, handler: dashboardHandler });

export async function setNotificationsHandler(
  ctx: MutationCtx, a: { sessionToken: string; taughtBobr?: boolean; dailySummary?: boolean; forgotten?: boolean },
) {
  const parent = await parentOf(ctx, a.sessionToken);
  const { sessionToken: _t, ...patch } = a;
  const next = { ...(parent.notifications ?? DEFAULT_NOTIFICATIONS) };
  for (const k of ["taughtBobr", "dailySummary", "forgotten"] as const) if (patch[k] !== undefined) next[k] = patch[k];
  await ctx.db.patch("parents", parent._id, { notifications: next });
  return next;
}

export async function setPauseHandler(ctx: MutationCtx, { sessionToken, pausedUntil }: { sessionToken: string; pausedUntil: number | null }) {
  const parent = await parentOf(ctx, sessionToken);
  const now = Date.now();
  if (pausedUntil !== null && !(pausedUntil > now && pausedUntil <= now + MAX_PAUSE_MS)) throw new Error("bad pause");
  await ctx.db.patch("parents", parent._id, { pausedUntil: pausedUntil ?? undefined });
  return null;
}

// Паузу и настройки читают производители outbox; кризис их игнорирует.
export const setNotifications = mutation({
  args: { sessionToken: v.string(), taughtBobr: v.optional(v.boolean()), dailySummary: v.optional(v.boolean()), forgotten: v.optional(v.boolean()) },
  returns: notificationsV,
  handler: setNotificationsHandler,
});
export const setPause = mutation({
  args: { sessionToken: v.string(), pausedUntil: v.union(v.number(), v.null()) },
  returns: v.null(),
  handler: setPauseHandler,
});
