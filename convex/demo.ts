// Демо-стенд для двух ноутбуков: сбрасывает демо-родителя и ребёнка в стартовое состояние.
// Запуск: bash scripts/demo-reset.sh. internal → из интернета не вызвать. Печатает свежий код привязки и токен Mini App.
import { internalMutation } from "./_generated/server";
import { randomString } from "../lib/telegram/secure";
import { v } from "convex/values";

const DEMO_TG_ID = "demo-parent";
const DAY_MS = 86_400_000;

export const reset = internalMutation({
  args: {},
  returns: v.object({ parentId: v.id("parents"), studentId: v.id("students"), linkCode: v.string(), sessionToken: v.string() }),
  handler: async (ctx) => {
    const old = await ctx.db.query("parents").withIndex("by_telegram_user", (q) => q.eq("telegramUserId", DEMO_TG_ID)).collect();
    for (const p of old) {
      const links = await ctx.db.query("parentLinks").withIndex("by_parent", (q) => q.eq("parentId", p._id)).collect();
      for (const l of links) {
        const sid = l.studentId;
        for (const t of ["topicStatus", "houses"] as const) {
          for (const r of await ctx.db.query(t).withIndex("by_student_and_topic", (q) => q.eq("studentId", sid)).collect()) await ctx.db.delete(t, r._id);
        }
        for (const r of await ctx.db.query("plans").withIndex("by_student", (q) => q.eq("studentId", sid)).collect()) await ctx.db.delete("plans", r._id);
        for (const r of await ctx.db.query("turns").withIndex("by_student_and_ts", (q) => q.eq("studentId", sid)).collect()) await ctx.db.delete("turns", r._id);
        for (const r of await ctx.db.query("reviewQueue").withIndex("by_student", (q) => q.eq("studentId", sid)).collect()) await ctx.db.delete("reviewQueue", r._id);
        for (const r of await ctx.db.query("linkCodes").collect()) if (r.studentId === sid) await ctx.db.delete("linkCodes", r._id); // ponytail: скан таблицы, демо-объём
        for (const r of await ctx.db.query("parentLinks").withIndex("by_student", (q) => q.eq("studentId", sid)).collect()) await ctx.db.delete("parentLinks", r._id);
        await ctx.db.delete("students", sid);
      }
      for (const r of await ctx.db.query("outbox").collect()) if (r.parentId === p._id) await ctx.db.delete("outbox", r._id); // ponytail: скан, демо-объём
      for (const r of await ctx.db.query("parentSessions").collect()) if (r.parentId === p._id) await ctx.db.delete("parentSessions", r._id);
      await ctx.db.delete("parents", p._id);
    }

    const now = Date.now();
    const testDate = new Date(now + 3 * DAY_MS).toISOString().slice(0, 10);
    const parentId = await ctx.db.insert("parents", {
      telegramUserId: DEMO_TG_ID, telegramChatId: DEMO_TG_ID, firstName: "Demo", lang: "ru", consent: true, goal: "test_soon", testDate,
    });
    const studentId = await ctx.db.insert("students", {
      lang: "ru", parentId, consent: true, state: "HOME", riskCount: 0, displayName: "Demo", grade: 5, goal: "test_soon", testDate,
    });
    await ctx.db.insert("parentLinks", { parentId, studentId });

    // Состояние после диагностики демо-пути: N1, N2 — сам; N9, N8, N5, N6 — пробелы (план N8→N6→N5→N9).
    // N8 станет «научил Bobr» вживую — дом у родителя оживёт.
    const seed = [["N1", "solved_self"], ["N2", "solved_self"], ["N9", "gap"], ["N8", "gap"], ["N5", "gap"], ["N6", "gap"]] as const;
    for (const [topic, level] of seed) {
      await ctx.db.insert("topicStatus", {
        studentId, topic, level, streak: 0, tasksThisSession: 0, bobrQuestionRounds: 0,
        ...(level === "solved_self" ? { solvedSelfAt: now - 2 * DAY_MS } : {}),
      });
      await ctx.db.insert("houses", { studentId, topic, state: level === "gap" ? "scaffold" : "built" });
    }

    const linkCode = randomString("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 8);
    await ctx.db.insert("linkCodes", { code: linkCode, studentId, expiresAt: now + DAY_MS });
    const sessionToken = randomString("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 48);
    await ctx.db.insert("parentSessions", { parentId, token: sessionToken, expiresAt: now + 7 * DAY_MS });
    return { parentId, studentId, linkCode, sessionToken };
  },
});
