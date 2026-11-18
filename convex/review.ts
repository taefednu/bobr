// Очередь ревьюера (B11). Читает и закрывает флаги reviewQueue; наружу ничего не шлёт (кому сигнал — решает владелец).
// Доступ как у бота: botSecret == env BOT_SECRET, constant-time. Ответ без текста ребёнка и без имени: только id, категория, серьёзность.
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { assertBot } from "./botAuth";

export const REVIEW_LIST_LIMIT = 50;
const OPEN_SCAN = 200;

/** Открытые флаги: withheldPush первыми, дальше по возрасту. */
export async function listOpenHandler(ctx: Pick<QueryCtx, "db">, args: { botSecret: string }) {
  assertBot(args.botSecret);
  const open = await ctx.db.query("reviewQueue").withIndex("by_status", (q) => q.eq("status", "open")).take(OPEN_SCAN);
  // ponytail: берём первые OPEN_SCAN открытых; при очереди длиннее withheldPush-строка за пределом окна не попадёт наверх — тогда индекс (status, withheldPush) через заявку в SCHEMA_REQUESTS
  const rank = (r: { withheldPush?: boolean }) => (r.withheldPush ? 0 : 1);
  return open
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i)
    .slice(0, REVIEW_LIST_LIMIT)
    .map(({ r }) => ({
      id: r._id, studentId: r.studentId, category: r.category, severity: r.severity,
      withheldPush: r.withheldPush === true, notifyParent: r.notifyParent, createdAt: r._creationTime,
    }));
}

/** Закрыть флаг. Меняет только status; повтор и конфликтующий второй вызов статус не трогают. */
export async function closeHandler(ctx: Pick<MutationCtx, "db">, args: { botSecret: string; id: Id<"reviewQueue">; status: "reviewed" | "dismissed" }) {
  assertBot(args.botSecret);
  const row = await ctx.db.get("reviewQueue", args.id);
  if (!row) return { status: "missing" as const };
  if (row.status !== "open") return { status: row.status };
  await ctx.db.patch("reviewQueue", args.id, { status: args.status });
  return { status: args.status };
}

export const listOpen = query({ args: { botSecret: v.string() }, handler: listOpenHandler });

export const close = mutation({
  args: { botSecret: v.string(), id: v.id("reviewQueue"), status: v.union(v.literal("reviewed"), v.literal("dismissed")) },
  handler: closeHandler,
});
