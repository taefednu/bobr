// Поток одного хода (спека): preGuard → CRISIS | вердикт кода → Ustoz (LLM) → zod → postChecks → mutation.
// Action не пишет в БД: только ctx.runMutation(internal.…). Текст ребёнка не логируем (ПДн).
// Любой сбой LLM → запасной путь (компонент + кнопка «подсказка»); неохраняемый LLM-текст наружу не идёт.
import { v } from "convex/values";
import { MODELS, TIMEOUTS_MS } from "../lib/config";
import {
  cacheKey, callStructured, createBreaker, createClient, fallbackUstoz, GUARD_PREFIX, guardTail, OUTPUT_CHECK_PREFIX,
  outputCheckTail, postChecksUstoz, USTOZ_PREFIX, ustozTail, type LlmCache, type LlmClient,
} from "../lib/llm";
import { crisisRouting, preGuard } from "../lib/safety";
import { GuardResult, OutputCheck, UstozTurn } from "../lib/types";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, type ActionCtx } from "./_generated/server";
import { operandFractions, publicTask } from "./lessonView";

// ponytail: breaker живёт в изоляте — не глобальный; при нескольких изолятах порог 3/30 с считается на каждом.
const breaker = createBreaker();

// Читаем env на каждый ход: `convex env set` вступает в силу без передеплоя. Ключа нет → только REPLAY из
// llmCache (miss → запасной путь); DEMO_MODE=replay включает то же при ключе.
// eslint-disable-next-line @convex-dev/no-process-env -- ключ задан владельцем в env деплоя (BLOCKERS B8)
const env = (k: string) => process.env[k];
let cached: { key: string; client: LlmClient } | null = null;
function llm(): { mode: "live" | "replay"; client: LlmClient } {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) return { mode: "replay", client: { messages: { parse: () => Promise.reject(new Error("no ANTHROPIC_API_KEY")) } } };
  if (cached?.key !== key) cached = { key, client: createClient(key) };
  return { mode: env("DEMO_MODE") === "replay" ? "replay" : "live", client: cached.client };
}

const cacheOf = (ctx: ActionCtx): LlmCache => ({
  get: (key) => ctx.runQuery(internal.llmCache.get, { key }),
  put: async (key, step, response) => {
    await ctx.runMutation(internal.llmCache.put, { key, step, response });
  },
});

// Форма ответа conductor.turnContext (явно, иначе TS видит цикл через api).
type Turn = {
  lang: "uz" | "ru"; task: NonNullable<Doc<"students">["currentTask"]>; hintLevel: number; lastVerdict: string;
  riskCount: number; recent: string[]; last6: string[];
};

/** Ustoz → zod → postChecks. null = любой сбой (запасной путь). */
async function ustozStep(ctx: ActionCtx, c: Turn, beat: string, verdict: string, childInput: string) {
  const r = await callStructured({
    ...llm(), breaker, cache: cacheOf(ctx), step: "ustozTurn", model: MODELS.ustozTurn, schema: UstozTurn,
    system: USTOZ_PREFIX,
    tail: ustozTail({
      lang: c.lang, beat, task: publicTask(c.task), verdict, hintLevel: c.hintLevel, forbiddenLines: c.recent, childInput,
    }),
    timeoutMs: TIMEOUTS_MS.ustoz, effort: "low",
    cacheKey: cacheKey({ step: "ustozTurn", beat, itemId: c.task.id, lang: c.lang, normInput: childInput }),
  });
  if (!r.ok) return null;
  const childNumbers = childInput.match(/\d+(?:[.,]\d+)?(?:\/\d+)?/g) ?? [];
  const post = postChecksUstoz(r.value, {
    answer: c.task.answer, numbersShown: c.task.numbersShown, childNumbers, recent: c.recent,
  });
  return post.ok ? post.value : null;
}

/** outputCheck (Haiku) на свободной реплике: нет ответа или нарушение персоны → сбой. */
async function outputOk(ctx: ActionCtx, c: Turn, reply: string) {
  const r = await callStructured({
    ...llm(), breaker, cache: cacheOf(ctx), step: "outputCheck", model: MODELS.outputCheck,
    schema: OutputCheck, system: OUTPUT_CHECK_PREFIX, tail: outputCheckTail({ reply }),
    timeoutMs: TIMEOUTS_MS.guard, effort: "low",
    cacheKey: cacheKey({ step: "outputCheck", beat: "reply", itemId: c.task.id, lang: c.lang, normInput: reply }),
  });
  return r.ok && r.value.ok && r.value.violatesPersona.length === 0;
}

async function guardStep(ctx: ActionCtx, c: Turn, childInput: string) {
  return await callStructured({
    ...llm(), breaker, cache: cacheOf(ctx), step: "guardIn", model: MODELS.guardIn, schema: GuardResult,
    system: GUARD_PREFIX, tail: guardTail({ lang: c.lang, last6: c.last6, riskCount: c.riskCount, childInput }),
    timeoutMs: TIMEOUTS_MS.guard, effort: "low",
    cacheKey: cacheKey({ step: "guardIn", beat: "guard", itemId: c.task.id, lang: c.lang, normInput: childInput }),
  });
}

export const turn = action({
  args: {
    studentId: v.id("students"),
    input: v.object({ type: v.union(v.literal("answer"), v.literal("text")), value: v.string() }),
  },
  returns: v.object({ status: v.union(v.literal("crisis"), v.literal("replied"), v.literal("fallback"), v.literal("rejected")) }),
  handler: async (ctx, { studentId, input }): Promise<{ status: "crisis" | "replied" | "fallback" | "rejected" }> => {
    const c: Turn | null = await ctx.runQuery(internal.conductor.turnContext, { studentId });
    if (!c) return { status: "rejected" as const };

    // 1. preGuard (код): маска ПДн, нормализация, триггеры. Дальше везде — только pg.text.
    const pg = preGuard(input.value, c.lang);
    if (pg.crisis) {
      await ctx.runMutation(internal.conductor.setCrisis, { studentId, category: pg.crisis.category });
      return { status: "crisis" as const };
    }

    const reply = async (turnNo: number, u: Awaited<ReturnType<typeof ustozStep>>) => {
      if (u && u.reply && (await outputOk(ctx, c, u.reply))) {
        await ctx.runMutation(internal.conductor.recordReply, {
          studentId, turnNo, reply: u.reply, component: u.component, hintButton: false, hintLevel: u.hintLevel,
        });
        return { status: "replied" as const };
      }
      const fb = fallbackUstoz({ numbersShown: operandFractions(c.task.params) });
      await ctx.runMutation(internal.conductor.recordReply, { studentId, turnNo, ...fb });
      return { status: "fallback" as const };
    };

    if (input.type === "answer") {
      // 2. ответ: LLM-guard не нужен — вердикт считает код.
      const { turnNo, verdict, beat }: { turnNo: number; verdict: string; beat: string } = await ctx.runMutation(internal.conductor.submitAnswer, { studentId, value: pg.text });
      if (verdict === "unparsed") {
        // Не дробь — это уже текст ребёнка без guardIn: LLM его не видит.
        await ctx.runMutation(internal.conductor.recordReply, { studentId, turnNo, reply: null, component: null, hintButton: false });
        return { status: "fallback" as const };
      }
      return await reply(turnNo, await ustozStep(ctx, c, beat, verdict, pg.text));
    }

    // 2. текст: guardIn ∥ спекулятивный Ustoz; результат Ustoz живёт, только если guard сказал SAFE.
    const turnNo: number = await ctx.runMutation(internal.conductor.recordText, { studentId, value: pg.text });
    const [g, u] = await Promise.all([guardStep(ctx, c, pg.text), ustozStep(ctx, c, "child_text", c.lastVerdict, pg.text)]);
    if (g.ok && g.value.category !== "SAFE" && g.value.severity >= 2 && crisisRouting(g.value.category)) {
      await ctx.runMutation(internal.conductor.setCrisis, { studentId, category: g.value.category });
      return { status: "crisis" as const };
    }
    return await reply(turnNo, g.ok && g.value.category === "SAFE" ? u : null);
  },
});
