// Код привязки ребёнка к родителю (в т.ч. второму). Одноразовый, 24 ч.
import { v } from "convex/values";
import { randomString } from "../lib/telegram/secure";
import { mutation } from "./_generated/server";
import { assertBot, env } from "./botAuth";

const TTL_MS = 24 * 3600_000;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // без 0/O/1/I/L

export const create = mutation({
  args: { botSecret: v.string(), studentId: v.id("students") },
  returns: v.object({ code: v.string(), url: v.string() }),
  handler: async (ctx, { botSecret, studentId }) => {
    assertBot(botSecret);
    if (!(await ctx.db.get("students", studentId))) throw new Error("student not found");
    const username = env("TELEGRAM_BOT_USERNAME");
    if (!username) throw new Error("TELEGRAM_BOT_USERNAME is not set");
    let code = randomString(ALPHABET, 8);
    for (let i = 0; i < 5 && (await ctx.db.query("linkCodes").withIndex("by_code", (q) => q.eq("code", code)).first()); i++)
      code = randomString(ALPHABET, 8);
    await ctx.db.insert("linkCodes", { code, studentId, expiresAt: Date.now() + TTL_MS });
    return { code, url: `https://t.me/${username}?start=${code}` };
  },
});

export const redeem = mutation({
  args: { botSecret: v.string(), code: v.string(), telegramUserId: v.string() },
  returns: v.object({ studentId: v.id("students"), parentId: v.id("parents"), displayName: v.union(v.string(), v.null()) }),
  handler: async (ctx, { botSecret, code, telegramUserId }) => {
    assertBot(botSecret);
    const parent = await ctx.db.query("parents").withIndex("by_telegram_user", (q) => q.eq("telegramUserId", telegramUserId)).first();
    if (!parent) throw new Error("parent not found");
    const row = await ctx.db.query("linkCodes").withIndex("by_code", (q) => q.eq("code", code.trim().toUpperCase())).first();
    if (!row || row.usedAt !== undefined || row.expiresAt < Date.now()) throw new Error("invalid or expired code");
    const student = await ctx.db.get("students", row.studentId);
    if (!student) throw new Error("student not found");
    await ctx.db.patch("linkCodes", row._id, { usedAt: Date.now() });
    const links = await ctx.db.query("parentLinks").withIndex("by_student", (q) => q.eq("studentId", row.studentId)).take(10);
    if (!links.some((l) => l.parentId === parent._id)) await ctx.db.insert("parentLinks", { parentId: parent._id, studentId: row.studentId });
    return { studentId: row.studentId, parentId: parent._id, displayName: student.displayName ?? null };
  },
});
