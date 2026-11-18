// Код привязки устройства ребёнка (SPEC_SYSTEM §3): бот создаёт код, ребёнок открывает {PUBLIC_APP_URL}/c/{code}
// → claim → сессия child. Одноразовый, 24 ч. «Второго родителя» по этому коду больше нет (BLOCKERS B10).
import { v } from "convex/values";
import { randomString } from "../lib/telegram/secure";
import { mutation } from "./_generated/server";
import { assertBot, env } from "./botAuth";
import { createChildSession } from "./session";

const TTL_MS = 24 * 3600_000;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // без 0/O/1/I/L

export const create = mutation({
  args: { botSecret: v.string(), studentId: v.id("students") },
  returns: v.object({ code: v.string(), url: v.string() }),
  handler: async (ctx, { botSecret, studentId }) => {
    assertBot(botSecret);
    if (!(await ctx.db.get("students", studentId))) throw new Error("student not found");
    const base = env("PUBLIC_APP_URL")?.replace(/\/+$/, "");
    if (!base) throw new Error("PUBLIC_APP_URL is not set");
    let code = randomString(ALPHABET, 8);
    for (let i = 0; i < 5 && (await ctx.db.query("linkCodes").withIndex("by_code", (q) => q.eq("code", code)).first()); i++)
      code = randomString(ALPHABET, 8);
    await ctx.db.insert("linkCodes", { code, studentId, expiresAt: Date.now() + TTL_MS });
    return { code, url: `${base}/c/${code}` };
  },
});

/** Устройство ребёнка гасит код и получает токен сессии (в localStorage). Без botSecret: код и есть секрет.
 *  Ошибка одна на все случаи — не подсказываем, существует ли код. */
// ponytail: без лимита попыток — 31^8 вариантов и 24 ч жизни; лимит по IP, если выйдем из локального демо.
export const claim = mutation({
  args: { code: v.string() },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, { code }) => {
    const row = await ctx.db.query("linkCodes").withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase())).first();
    if (!row || row.usedAt !== undefined || row.expiresAt < Date.now() || !(await ctx.db.get("students", row.studentId)))
      throw new Error("invalid or expired code");
    await ctx.db.patch("linkCodes", row._id, { usedAt: Date.now() });
    return { token: await createChildSession(ctx, row.studentId) };
  },
});
