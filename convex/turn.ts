// Поток одного хода (спека): preGuard → CRISIS | вердикт кода → Ustoz (LLM) → zod → postChecks → mutation.
// Action не пишет в БД: только ctx.runMutation(internal.…). Текст ребёнка не логируем (ПДн).
// Любой сбой LLM → запасной путь (компонент + кнопка «подсказка»); неохраняемый LLM-текст наружу не идёт.
import { v } from "convex/values";
import { MODELS, TIMEOUTS_MS } from "../lib/config";
import {
  cacheKey, callStructured, createBreaker, createClient, GUARD_PREFIX, guardCacheKey, guardTail, OUTPUT_CHECK_PREFIX,
  outputCheckTail, postChecksUstoz, USTOZ_PREFIX, ustozTail, type LlmCache, type LlmClient,
} from "../lib/llm";
import { checkAnswer, type TaskKind } from "../lib/fractions";
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
async function ustozStep(
  ctx: ActionCtx, c: Turn, beat: string, verdict: string, childInput: string,
  claimed?: { value: string; verdict: string }[],
) {
  const r = await callStructured({
    ...llm(), breaker, cache: cacheOf(ctx), step: "ustozTurn", model: MODELS.ustozTurn, schema: UstozTurn,
    system: USTOZ_PREFIX,
    tail: ustozTail({
      lang: c.lang, beat, task: publicTask(c.task), verdict, hintLevel: c.hintLevel, forbiddenLines: c.recent, childInput, claimed,
    }),
    timeoutMs: TIMEOUTS_MS.ustoz, effort: "low",
    // ключ учитывает вердикт, уровень подсказки и «заявленные» дроби: от них зависит реплика
    cacheKey: cacheKey({
      step: "ustozTurn", beat, itemId: c.task.id, lang: c.lang,
      normInput: `${childInput}\n${verdict}\n${c.hintLevel}\n${(claimed ?? []).map((x) => `${x.value}=${x.verdict}`).join(",")}`,
    }),
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
    cacheKey: guardCacheKey({ lang: c.lang, itemId: c.task.id, last6: c.last6, riskCount: c.riskCount, childInput }),
  });
}

// Категории guard, при которых Ustoz отвечает В РОЛИ (отказ по-доброму): реплика всё равно идёт через postChecks и outputCheck.
const IN_CHARACTER = new Set(["SAFE", "ANSWER_EXTRACTION", "JAILBREAK"]);

type Status = "crisis" | "replied" | "fallback" | "rejected";

export const turn = action({
  args: {
    studentId: v.id("students"),
    input: v.object({ type: v.union(v.literal("answer"), v.literal("text"), v.literal("hint")), value: v.string() }),
  },
  returns: v.object({ status: v.union(v.literal("crisis"), v.literal("replied"), v.literal("fallback"), v.literal("rejected")) }),
  handler: async (ctx, { studentId, input }): Promise<{ status: Status }> => {
    const c: Turn | null = await ctx.runQuery(internal.conductor.turnContext, { studentId });
    if (!c) return { status: "rejected" };

    // Подсказка: лесенку и компонент ведёт код, текст ребёнка не участвует.
    if (input.type === "hint") {
      await ctx.runMutation(internal.conductor.pressHint, { studentId });
      return { status: "fallback" };
    }

    // 1. preGuard (код): маска ПДн, нормализация, триггеры. Дальше везде — только pg.text.
    const pg = preGuard(input.value, c.lang);
    if (pg.crisis) {
      await ctx.runMutation(internal.conductor.setCrisis, { studentId, category: pg.crisis.category });
      return { status: "crisis" };
    }

    // Код-вердикт и номер хода. Нераспознанный ответ — это текст ребёнка: идёт тем же путём с guardIn.
    let turnNo: number;
    let verdict = c.lastVerdict;
    let beat = "child_text";
    let hintLevel = c.hintLevel;
    if (input.type === "answer") {
      const r: { turnNo: number; verdict: string; beat: string; hintLevel: number } =
        await ctx.runMutation(internal.conductor.submitAnswer, { studentId, value: pg.text });
      ({ turnNo, verdict, beat, hintLevel } = r);
    } else {
      turnNo = await ctx.runMutation(internal.conductor.recordText, { studentId, value: pg.text });
    }
    const cc: Turn = { ...c, hintLevel };
    // verdict "ok": задача уже сменилась на следующую — кнопки подсказки нет, «следующую задачу» показывает код.
    const solvedNow = input.type === "answer" && verdict === "ok";
    const hintButton = !solvedNow;

    const respond = async (u: Awaited<ReturnType<typeof ustozStep>>): Promise<{ status: Status }> => {
      if (u?.reply && (await outputOk(ctx, cc, u.reply))) {
        await ctx.runMutation(internal.conductor.recordReply, { studentId, turnNo, reply: u.reply, component: u.component, hintButton });
        return { status: "replied" };
      }
      // Запасной путь: компонент по операндам (из кода); после верного ответа компонента нет.
      const ops = solvedNow ? [] : operandFractions(c.task.params);
      await ctx.runMutation(internal.conductor.recordReply, {
        studentId, turnNo, reply: null, hintButton,
        component: ops.length ? { type: "pie", params: ops.map((value, i) => ({ key: `f${i + 1}`, value })) } : null,
      });
      return { status: "fallback" };
    };

    const fallback = () => respond(null);

    // Верный ответ: LLM-guard не нужен (ввод — разобранная дробь), вердикт посчитал код.
    if (input.type === "answer" && verdict !== "unparsed") return await respond(await ustozStep(ctx, cc, beat, verdict, pg.text));

    // 2. текст: guardIn ∥ спекулятивный Ustoz; реплика живёт, только если категория guard из IN_CHARACTER.
    // Дроби из текста ребёнка → вердикт КОДА (модель не решает, верно ли «2/5»).
    const claimed = input.type === "text"
      ? [...new Set(pg.text.match(/\d+\s*\/\s*\d+/g) ?? [])].slice(0, 3).map((value) => ({
          value: value.replace(/\s/g, ""),
          verdict: ((r) => (r.status === "misconception" ? `misconception:${r.misconception}` : r.status))(
            checkAnswer(value, { ...c.task, kind: c.task.kind as TaskKind }),
          ),
        }))
      : undefined;
    const [g, u] = await Promise.all([guardStep(ctx, cc, pg.text), ustozStep(ctx, cc, beat, verdict, pg.text, claimed)]);

    if (!g.ok) {
      // guard недоступен (таймаут / breaker / нет ключа): ничего неохраняемого наружу. Если preGuard гасил
      // мягкий триггер гиперболой — это слепая зона: флаг на ревью.
      if (pg.suppressed) {
        await ctx.runMutation(internal.conductor.flagRisk, { studentId, category: pg.suppressed.category, severity: 1, notifyParent: false });
      }
      return await fallback();
    }
    const { category, severity } = g.value;
    if (category !== "SAFE" && severity >= 2 && crisisRouting(category)) {
      await ctx.runMutation(internal.conductor.setCrisis, { studentId, category });
      return { status: "crisis" };
    }
    if (category !== "SAFE") {
      await ctx.runMutation(internal.conductor.flagRisk, {
        studentId, category, severity, notifyParent: crisisRouting(category)?.notifyParent ?? false,
      });
    }
    if (category === "PII") await ctx.runMutation(internal.conductor.maskChildTurn, { studentId, turnNo });
    return IN_CHARACTER.has(category) ? await respond(u) : await fallback();
  },
});
