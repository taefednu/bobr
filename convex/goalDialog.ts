// Живая фраза Bobr на экране цели (BACKEND_TASKS 9). action → LLM → zod GoalDialog → postChecks → outputCheck.
// Модель подбирает только фразу; кнопки и intent — код (GoalView / GOAL_INTENTS). Ввода ребёнка и имени в промпте нет.
// Любой сбой → { reply: null }: экран показывает goal.ask из i18n. Экран не ждёт этот action.
// Action не пишет в БД: llmCache пишет callStructured через cacheOf (как в chat).
import { v } from "convex/values";
import { MODELS, TIMEOUTS_MS } from "../lib/config";
import { goalLine } from "../lib/chat/goalLine";
import { deferredPut } from "../lib/bobr/deferredCache";
import { cacheKey, callStructured, createBreaker } from "../lib/llm";
import { GOAL_ANGLES, GOAL_DIALOG_PREFIX, goalDialogTail } from "../lib/llm/prompts/goalDialog";
import { GoalDialog } from "../lib/types";
import { internal } from "./_generated/api";
import { action, internalQuery } from "./_generated/server";
import { childOrNull } from "./session";
import { cacheOf, llm, outputOk, type Turn } from "./turn";

const breaker = createBreaker();

export const langOf = internalQuery({
  args: { token: v.string() },
  returns: v.union(v.null(), v.union(v.literal("uz"), v.literal("ru"))),
  handler: async (ctx, { token }) => {
    return (await childOrNull(ctx, token))?.lang ?? null;
  },
});

export const line = action({
  args: { token: v.string() },
  // why — только код причины сбоя, без текста (как diag в chat.send)
  returns: v.object({ reply: v.union(v.string(), v.null()), why: v.optional(v.string()) }),
  handler: async (ctx, { token }): Promise<{ reply: string | null; why?: string }> => {
    try {
      const lang: "uz" | "ru" | null = await ctx.runQuery(internal.goalDialog.langOf, { token });
      if (!lang) return { reply: null, why: "no_session" };
      const dp = deferredPut(cacheOf(ctx));
      const r = await callStructured({
        ...llm(), breaker, cache: dp.cache, step: "goalDialog", schema: GoalDialog, model: MODELS.goalDialog,
        system: GOAL_DIALOG_PREFIX,
        tail: goalDialogTail({ lang, angle: GOAL_ANGLES[Date.now() % GOAL_ANGLES.length], forbiddenLines: [] }),
        timeoutMs: TIMEOUTS_MS.bobr, effort: "low", thinkingOff: true,
        cacheKey: cacheKey({ step: "goalDialog", beat: "ask", itemId: "goal", lang }),
      });
      if (!r.ok) return { reply: null, why: `llm:${r.reason}` };
      const reply = goalLine(r.value, lang);
      if (!reply) return { reply: null, why: "post" };
      const gc = { lang, task: { id: "goal" } } as unknown as Turn;
      if (!(await outputOk(ctx, { totalMs: 0 }, gc, reply))) return { reply: null, why: "outputCheck" };
      await dp.flush();
      return { reply };
    } catch {
      return { reply: null, why: "error" };
    }
  },
});
