// Очередь сообщений родителю. Бот опрашивает listUnsent раз в ~3 с, шлёт и зовёт markSent.
// Писатели — обычные функции (enqueue*), чтобы вызывать их внутри чужих мутаций без под-транзакций.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { ABUSE_LOOKUP_BOUND, CRISIS_DEDUPE_STALE_MS, crisisDedupeKey, crisisPushSuppressed, crisisRouting, parentNotifyDecision, priorAbuseFrom } from "../lib/safety/crisis";
import { kindEnabled, NON_CRISIS_KINDS, planDigest, selectDeliverable, tashkentDayStart } from "../lib/telegram/delivery";
import { crisisText, dailySummaryText, forgottenText, taughtBobrText } from "../lib/telegram/texts";
import type { GuardCategory, TopicId } from "../lib/types";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx, query } from "./_generated/server";
import { assertBot } from "./botAuth";

type Kind = "taught_bobr" | "crisis" | "daily_summary" | "forgotten";

/** Кладёт сообщение каждому родителю ребёнка, у которого есть чат. */
async function enqueue(
  ctx: MutationCtx, studentId: Id<"students">, kind: Kind, text: (p: { lang: "uz" | "ru" }) => string,
  crisis?: { category: GuardCategory; urgent: boolean },
) {
  const links = await ctx.db.query("parentLinks").withIndex("by_student", (q) => q.eq("studentId", studentId)).take(10);
  const now = Date.now();
  for (const l of links) {
    const p = await ctx.db.get("parents", l.parentId);
    if (!p?.telegramChatId) continue;
    if (!crisis && !kindEnabled(p.notifications, kind as "taught_bobr")) continue; // настройки родителя; кризис их игнорирует
    let extra = {};
    if (crisis) {
      const dedupeKey = crisisDedupeKey(studentId, crisis.category);
      const unsent = await ctx.db.query("outbox")
        .withIndex("by_parent_and_dedupe_and_sent", (q) => q.eq("parentId", p._id).eq("dedupeKey", dedupeKey).eq("sentAt", undefined)).take(20);
      const recentSent = await ctx.db.query("outbox")
        .withIndex("by_parent_and_dedupe_and_sent", (q) => q.eq("parentId", p._id).eq("dedupeKey", dedupeKey).gt("sentAt", now - CRISIS_DEDUPE_STALE_MS)).take(20);
      if (crisisPushSuppressed([...unsent, ...recentSent], dedupeKey, crisis.urgent, now)) continue;
      extra = { studentId, category: crisis.category, urgent: crisis.urgent, dedupeKey };
    }
    await ctx.db.insert("outbox", { parentId: p._id, chatId: p.telegramChatId, kind, text: text(p), createdAt: now, ...extra });
  }
}

/** Из conductor.setCrisis. categories — все категории сообщения; priorAbuse — у ребёнка уже есть ABUSE_HOME на ревью.
 *  ABUSE_HOME (сейчас или раньше) → родителю ничего, а в reviewQueue ложится строка withheldPush. Лимита по частоте
 *  нет (спека); защита только от точного дубля неотправленного. Без цитат ребёнка. */
export async function enqueueCrisis(ctx: MutationCtx, studentId: Id<"students">, categories: GuardCategory[], priorAbuse: boolean) {
  const d = parentNotifyDecision({ categories, priorAbuse });
  const routed = categories.filter((c) => crisisRouting(c)?.notifyParent);
  if (!d.notify) {
    // Пуш был бы отправлен, но родитель может быть источником: человек из reviewQueue должен увидеть это первым.
    for (const c of routed) {
      await ctx.db.insert("reviewQueue", { studentId, category: c, severity: 4, status: "open", notifyParent: false, withheldPush: true });
    }
    return;
  }
  const category = routed.find((c) => crisisRouting(c)?.urgent) ?? routed[0];
  await enqueue(ctx, studentId, "crisis", (p) => crisisText(p.lang, d.urgent), { category, urgent: d.urgent });
}

export async function enqueueTaughtBobr(ctx: MutationCtx, studentId: Id<"students">, topic: TopicId) {
  const s = await ctx.db.get("students", studentId);
  const t = graph.topics.find((x) => x.id === topic);
  if (!s || !t) return;
  await enqueue(ctx, studentId, "taught_bobr", (p) => taughtBobrText(p.lang, t.title[p.lang], s.displayName));
}

/** Вызвать там, где тема становится taught_bobr (этап TEACH_BOBR; перехода в коде пока нет). */
export const notifyTaughtBobr = internalMutation({
  args: { studentId: v.id("students"), topic: v.string() },
  returns: v.null(),
  handler: async (ctx, { studentId, topic }) => {
    await enqueueTaughtBobr(ctx, studentId, topic as TopicId);
    return null;
  },
});

const listRow = v.object({
  id: v.id("outbox"), chatId: v.string(), kind: v.string(), text: v.string(), createdAt: v.number(),
  category: v.optional(v.string()), urgent: v.optional(v.boolean()),
});

/** Сначала все неотправленные кризисы (без задержки, лимитов, тихих часов и паузы), потом несрочные, прошедшие
 *  selectDeliverable (тихие часы 21–08 Ташкент, 1 на родителя в сутки, пауза и настройки, нет ABUSE_HOME у ребёнка).
 *  Бот шлёт то, что получил; задержанное остаётся неотправленным. */
export const listUnsent = query({
  args: { botSecret: v.string(), limit: v.number() },
  returns: v.array(listRow),
  handler: async (ctx, { botSecret, limit }) => {
    assertBot(botSecret);
    const n = Math.max(1, Math.min(100, Math.floor(limit)));
    const now = Date.now();
    const crisis = await ctx.db.query("outbox").withIndex("by_kind_and_sent_and_created", (q) => q.eq("kind", "crisis").eq("sentAt", undefined)).take(n);
    const out = crisis.map((r) => ({ id: r._id, chatId: r.chatId, kind: r.kind, text: r.text, createdAt: r.createdAt, category: r.category, urgent: r.urgent }));
    if (out.length >= n) return out;

    // ponytail: по 100 неотправленных каждого вида; если их больше (пауза/настройки у многих), хвост ждёт. Индекса по родителю нет.
    const pending = [];
    const sentToday = new Set<string>();
    const dayStart = tashkentDayStart(now);
    for (const kind of NON_CRISIS_KINDS) {
      pending.push(...await ctx.db.query("outbox").withIndex("by_kind_and_sent_and_created", (q) => q.eq("kind", kind).eq("sentAt", undefined)).take(100));
      for (const r of await ctx.db.query("outbox").withIndex("by_kind_and_sent_and_created", (q) => q.eq("kind", kind).gte("sentAt", dayStart)).take(500)) sentToday.add(r.parentId);
    }
    pending.sort((a, b) => a.createdAt - b.createdAt);
    const parents = new Map<string, Doc<"parents"> | undefined>();
    const abuse = new Set<string>();
    for (const r of pending) {
      if (!parents.has(r.parentId)) parents.set(r.parentId, (await ctx.db.get("parents", r.parentId)) ?? undefined);
      if (r.studentId && !abuse.has(r.studentId)) {
        const rows = await ctx.db.query("reviewQueue").withIndex("by_student_and_category", (q) => q.eq("studentId", r.studentId!).eq("category", "ABUSE_HOME")).order("desc").take(ABUSE_LOOKUP_BOUND);
        if (priorAbuseFrom(rows, now)) abuse.add(r.studentId);
      }
    }
    const ok = selectDeliverable({ rows: pending, now, limit: n - out.length, sentTodayParents: sentToday, parents, abuseStudents: abuse });
    return [...out, ...ok.map((r) => ({ id: r._id, chatId: r.chatId, kind: r.kind, text: r.text, createdAt: r.createdAt, category: r.category, urgent: r.urgent }))];
  },
});

/** Раз в сутки (крон): сводка за сутки и «давно не заходил(а)». Идемпотентно: ключ dedupeKey на родителя.
 *  ABUSE_HOME у ребёнка → ничего. ponytail: до 500 связей за запуск; больше — пагинация. */
export const produceDigests = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const links = await ctx.db.query("parentLinks").take(500);
    for (const l of links) {
      const p = await ctx.db.get("parents", l.parentId);
      const s = await ctx.db.get("students", l.studentId);
      if (!p?.telegramChatId || !s) continue;
      const abuseRows = await ctx.db.query("reviewQueue").withIndex("by_student_and_category", (q) => q.eq("studentId", s._id).eq("category", "ABUSE_HOME")).order("desc").take(ABUSE_LOOKUP_BOUND);
      if (priorAbuseFrom(abuseRows, now)) continue;
      const topics = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", s._id)).take(20);
      const d = planDigest({ studentId: s._id, now, notifications: p.notifications, existingKeys: new Set(), topics });
      if (!d) continue;
      const dup = await ctx.db.query("outbox").withIndex("by_parent_and_dedupe_and_sent", (q) => q.eq("parentId", p._id).eq("dedupeKey", d.dedupeKey)).first();
      if (dup) continue; // повторный запуск крона
      const text = d.kind === "daily_summary" ? dailySummaryText(p.lang, d.solved, d.taught, s.displayName) : forgottenText(p.lang, d.dimmed, s.displayName);
      await ctx.db.insert("outbox", { parentId: p._id, chatId: p.telegramChatId, kind: d.kind, text, createdAt: now, studentId: s._id, dedupeKey: d.dedupeKey });
    }
    return null;
  },
});

export const markSent = mutation({
  args: { botSecret: v.string(), id: v.id("outbox") },
  returns: v.null(),
  handler: async (ctx, { botSecret, id }) => {
    assertBot(botSecret);
    const row = await ctx.db.get("outbox", id);
    if (row && row.sentAt === undefined) await ctx.db.patch("outbox", id, { sentAt: Date.now() });
    return null;
  },
});
