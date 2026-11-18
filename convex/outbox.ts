// Очередь сообщений родителю. Бот опрашивает listUnsent раз в ~3 с, шлёт и зовёт markSent.
// Писатели — обычные функции (enqueue*), чтобы вызывать их внутри чужих мутаций без под-транзакций.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { CRISIS_DEDUPE_STALE_MS, crisisDedupeKey, crisisPushSuppressed, crisisRouting, parentNotifyDecision } from "../lib/safety/crisis";
import { crisisText, taughtBobrText } from "../lib/telegram/texts";
import type { GuardCategory, TopicId } from "../lib/types";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx, query } from "./_generated/server";
import { assertBot } from "./botAuth";

type Kind = "taught_bobr" | "crisis";

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

export const listUnsent = query({
  args: { botSecret: v.string(), limit: v.number() },
  returns: v.array(v.object({ id: v.id("outbox"), chatId: v.string(), kind: v.string(), text: v.string(), createdAt: v.number() })),
  handler: async (ctx, { botSecret, limit }) => {
    assertBot(botSecret);
    const rows = await ctx.db.query("outbox").withIndex("by_sent_and_created", (q) => q.eq("sentAt", undefined))
      .order("asc").take(Math.max(1, Math.min(100, Math.floor(limit))));
    return rows.map((r) => ({ id: r._id, chatId: r.chatId, kind: r.kind, text: r.text, createdAt: r.createdAt }));
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
