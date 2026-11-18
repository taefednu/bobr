// Поток одного хода (спека): preGuard → CRISIS | вердикт кода → Ustoz (LLM) → zod → postChecks → mutation.
// Action не пишет в БД: только ctx.runMutation(internal.…). Текст ребёнка не логируем (ПДн).
// Любой сбой LLM → запасной путь (компонент + кнопка «подсказка»); неохраняемый LLM-текст наружу не идёт.
import { v } from "convex/values";
import { MODELS, resolveDemoMode, TIMEOUTS_MS } from "../lib/config";
import {
  cacheKey, callStructured, createBreaker, createClient, GUARD_PREFIX, guardCacheKey, guardTail, OUTPUT_CHECK_PREFIX,
  normalizeComponent, outputCheckTail, postUstoz, toStored, USTOZ_PREFIX, ustozTail, type LlmCache, type LlmClient, type LlmMeta,
} from "../lib/llm";
import { checkAnswer, type TaskKind } from "../lib/fractions";
import { crisisRouting, preGuard } from "../lib/safety";
import { GuardResult, OutputCheck, UstozTurn } from "../lib/types";
import type { UstozTurn as UstozTurnT } from "../lib/types";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, type ActionCtx } from "./_generated/server";
import { operandFractions, publicTask } from "./lessonView";
import { whoArgs } from "./session";
import { isExplicitHelpRequest } from "../lib/socratic/state";
import { fallbackAsk, fallbackHint } from "../lib/socratic/fallback";
import {
  approvedHints, HintSelection, HINT_CATALOG_VERSION, HINT_SELECTOR_PREFIX, hintSelectionTail, renderHint, safeAnalogy,
  type EscalationLevel, type HintContext, type InterestTheme,
} from "../lib/socratic/hints";

// ponytail: breaker живёт в изоляте — не глобальный; при нескольких изолятах порог 3/30 с считается на каждом.
const breaker = createBreaker();

// Читаем env на каждый ход: `convex env set` вступает в силу без передеплоя. Режим — resolveDemoMode (lib/config.ts):
// replay = только llmCache (miss → запасной путь), нужен без ключа или при DEMO_MODE=replay.
// eslint-disable-next-line @convex-dev/no-process-env -- ключ задан владельцем в env деплоя (BLOCKERS B8)
const env = (k: string) => process.env[k];
let cached: { key: string; client: LlmClient } | null = null;
export function llm(): { mode: "live" | "replay"; client: LlmClient } {
  const key = env("ANTHROPIC_API_KEY");
  const mode = resolveDemoMode(env("DEMO_MODE"), !!key);
  if (mode === "replay" || !key) return { mode: "replay", client: { messages: { parse: () => Promise.reject(new Error("replay: no network")) } } };
  if (cached?.key !== key) cached = { key, client: createClient(key) };
  return { mode, client: cached.client };
}

export const cacheOf = (ctx: ActionCtx): LlmCache => ({
  get: (key) => ctx.runQuery(internal.llmCache.get, { key }),
  put: async (key, step, response) => {
    await ctx.runMutation(internal.llmCache.put, { key, step, response });
  },
});

// Форма ответа conductor.turnContext (явно, иначе TS видит цикл через api).
export type Turn = {
  lang: "uz" | "ru"; task: NonNullable<Doc<"students">["currentTask"]>; hintLevel: number; lastVerdict: string;
  riskCount: number; recent: string[]; last6: string[]; turnNo: number;
  socratic?: null | {
    taskInstanceId: Id<"taskProgress">; lessonSessionId: Id<"lessonSessions">;
    attemptCount: number; escalationLevel: EscalationLevel; misconceptionTag: string | null; interestTheme: InterestTheme;
  };
};

// Диагностика хода (без текста ребёнка и реплик): какой шаг сколько занял, где сломалось, попал ли кэш промпта.
export type StepDiag = { ok: boolean; why?: string; ms: number; cacheRead?: number; cacheWrite?: number; input?: number };
export type Diag = { totalMs: number; guard?: StepDiag; ustoz?: StepDiag; outputCheck?: StepDiag; component?: "model" | "code"; askedType?: "pie" | "strip" | "line"; path?: string; ustozRetry?: boolean };
const sd = (r: { ok: boolean; meta: LlmMeta } & ({ reason: string } | object), why?: string): StepDiag => ({
  ...r.meta, ok: r.ok && !why, why: why ?? ("reason" in r ? r.reason : undefined),
});

/** Ustoz → zod → postChecks. null = любой сбой (запасной путь). */
async function ustozStep(
  ctx: ActionCtx, d: Diag, c: Turn, beat: string, verdict: string, childInput: string,
  claimed?: { value: string; verdict: string }[],
): Promise<UstozTurnT | null> {
  // Спека, repeatGuard: похоже на последние реплики > 0.7 → 1 повтор генерации.
  const first = await ustozOnce(ctx, d, c, beat, verdict, childInput, claimed);
  if (first !== "repeat") return first;
  d.ustozRetry = true;
  const again = await ustozOnce(ctx, d, c, beat, verdict, childInput, claimed);
  return again === "repeat" ? null : again;
}

async function ustozOnce(
  ctx: ActionCtx, d: Diag, c: Turn, beat: string, verdict: string, childInput: string,
  claimed?: { value: string; verdict: string }[],
): Promise<UstozTurnT | null | "repeat"> {
  const r = await callStructured({
    ...llm(), breaker, cache: cacheOf(ctx), step: "ustozTurn", model: MODELS.ustozTurn, schema: UstozTurn,
    system: USTOZ_PREFIX,
    tail: ustozTail({
      lang: c.lang, beat, task: publicTask(c.task), verdict, hintLevel: c.hintLevel, forbiddenLines: c.recent, childInput, claimed,
    }),
    timeoutMs: TIMEOUTS_MS.ustoz, effort: "low", thinkingOff: true,
    // ключ учитывает вердикт, уровень подсказки и «заявленные» дроби: от них зависит реплика
    cacheKey: cacheKey({
      step: "ustozTurn", beat, itemId: c.task.id, lang: c.lang,
      normInput: `${childInput}\n${verdict}\n${c.hintLevel}\n${(claimed ?? []).map((x) => `${x.value}=${x.verdict}`).join(",")}`,
    }),
  });
  if (!r.ok) {
    d.ustoz = sd(r);
    return null;
  }
  const childNumbers = childInput.match(/\d+(?:[.,]\d+)?(?:\/\d+)?/g) ?? [];
  const { result: post, from } = postUstoz(r.value, {
    answer: c.task.answer, numbersShown: c.task.numbersShown, childNumbers, recent: c.recent,
    operands: operandFractions(c.task.params), childFractions: childNumbers.filter((n) => n.includes("/")),
  });
  d.component = from;
  d.askedType = r.value.component?.type; // тип, который просила модель: запасной компонент сохранит его
  d.ustoz = sd(r, post.ok ? undefined : `post:${post.reason}`);
  if (!post.ok && post.reason === "repeat") return "repeat";
  return post.ok ? post.value : null;
}

/** outputCheck (Haiku) на свободной реплике: нет ответа или нарушение персоны → сбой. */
export async function outputOk(ctx: ActionCtx, d: Diag, c: Turn, reply: string) {
  const r = await callStructured({
    ...llm(), breaker, cache: cacheOf(ctx), step: "outputCheck", model: MODELS.outputCheck,
    schema: OutputCheck, system: OUTPUT_CHECK_PREFIX, tail: outputCheckTail({ reply }),
    timeoutMs: TIMEOUTS_MS.guard, effort: "low", thinkingOff: true,
    cacheKey: cacheKey({ step: "outputCheck", beat: "reply", itemId: c.task.id, lang: c.lang, normInput: reply }),
  });
  const pass = r.ok && r.value.ok && r.value.violatesPersona.length === 0;
  d.outputCheck = sd(r, r.ok && !pass ? `flag:${r.value.ok ? "" : "not_ok"}${r.value.violatesPersona.join("+")}` : undefined);
  return pass;
}

export async function guardStep(ctx: ActionCtx, c: Turn, childInput: string) {
  return await callStructured({
    ...llm(), breaker, cache: cacheOf(ctx), step: "guardIn", model: MODELS.guardIn, schema: GuardResult,
    system: GUARD_PREFIX, tail: guardTail({ lang: c.lang, last6: c.last6, riskCount: c.riskCount, childInput }),
    timeoutMs: TIMEOUTS_MS.guard, effort: "low", thinkingOff: true,
    cacheKey: guardCacheKey({ lang: c.lang, itemId: c.task.id, last6: c.last6, riskCount: c.riskCount, childInput }),
  });
}

/** Selection is deliberately separate from free conversation. Drafts never
 * cause unrestricted generation; no reviewed candidate means a code-written reply (lib/socratic/fallback.ts):
 * the child is never left without Ustoz. `ask` = free question: code text only, no catalog selection. */
async function socraticReply(ctx: ActionCtx, d: Diag, studentId: Id<"students">, expectedTurnNo: number, ask = false) {
  const latest: Turn | null = await ctx.runQuery(internal.conductor.turnContext, { studentId });
  if (!latest?.socratic || latest.turnNo !== expectedTurnNo) return { status: "fallback" as const };
  const c = latest;
  const context: HintContext = {
    lang: c.lang, task: publicTask(c.task), escalationLevel: c.socratic!.escalationLevel,
    misconceptionTag: c.socratic!.misconceptionTag, interestTheme: c.socratic!.interestTheme,
  };
  let rendered: ReturnType<typeof renderHint> = null;
  if (!ask && approvedHints(context).length) {
    const tail = hintSelectionTail(context);
    const selection = await callStructured({
      ...llm(), breaker, cache: cacheOf(ctx), step: "socraticHint", model: MODELS.ustozTurn,
      schema: HintSelection, system: HINT_SELECTOR_PREFIX, tail,
      timeoutMs: TIMEOUTS_MS.ustoz, effort: "low", thinkingOff: true,
      cacheKey: cacheKey({ step: "socraticHint", beat: HINT_CATALOG_VERSION, itemId: c.task.id, lang: c.lang, normInput: tail }),
    });
    d.ustoz = sd(selection);
    if (selection.ok) rendered = renderHint(selection.value.templateId, context);
  }
  if (rendered && context.escalationLevel === 3 && !safeAnalogy(rendered.visualOperands, c.task.answer)) rendered = null;
  if (rendered) {
    // Even reviewed copy is checked after code interpolation. The private
    // answer is used only by server checks, never by the selector prompt.
    const checked = postUstoz({
      reply: rendered.reply, component: rendered.component, intent: "hint",
      hintLevel: c.socratic!.escalationLevel - 1, revealsAnswer: false,
    }, {
      answer: c.task.answer, numbersShown: rendered.numbersShown, childNumbers: [], recent: c.recent,
      operands: rendered.visualOperands, childFractions: [],
    });
    if (checked.result.ok && await outputOk(ctx, d, c, checked.result.value.reply)) {
      const written = await ctx.runMutation(internal.conductor.recordReply, {
        studentId, turnNo: expectedTurnNo, reply: checked.result.value.reply,
        component: checked.result.value.component && toStored(checked.result.value.component), hintButton: true,
      });
      return { status: written ? "replied" as const : "fallback" as const };
    }
  }
  d.component = "code";
  // Fixed code text, same server checks as a catalog hint (answer leak, numbers). The repeat guard is off:
  // at the top of the ladder the same step may legitimately be shown again. outputCheck is for free LLM text only.
  const text = (ask ? fallbackAsk : fallbackHint)(c.lang, c.task.topic, context.escalationLevel);
  const code = postUstoz({ reply: text, component: null, intent: "hint", hintLevel: context.escalationLevel - 1, revealsAnswer: false }, {
    answer: c.task.answer, numbersShown: c.task.numbersShown, childNumbers: [], recent: [], operands: [], childFractions: [],
  });
  const written = await ctx.runMutation(internal.conductor.recordReply, {
    studentId, turnNo: expectedTurnNo, reply: code.result.ok ? code.result.value.reply : null, hintButton: true, component: null,
  });
  return { status: written && code.result.ok ? "replied" as const : "fallback" as const };
}

// Категории guard, при которых Ustoz отвечает В РОЛИ (отказ по-доброму): реплика всё равно идёт через postChecks и outputCheck.
// JAILBREAK сюда не входит: реплика сгенерирована из состязательного ввода, а outputCheck проверяет только персону —
// идём в запасной путь (компонент + лесенка кода); riskCount при этом растёт (flagRisk ниже).
const IN_CHARACTER = new Set(["SAFE", "ANSWER_EXTRACTION"]);

type Status = "crisis" | "replied" | "fallback" | "rejected";

export const turn = action({
  args: {
    ...whoArgs,
    input: v.object({
      type: v.union(v.literal("answer"), v.literal("text"), v.literal("hint")), value: v.string(),
      taskInstanceId: v.optional(v.id("taskProgress")), requestId: v.optional(v.string()),
    }),
  },
  returns: v.object({
    status: v.union(v.literal("crisis"), v.literal("replied"), v.literal("fallback"), v.literal("rejected")),
    diag: v.optional(v.any()), // только тайминги, причины и токены — без текста ребёнка
  }),
  handler: async (ctx, { input, ...who }): Promise<{ status: Status; diag?: Diag }> => {
    const studentId: Id<"students"> | null = await ctx.runQuery(internal.session.resolve, who);
    if (!studentId) return { status: "rejected" };
    const t0 = Date.now();
    const d: Diag = { totalMs: 0 };
    const done = <R extends { status: Status }>(r: R) => ({ ...r, diag: { ...d, totalMs: Date.now() - t0 } });
    const c: Turn | null = await ctx.runQuery(internal.conductor.turnContext, { studentId });
    if (!c) return { status: "rejected" };

    const submitHelp = async (): Promise<{ status: Status }> => {
      if (!input.taskInstanceId || !input.requestId) return { status: "rejected" };
      const result = await ctx.runMutation(internal.conductor.submitAttempt, {
        studentId, taskInstanceId: input.taskInstanceId, requestId: input.requestId, kind: "hint", value: "",
      });
      if (result.stale) return { status: "rejected" };
      if (result.duplicate) return { status: "fallback" };
      d.path = "socratic_hint";
      return done(await socraticReply(ctx, d, studentId, result.turnNo));
    };

    // Подсказка: лесенку и компонент ведёт код, текст ребёнка не участвует.
    if (input.type === "hint") {
      if (c.socratic || input.taskInstanceId) return submitHelp();
      await ctx.runMutation(internal.conductor.pressHint, { studentId });
      return { status: "fallback" };
    }

    // 1. preGuard (код): маска ПДн, нормализация, триггеры. Дальше везде — только pg.text.
    const pg = preGuard(input.value, c.lang);
    if (pg.crisis) {
      await ctx.runMutation(internal.conductor.setCrisis, { studentId, category: pg.crisis.category, also: pg.crisis.also });
      return { status: "crisis" };
    }
    if (c.socratic && isExplicitHelpRequest(pg.text, c.lang)) return submitHelp();

    // Код-вердикт и номер хода. Нераспознанный ответ — это текст ребёнка: идёт тем же путём с guardIn.
    let turnNo: number;
    let verdict = c.lastVerdict;
    let beat = "child_text";
    let hintLevel = c.hintLevel;
    if (input.type === "answer") {
      const tracked = Boolean(c.socratic || input.taskInstanceId);
      if (tracked && (!input.taskInstanceId || !input.requestId)) return { status: "rejected" };
      const r = tracked
        ? await ctx.runMutation(internal.conductor.submitAttempt, {
          studentId, taskInstanceId: input.taskInstanceId!, requestId: input.requestId!, kind: "answer", value: pg.text,
        })
        : await ctx.runMutation(internal.conductor.submitAnswer, { studentId, value: pg.text });
      if ("stale" in r && r.stale) return { status: "rejected" };
      if ("duplicate" in r && r.duplicate) return { status: "fallback" };
      ({ turnNo, verdict, beat, hintLevel } = r);
      if (c.socratic && (verdict === "wrong" || verdict.startsWith("misconception:"))) {
        d.path = "socratic_answer";
        return done(await socraticReply(ctx, d, studentId, turnNo));
      }
    } else {
      const recorded = await ctx.runMutation(internal.conductor.recordText, { studentId, value: pg.text, expectedTurnNo: c.turnNo });
      if (recorded === null) return { status: "rejected" };
      turnNo = recorded;
    }
    const cc: Turn = { ...c, hintLevel };
    // verdict "ok": задача уже сменилась на следующую — кнопки подсказки нет, «следующую задачу» показывает код.
    const solvedNow = input.type === "answer" && verdict === "ok";
    const hintButton = !solvedNow;

    const respond = async (u: Awaited<ReturnType<typeof ustozStep>>): Promise<{ status: Status }> => {
      if (u?.reply && (await outputOk(ctx, d, cc, u.reply))) {
        // после верного ответа задача уже новая: картинки нет; иначе компонент уже нормализован кодом (не null, если есть операнды)
        await ctx.runMutation(internal.conductor.recordReply, {
          studentId, turnNo, reply: u.reply, hintButton, component: solvedNow ? null : u.component && toStored(u.component),
        });
        return { status: "replied" };
      }
      // Запасной путь: компонент по операндам (из кода); после верного ответа компонента нет.
      d.component = "code";
      await ctx.runMutation(internal.conductor.recordReply, {
        studentId, turnNo, reply: null, hintButton,
        component: solvedNow || c.socratic ? null : toStored(normalizeComponent(d.askedType ? { type: d.askedType, fractions: [] } : null, { operands: operandFractions(c.task.params), childFractions: [], answer: c.task.answer }).component),
      });
      return { status: "fallback" };
    };

    const fallback = () => respond(null);
    // Lesson with a ladder: free text / an unparsed answer always gets a fixed code reply (never silence, never generated from the input).
    const socraticAsk = async () => done(await socraticReply(ctx, d, studentId, turnNo, input.type === "text"));

    // The verdict already confirms success. A generic Ustoz confirmation could
    // praise independent work even after the child used scaffolding.
    if (c.socratic && input.type === "answer" && (solvedNow || verdict === "almost")) return done(await fallback());

    // Верный ответ: LLM-guard не нужен (ввод — разобранная дробь), вердикт посчитал код.
    if (input.type === "answer" && verdict !== "unparsed") { d.path = "answer"; return done(await respond(await ustozStep(ctx, d, cc, beat, verdict, pg.text))); }

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
    d.path = "text";
    const [g, u] = await Promise.all([
      guardStep(ctx, cc, pg.text),
      // Tracked tasks grant scaffolding only through submitAttempt. Free text
      // still triggers safety checks and cannot silently count as independent help.
      c.socratic ? null : ustozStep(ctx, d, cc, beat, verdict, pg.text, claimed),
    ]);
    d.guard = sd(g, g.ok && g.value.category !== "SAFE" ? `category:${g.value.category}/${g.value.severity}` : undefined);

    if (!g.ok) {
      // guard недоступен (таймаут / breaker / нет ключа): ничего неохраняемого наружу. Если preGuard гасил
      // мягкий триггер гиперболой — это слепая зона: флаг на ревью.
      if (pg.suppressed) {
        await ctx.runMutation(internal.conductor.flagRisk, { studentId, category: pg.suppressed.category, severity: 1, notifyParent: false });
      }
      return c.socratic ? socraticAsk() : done(await fallback());
    }
    const { category, severity } = g.value;
    if (category !== "SAFE" && severity >= 2 && crisisRouting(category)) {
      await ctx.runMutation(internal.conductor.setCrisis, { studentId, category });
      return done({ status: "crisis" as const });
    }
    if (category !== "SAFE") {
      await ctx.runMutation(internal.conductor.flagRisk, {
        studentId, category, severity, notifyParent: crisisRouting(category)?.notifyParent ?? false,
      });
    }
    if (category === "PII") await ctx.runMutation(internal.conductor.maskChildTurn, { studentId, turnNo });
    if (c.socratic) return socraticAsk();
    return done(IN_CHARACTER.has(category) ? await respond(u) : await fallback());
  },
});
