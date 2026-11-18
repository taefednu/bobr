// Функции для Telegram-бота (botSecret). Родитель создаётся по telegramUserId (идемпотентно).
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { normalizeGoal } from "../lib/planner";
import { assertBot } from "./botAuth";

const lang = v.union(v.literal("uz"), v.literal("ru"));
const goal = v.union(v.literal("test_soon"), v.literal("improve"), v.literal("just_practice")); // = GOAL_INTENTS

export const upsertFromTelegram = mutation({
  args: { botSecret: v.string(), telegramUserId: v.string(), chatId: v.string(), firstName: v.string(), lang },
  returns: v.object({ parentId: v.id("parents") }),
  handler: async (ctx, { botSecret, telegramUserId, chatId, firstName, lang }) => {
    assertBot(botSecret);
    const row = await ctx.db.query("parents").withIndex("by_telegram_user", (q) => q.eq("telegramUserId", telegramUserId)).first();
    if (row) {
      await ctx.db.patch("parents", row._id, { telegramChatId: chatId, firstName, lang });
      return { parentId: row._id };
    }
    return { parentId: await ctx.db.insert("parents", { telegramUserId, telegramChatId: chatId, firstName, lang }) };
  },
});

export const setConsent = mutation({
  args: { botSecret: v.string(), parentId: v.id("parents"), consent: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { botSecret, parentId, consent }) => {
    assertBot(botSecret);
    const row = await ctx.db.get("parents", parentId);
    if (!row) throw new Error("parent not found");
    // consentAt — момент первого согласия: повторное «да» его не двигает, «нет» стирает
    await ctx.db.patch("parents", parentId, { consent, consentAt: consent ? (row.consentAt ?? Date.now()) : undefined });
    return null;
  },
});

/** Цель ставит родитель (спека). Дублируется детям родителя: planner читает её со students. */
export const setGoal = mutation({
  args: { botSecret: v.string(), parentId: v.id("parents"), goal, testDate: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { botSecret, parentId, goal, testDate }) => {
    assertBot(botSecret);
    // та же проверка, что у ребёнка (goal:set): настоящая дата, не в прошлом, не дальше года; не test_soon → даты нет
    testDate = normalizeGoal({ goal, testDate, today: new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10) }).testDate;
    await ctx.db.patch("parents", parentId, { goal, testDate });
    const links = await ctx.db.query("parentLinks").withIndex("by_parent", (q) => q.eq("parentId", parentId)).take(50);
    for (const l of links) await ctx.db.patch("students", l.studentId, { goal, testDate });
    return null;
  },
});

const DAY = 86_400_000;
const PAUSE_MAX_DAYS = 30;

export const setNotifications = mutation({
  args: { botSecret: v.string(), parentId: v.id("parents"), taughtBobr: v.boolean(), dailySummary: v.boolean(), forgotten: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { botSecret, parentId, ...notifications }) => {
    assertBot(botSecret);
    await ctx.db.patch("parents", parentId, { notifications });
    return null;
  },
});

/** Пауза несрочных пушей: until — ms в будущем, не дальше 30 дней; null снимает. Кризис паузу игнорирует (решает outbox). */
export const setPause = mutation({
  args: { botSecret: v.string(), parentId: v.id("parents"), until: v.union(v.number(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { botSecret, parentId, until }) => {
    assertBot(botSecret);
    const now = Date.now();
    if (until !== null && !(until > now && until <= now + PAUSE_MAX_DAYS * DAY)) throw new Error("bad pause");
    await ctx.db.patch("parents", parentId, { pausedUntil: until ?? undefined });
    return null;
  },
});

/** Восстановление контекста бота после рестарта. Чужой telegramUserId → null: ничего не раскрываем. Имя ребёнка не логируем. */
export async function getByTelegramUserHandler(ctx: QueryCtx, telegramUserId: string) {
  const p = await ctx.db.query("parents").withIndex("by_telegram_user", (q) => q.eq("telegramUserId", telegramUserId)).first();
  if (!p) return null;
  const links = await ctx.db.query("parentLinks").withIndex("by_parent", (q) => q.eq("parentId", p._id)).take(50);
  const children = [];
  for (const l of links) {
    const st = await ctx.db.get("students", l.studentId);
    if (!st) continue;
    const topics = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", st._id)).take(20);
    const houses = await ctx.db.query("houses").withIndex("by_student_and_topic", (q) => q.eq("studentId", st._id)).take(20);
    // только счётчики: ни цитат, ни ответов ребёнка
    children.push({
      studentId: st._id, displayName: st.displayName ?? null, grade: st.grade ?? null, state: st.state,
      progress: {
        gap: topics.filter((t) => t.level === "gap").length,
        solvedSelf: topics.filter((t) => t.level === "solved_self").length,
        taughtBobr: topics.filter((t) => t.level === "taught_bobr").length,
        housesAlive: houses.filter((h) => h.state === "alive").length,
        housesBuilt: houses.filter((h) => h.state === "built").length,
      },
    });
  }
  return {
    parentId: p._id, lang: p.lang, consent: p.consent ?? false, consentAt: p.consentAt ?? null,
    goal: p.goal ?? null, testDate: p.testDate ?? null, pausedUntil: p.pausedUntil ?? null,
    notifications: p.notifications ?? { taughtBobr: true, dailySummary: true, forgotten: true },
    children,
  };
}

export const getByTelegramUser = query({
  args: { botSecret: v.string(), telegramUserId: v.string() },
  returns: v.union(v.null(), v.any()), // ponytail: v.any, форма описана в API_FOR_BOT.md; уточнить, когда бот зафиксирует
  handler: async (ctx, { botSecret, telegramUserId }) => {
    assertBot(botSecret);
    return await getByTelegramUserHandler(ctx, telegramUserId);
  },
});

/** Чистое решение: ребёнок с другим родителем остаётся (снимаем только ссылку), без других — удаляется целиком. */
export function planChild(parentId: string, linkedParentIds: string[]): "delete" | "unlink" {
  return linkedParentIds.some((id) => id !== parentId) ? "unlink" : "delete";
}

export const DELETE_BUDGET = 500; // удалений за вызов: далеко от лимитов транзакции, бот зовёт в цикле до done

/** Один батч каскадного удаления. {done:true} — родителя и всех связанных строк больше нет. Повтор безопасен. */
export async function deleteAccountHandler(ctx: MutationCtx, parentId: Id<"parents">, budget = DELETE_BUDGET): Promise<{ done: boolean }> {
  if (!(await ctx.db.get("parents", parentId))) return { done: true };
  const left = { n: budget };
  const wipe = async <T extends { _id: string }>(q: { take(n: number): Promise<T[]> }, del: (row: T) => Promise<void>) => {
    if (left.n <= 0) return;
    const rows = await q.take(left.n);
    for (const r of rows) await del(r);
    left.n -= rows.length;
  };

  for (;;) {
    const links = await ctx.db.query("parentLinks").withIndex("by_parent", (q) => q.eq("parentId", parentId)).take(50);
    const own = await ctx.db.query("students").withIndex("by_parent", (q) => q.eq("parentId", parentId)).take(50);
    const ids = [...new Set<Id<"students">>([...links.map((l) => l.studentId), ...own.map((s) => s._id)])];
    if (ids.length === 0) break;
    for (const sid of ids) {
      if (left.n <= 0) return { done: false };
      const all = await ctx.db.query("parentLinks").withIndex("by_student", (q) => q.eq("studentId", sid)).take(20);
      if (planChild(parentId, all.map((l) => l.parentId)) === "unlink") {
        for (const l of all) if (l.parentId === parentId) await ctx.db.delete("parentLinks", l._id);
        const st = await ctx.db.get("students", sid);
        const other = all.find((l) => l.parentId !== parentId);
        if (st && st.parentId === parentId && other) await ctx.db.patch("students", sid, { parentId: other.parentId });
        left.n -= 1;
        continue;
      }
      await wipe(ctx.db.query("turns").withIndex("by_student_and_ts", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("turns", r._id));
      await wipe(ctx.db.query("escalationEvents").withIndex("by_student_and_timestamp", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("escalationEvents", r._id));
      await wipe(ctx.db.query("attemptRequests").withIndex("by_student_and_requestId", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("attemptRequests", r._id));
      await wipe(ctx.db.query("taskProgress").withIndex("by_student_and_finishedAt", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("taskProgress", r._id));
      await wipe(ctx.db.query("lessonSessions").withIndex("by_student_and_startedAt", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("lessonSessions", r._id));
      await wipe(ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("topicStatus", r._id));
      await wipe(ctx.db.query("houses").withIndex("by_student_and_topic", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("houses", r._id));
      await wipe(ctx.db.query("plans").withIndex("by_student", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("plans", r._id));
      await wipe(ctx.db.query("reviewQueue").withIndex("by_student_and_category", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("reviewQueue", r._id));
      await wipe(ctx.db.query("linkCodes").withIndex("by_student", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("linkCodes", r._id));
      await wipe(ctx.db.query("sessions").withIndex("by_student", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("sessions", r._id));
      await wipe(ctx.db.query("parentLinks").withIndex("by_student", (q) => q.eq("studentId", sid)), (r) => ctx.db.delete("parentLinks", r._id));
      if (left.n <= 0) return { done: false }; // строка ребёнка — последней: повтор найдёт его и дочистит
      await ctx.db.delete("students", sid);
      left.n -= 1;
    }
  }
  await wipe(ctx.db.query("parentSessions").withIndex("by_parent", (q) => q.eq("parentId", parentId)), (r) => ctx.db.delete("parentSessions", r._id));
  await wipe(ctx.db.query("outbox").withIndex("by_parent_and_dedupe_and_sent", (q) => q.eq("parentId", parentId)), (r) => ctx.db.delete("outbox", r._id));
  if (left.n <= 0) return { done: false };
  await ctx.db.delete("parents", parentId);
  return { done: true };
}

/** Удаление родителя и всех данных: только с confirm:true. Бот зовёт в цикле, пока не придёт done:true, и лишь тогда пишет «удалено». */
export const deleteAccount = mutation({
  args: { botSecret: v.string(), parentId: v.id("parents"), confirm: v.boolean() },
  returns: v.object({ done: v.boolean() }),
  handler: async (ctx, { botSecret, parentId, confirm }) => {
    assertBot(botSecret);
    if (confirm !== true) throw new Error("confirmation required");
    return await deleteAccountHandler(ctx, parentId);
  },
});
