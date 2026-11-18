// Очередь сообщений родителю. Бот опрашивает listUnsent раз в ~3 с, шлёт и зовёт markSent.
// Писатели — обычные функции (enqueue*), чтобы вызывать их внутри чужих мутаций без под-транзакций.
import { v } from "convex/values";
import { graph } from "../lib/content";
import { crisisRouting } from "../lib/safety/crisis";
import { crisisText, taughtBobrText } from "../lib/telegram/texts";
import type { GuardCategory, TopicId } from "../lib/types";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, type MutationCtx, query } from "./_generated/server";
import { assertBot } from "./botAuth";

type Kind = "taught_bobr" | "crisis";

/** Кладёт сообщение каждому родителю ребёнка, у которого есть чат. */
async function enqueue(ctx: MutationCtx, studentId: Id<"students">, kind: Kind, text: (p: { lang: "uz" | "ru" }) => string) {
  const links = await ctx.db.query("parentLinks").withIndex("by_student", (q) => q.eq("studentId", studentId)).take(10);
  for (const l of links) {
    const p = await ctx.db.get("parents", l.parentId);
    if (!p?.telegramChatId) continue;
    await ctx.db.insert("outbox", { parentId: p._id, chatId: p.telegramChatId, kind, text: text(p), createdAt: Date.now() });
  }
}

/** Из conductor.setCrisis. ABUSE_HOME и не-кризисные категории — родителю ничего. Без цитат ребёнка. */
export async function enqueueCrisis(ctx: MutationCtx, studentId: Id<"students">, category: GuardCategory) {
  const route = crisisRouting(category);
  if (!route?.notifyParent) return;
  await enqueue(ctx, studentId, "crisis", (p) => crisisText(p.lang, route.urgent));
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
