// Функции для Telegram-бота (botSecret). Родитель создаётся по telegramUserId (идемпотентно).
import { v } from "convex/values";
import { mutation } from "./_generated/server";
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
    await ctx.db.patch("parents", parentId, { consent });
    return null;
  },
});

/** Цель ставит родитель (спека). Дублируется детям родителя: planner читает её со students. */
export const setGoal = mutation({
  args: { botSecret: v.string(), parentId: v.id("parents"), goal, testDate: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { botSecret, parentId, goal, testDate }) => {
    assertBot(botSecret);
    if (testDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(testDate)) throw new Error("bad testDate");
    if (goal !== "test_soon") testDate = undefined; // дата нужна только контрольной
    await ctx.db.patch("parents", parentId, { goal, testDate });
    const links = await ctx.db.query("parentLinks").withIndex("by_parent", (q) => q.eq("parentId", parentId)).take(50);
    for (const l of links) await ctx.db.patch("students", l.studentId, { goal, testDate });
    return null;
  },
});
