// Удаление по сроку (спека: сырые turns 30 дней, флаги reviewQueue 90). Батч + продолжение через scheduler, по guidelines.
// Не трогаем: открытые флаги и ABUSE_HOME-строки, которые ещё держат пуш родителю (abuseRowCounts из lib/safety/crisis).
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { abuseRowCounts } from "../lib/safety/crisis";

const DAY_MS = 86_400_000;
export const TURNS_DAYS = 30;
export const FLAGS_DAYS = 90;
export const RETENTION_BATCH = 200; // удалений на таблицу за транзакцию; полный батч → продолжение

export const turnsCutoff = (now: number) => now - TURNS_DAYS * DAY_MS;
export const flagsCutoff = (now: number) => now - FLAGS_DAYS * DAY_MS;

type Flag = { category: string; status: string; severity: number; _creationTime: number };
/** Строку reviewQueue можно удалить: закрыта человеком, старше 90 дней и пуш по ABUSE_HOME она уже не держит. */
export const flagExpired = (r: Flag, now: number): boolean =>
  r.status !== "open" && r._creationTime < flagsCutoff(now) && !abuseRowCounts(r, now);

export const purgeExpired = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const now = Date.now();
    const turns = await ctx.db.query("turns").withIndex("by_creation_time", (q) => q.lt("_creationTime", turnsCutoff(now))).take(RETENTION_BATCH);
    for (const t of turns) await ctx.db.delete("turns", t._id);
    let more = turns.length === RETENTION_BATCH;
    for (const status of ["reviewed", "dismissed"] as const) {
      const rows = await ctx.db.query("reviewQueue").withIndex("by_status", (q) => q.eq("status", status).lt("_creationTime", flagsCutoff(now))).take(RETENTION_BATCH);
      for (const r of rows) if (flagExpired(r, now)) await ctx.db.delete("reviewQueue", r._id);
      more ||= rows.length === RETENTION_BATCH;
    }
    if (more) await ctx.scheduler.runAfter(0, internal.retention.purgeExpired, {});
    return null;
  },
});
