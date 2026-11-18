// Вход Mini App: проверка Telegram initData (HMAC, Web Crypto) → сессия. Токен бота — только env TELEGRAM_BOT_TOKEN.
import { v } from "convex/values";
import { verifyInitData } from "../lib/telegram/initData";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { env } from "./botAuth";

export const parentLogin = action({
  args: { initData: v.string() },
  returns: v.object({ sessionToken: v.string() }),
  handler: async (ctx, { initData }): Promise<{ sessionToken: string }> => {
    const botToken = env("TELEGRAM_BOT_TOKEN");
    if (!botToken) throw new Error("unauthorized");
    const r = await verifyInitData(initData, botToken, Math.floor(Date.now() / 1000));
    if (!r.ok) throw new Error("unauthorized"); // причину не отдаём: ни подсказки подбирающему, ни ПДн в лог
    const sessionToken = await ctx.runMutation(internal.parent.startSession, { telegramUserId: r.telegramUserId });
    if (sessionToken === null) throw new Error("unauthorized");
    return { sessionToken };
  },
});
