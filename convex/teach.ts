// Сцена «Научи Bobr» (SPEC_BOBR §3–4). Поток: preGuard → copyCheck ∥ guardIn ∥ судья → вердикт КОДА (applyVerdict) →
// реплика Bobr (LLM) → zod → postChecks → outputCheck → recordBobrLine. Action не пишет в БД: только ctx.runMutation.
// Текст ребёнка не логируем (ПДн).
import { v } from "convex/values";
import { MODELS, resolveDemoMode, TIMEOUTS_MS } from "../lib/config";
import { BEAT_POSE, stepScene, WAITING_STATES, type Beat, type BobrPose } from "../lib/bobr/scene";
import { entryAttempt, solvedAttempt, wrongRuleAttempt } from "../lib/bobr/attempts";
import { deferredPut } from "../lib/bobr/deferredCache";
import { postChecksBobr } from "../lib/bobr/postChecks";
import { checklistFor } from "../lib/judge/checklists";
import { decideJudge, judgeUnavailable, type JudgeDecision } from "../lib/judge/verdict";
import {
  cacheKey, callStructured, createBreaker, createClient, GUARD_PREFIX, guardCacheKey, guardTail, normalizeComponent,
  OUTPUT_CHECK_PREFIX, outputCheckTail, toStored, type LlmCache, type LlmClient,
} from "../lib/llm";
import { BOBR_PREFIX, bobrTail } from "../lib/llm/prompts/bobr";
import { JUDGE_PREFIX, judgeTail } from "../lib/llm/prompts/judge";
import { houseState } from "../lib/houses";
import { copyCheck, crisisRouting, preGuard } from "../lib/safety";
import { BobrTurn, GuardResult, Judge, OutputCheck, TOPIC_IDS, type TopicId } from "../lib/types";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, type ActionCtx, type MutationCtx, type QueryCtx } from "./_generated/server";
import { operandFractions } from "./lessonView";
import { whoArgs } from "./session";
import { enqueueTaughtBobr } from "./outbox";

// ── тонкая копия из turn.ts ──
// TODO(core): общий модуль, заявка в SCHEMA_REQUESTS (llm(), cacheOf, guard и outputCheck не экспортированы из turn.ts)
const breaker = createBreaker();
// eslint-disable-next-line @convex-dev/no-process-env -- ключ задан владельцем в env деплоя (BLOCKERS B8)
const env = (k: string) => process.env[k];
let cached: { key: string; client: LlmClient } | null = null;
function llm(): { mode: "live" | "replay"; client: LlmClient } {
  const key = env("ANTHROPIC_API_KEY");
  const mode = resolveDemoMode(env("DEMO_MODE"), !!key);
  if (mode === "replay" || !key) return { mode: "replay", client: { messages: { parse: () => Promise.reject(new Error("replay: no network")) } } };
  if (cached?.key !== key) cached = { key, client: createClient(key) };
  return { mode, client: cached.client };
}
const cacheOf = (ctx: ActionCtx): LlmCache => ({
  get: (key) => ctx.runQuery(internal.llmCache.get, { key }),
  put: async (key, step, response) => {
    await ctx.runMutation(internal.llmCache.put, { key, step, response });
  },
});

const lang = v.union(v.literal("uz"), v.literal("ru"));
const beatV = v.union(v.literal("entry"), v.literal("question"), v.literal("wrong_rule"), v.literal("solved"), v.literal("give_up"));
const levelV = v.union(v.literal("gap"), v.literal("solved_self"), v.literal("taught_bobr"));
const attemptV = v.object({
  task: v.object({
    id: v.string(), topic: v.string(), kind: v.string(), params: v.record(v.string(), v.string()),
    answer: v.string(), numbersShown: v.array(v.string()),
  }),
  attempt: v.string(),
  expression: v.string(),
  misconception: v.union(v.string(), v.null()),
});
const publicTaskV = v.object({ kind: v.string(), params: v.record(v.string(), v.string()), numbersShown: v.array(v.string()) });
const demoV = v.object({
  type: v.union(v.literal("pie"), v.literal("strip"), v.literal("line")),
  params: v.array(v.object({ key: v.string(), value: v.string() })),
});
const statusV = v.union(
  v.literal("replied"), v.literal("copied"), v.literal("retry"), v.literal("crisis"), v.literal("rejected"), v.literal("stale"),
);
const replyV = v.object({
  status: statusV,
  state: v.union(v.string(), v.null()),
  beat: v.union(beatV, v.null()),
  reply: v.union(v.string(), v.null()),
  lineKey: v.union(v.string(), v.null()),
  pose: v.union(v.string(), v.null()),
  attempt: v.union(v.string(), v.null()),
  expression: v.union(v.string(), v.null()),
  task: v.union(publicTaskV, v.null()),
  rounds: v.union(v.number(), v.null()),
  bobrLevel: v.union(v.number(), v.null()),
  demo: v.union(demoV, v.null()),
  diag: v.optional(v.any()), // только причины и тайминги, без текста ребёнка
});

type Att = {
  task: { id: string; topic: string; kind: string; params: Record<string, string>; answer: string; numbersShown: string[] };
  attempt: string;
  expression: string;
  misconception: string | null;
};
type Status = "replied" | "copied" | "retry" | "crisis" | "rejected" | "stale";
type Outcome = "pass" | "partial" | "fail" | "copy" | "retry" | "unavailable";
// Диагностика хода без текста: что сломалось и сколько заняло.
type StepDiag = { ok: boolean; why?: string; ms?: number };
type Diag = { guard?: StepDiag; judge?: StepDiag; bobr?: StepDiag; outputCheck?: StepDiag };
type Reply = {
  diag?: Diag;
  status: Status; state: string | null; beat: Beat | null; reply: string | null; lineKey: string | null; pose: BobrPose | null;
  attempt: string | null; expression: string | null; task: { kind: string; params: Record<string, string>; numbersShown: string[] } | null;
  rounds: number | null; bobrLevel: number | null; demo: { type: "pie" | "strip" | "line"; params: { key: string; value: string }[] } | null;
};
type SceneCtx = {
  lang: "uz" | "ru"; state: string; currentTopic: string | null; riskCount: number; turnNo: number;
  level: "gap" | "solved_self" | "taught_bobr" | null; rounds: number; bobrLevel: number;
  ustozLines: string[]; bobrLines: string[]; last6: string[];
};
type Applied = { state: string; beat: Beat; rounds: number; level: number; attempt: Att | null };

const NONE = (status: Status): Reply => ({
  status, state: null, beat: null, reply: null, lineKey: null, pose: null, attempt: null, expression: null, task: null,
  rounds: null, bobrLevel: null, demo: null,
});

// Число тем taught_bobr у ученика (тем всего 10, take(20) с запасом).
async function taughtCount(ctx: { db: QueryCtx["db"] }, studentId: Id<"students">) {
  const rows = await ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId)).take(20);
  return rows.filter((r) => r.level === "taught_bobr").length;
}

const topicRow = (ctx: { db: QueryCtx["db"] }, studentId: Id<"students">, topic: string) =>
  ctx.db.query("topicStatus").withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", topic)).unique();

// ── internal: состояние сцены ──

export const context = internalQuery({
  args: { studentId: v.id("students") },
  returns: v.union(v.null(), v.object({
    lang, state: v.string(), currentTopic: v.union(v.string(), v.null()), riskCount: v.number(), turnNo: v.number(),
    level: v.union(levelV, v.null()), rounds: v.number(), bobrLevel: v.number(),
    ustozLines: v.array(v.string()), bobrLines: v.array(v.string()), last6: v.array(v.string()),
  })),
  handler: async (ctx, { studentId }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s) return null;
    const row = s.currentTopic ? await topicRow(ctx, studentId, s.currentTopic) : null;
    const last = await ctx.db.query("turns").withIndex("by_student_and_ts", (q) => q.eq("studentId", studentId)).order("desc").take(100);
    return {
      lang: s.lang, state: s.state, currentTopic: s.currentTopic ?? null, riskCount: s.riskCount, turnNo: s.turnNo ?? 0,
      level: row?.level ?? null, rounds: row?.bobrQuestionRounds ?? 0, bobrLevel: await taughtCount(ctx, studentId),
      // copyCheck берёт хвост массива: от старых к новым
      ustozLines: last.filter((t) => t.role === "ustoz").slice(0, 6).reverse().map((t) => t.text),
      bobrLines: last.filter((t) => t.role === "bobr").slice(0, 30).map((t) => t.text),
      last6: last.filter((t) => t.role === "child").slice(0, 6).reverse().map((t) => t.text),
    };
  },
});

/** Вход в сцену: только из solved_self и не из CRISIS. → номер хода или null. */
export const beginScene = internalMutation({
  args: { studentId: v.id("students"), topic: v.string() },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, { studentId, topic }) => {
    const s = await ctx.db.get("students", studentId);
    const row = await topicRow(ctx, studentId, topic);
    if (!s || s.state === "CRISIS" || row?.level !== "solved_self") return null;
    const turnNo = (s.turnNo ?? 0) + 1;
    await ctx.db.patch("students", studentId, { state: "TEACH_BOBR", currentTopic: topic, turnNo, lastReply: undefined });
    await ctx.db.patch("topicStatus", row._id, { bobrQuestionRounds: 0 });
    return turnNo;
  },
});

/** Объяснение ребёнка (value — после preGuard). → новый номер хода или null. */
export const beginExplain = internalMutation({
  args: { studentId: v.id("students"), topic: v.string(), value: v.string() },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, { studentId, topic, value }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s?.currentTopic || s.currentTopic !== topic || !WAITING_STATES.includes(s.state)) return null; // тема могла смениться между чтением и ходом
    if ((await topicRow(ctx, studentId, s.currentTopic))?.level !== "solved_self") return null;
    const turnNo = (s.turnNo ?? 0) + 1;
    await ctx.db.patch("students", studentId, { state: "JUDGING", turnNo, lastReply: undefined });
    await ctx.db.insert("turns", {
      studentId, sessionId: studentId, role: "child", kind: "text", text: value, turnNo, state: s.state, ts: Date.now(),
    });
    return turnNo;
  },
});

/** После кризиса: JUDGING как «состояние до кризиса» застрял бы навсегда (из него нет выхода) → TEACH_BOBR. Вызывать после setCrisis. */
export const settleCrisisState = internalMutation({
  args: { studentId: v.id("students") },
  returns: v.null(),
  handler: async (ctx, { studentId }) => {
    const s = await ctx.db.get("students", studentId);
    if (s?.state === "CRISIS" && s.stateBeforeCrisis === "JUDGING") await ctx.db.patch("students", studentId, { stateBeforeCrisis: "TEACH_BOBR" });
    return null;
  },
});

/** Вердикт кода → переход сцены. Только при совпавшем turnNo, state JUDGING и solved_self: повтор action ничего не меняет. */
export const applyVerdict = internalMutation({
  args: {
    studentId: v.id("students"), turnNo: v.number(),
    outcome: v.union(v.literal("pass"), v.literal("partial"), v.literal("fail"), v.literal("copy"), v.literal("retry"), v.literal("unavailable")),
  },
  returns: v.union(v.null(), v.object({
    state: v.string(), beat: beatV, rounds: v.number(), level: v.number(), attempt: v.union(attemptV, v.null()),
  })),
  handler: async (ctx, { studentId, turnNo, outcome }): Promise<Applied | null> => {
    const s = await ctx.db.get("students", studentId);
    if (!s?.currentTopic || (s.turnNo ?? 0) !== turnNo || s.state !== "JUDGING") return null;
    const topic = s.currentTopic as TopicId;
    const row = await topicRow(ctx, studentId, topic);
    if (row?.level !== "solved_self") return null;

    if (outcome === "copy" || outcome === "retry") {
      await ctx.db.patch("students", studentId, { state: "TEACH_BOBR" });
      return { state: "TEACH_BOBR", beat: "question", rounds: row.bobrQuestionRounds, level: await taughtCount(ctx, studentId), attempt: entryAttempt(topic) };
    }

    // Судья не ответил: наивный вопрос (спека), но круг не сгорает — ребёнок не виноват в сбое.
    if (outcome === "unavailable") {
      await ctx.db.patch("students", studentId, { state: "BOBR_QUESTION" });
      return { state: "BOBR_QUESTION", beat: "question", rounds: row.bobrQuestionRounds, level: await taughtCount(ctx, studentId), attempt: entryAttempt(topic) };
    }

    const step = stepScene(row.bobrQuestionRounds, outcome);
    const now = Date.now();
    await ctx.db.patch("students", studentId, { state: step.state });
    if (step.taught) {
      // одной транзакцией: статус, дом, пуш родителю
      await ctx.db.patch("topicStatus", row._id, { bobrQuestionRounds: step.rounds, level: "taught_bobr", taughtAt: now });
      const state = houseState({ level: "taught_bobr", taughtAt: now }, now);
      const h = await ctx.db.query("houses").withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", topic)).unique();
      if (h) await ctx.db.patch("houses", h._id, { state });
      else await ctx.db.insert("houses", { studentId, topic, state });
      await enqueueTaughtBobr(ctx, studentId, topic);
    } else {
      await ctx.db.patch("topicStatus", row._id, { bobrQuestionRounds: step.rounds });
    }
    const attempt = step.beat === "solved" ? solvedAttempt(topic, turnNo)
      : step.beat === "wrong_rule" ? wrongRuleAttempt(topic, turnNo) : entryAttempt(topic);
    return { state: step.state, beat: step.beat, rounds: step.rounds, level: await taughtCount(ctx, studentId), attempt };
  },
});

/** Реплика Bobr в историю. Только при совпавшем turnNo, иначе false. */
export const recordBobrLine = internalMutation({
  args: { studentId: v.id("students"), turnNo: v.number(), reply: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { studentId, turnNo, reply }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s || (s.turnNo ?? 0) !== turnNo) return false;
    await ctx.db.insert("turns", {
      studentId, sessionId: studentId, role: "bobr", kind: "reply", text: reply, state: s.state, ts: Date.now(),
    });
    return true;
  },
});

// ── LLM-шаги ──

/** outputCheck (Haiku): нет «я живой», романтики, секретов, ссылок. */
async function outputOk(ctx: ActionCtx, d: Diag, itemId: string, l: "uz" | "ru", reply: string) {
  const r = await callStructured({
    ...llm(), breaker, cache: cacheOf(ctx), step: "outputCheck", model: MODELS.outputCheck,
    schema: OutputCheck, system: OUTPUT_CHECK_PREFIX, tail: outputCheckTail({ reply }),
    timeoutMs: TIMEOUTS_MS.guard, effort: "low", thinkingOff: true,
    cacheKey: cacheKey({ step: "outputCheck", beat: "reply", itemId, lang: l, normInput: reply }),
  });
  const pass = r.ok && r.value.ok && r.value.violatesPersona.length === 0;
  d.outputCheck = { ok: pass, why: r.ok ? (pass ? undefined : "flagged") : r.reason, ms: r.meta.ms };
  return pass;
}

type Line = { reply: string | null; lineKey: string | null; pose: BobrPose } | "stale";

/** Реплика Bobr: LLM → zod → postChecks (repeat → 1 перегенерация) → outputCheck → запись. Сбой → без текста, сцена идёт. */
async function speak(
  ctx: ActionCtx, d: Diag, a: { studentId: Id<"students">; turnNo: number; c: SceneCtx; beat: Beat; att: Att; missing: string | null; childInput: string | null },
): Promise<Line> {
  const { c, beat, att, childInput } = a;
  const childNumbers = (childInput ?? "").match(/\d+(?:[.,]\d+)?(?:\/\d+)?/g) ?? [];
  const once = async () => {
    const r = await callStructured({
      ...llm(), breaker, cache: cacheOf(ctx), step: "bobrTurn", model: MODELS.bobrTurn, schema: BobrTurn, system: BOBR_PREFIX,
      tail: bobrTail({
        lang: c.lang, beat, expression: att.expression, attempt: att.attempt, numbersShown: att.task.numbersShown,
        missingIdea: a.missing, childInput, forbiddenLines: c.bobrLines,
      }),
      timeoutMs: TIMEOUTS_MS.bobr, effort: "low", thinkingOff: true,
      cacheKey: cacheKey({
        step: "bobrTurn", beat, itemId: att.task.id, lang: c.lang, normInput: `${childInput ?? ""}\n${att.attempt}\n${a.missing ?? ""}`,
      }),
    });
    d.bobr = { ok: r.ok, why: r.ok ? undefined : r.reason, ms: r.meta.ms };
    if (!r.ok) return null;
    const post = postChecksBobr(r.value, {
      attempt: att.attempt, expression: att.expression, numbersShown: att.task.numbersShown, childNumbers,
      forbiddenAnswer: beat === "solved" ? null : att.task.answer, recent: c.bobrLines,
    });
    if (!post.ok) d.bobr = { ok: false, why: `post:${post.reason}`, ms: r.meta.ms };
    return post.ok ? post.value : post.reason === "repeat" ? ("repeat" as const) : null;
  };
  let line = await once();
  if (line === "repeat") line = await once();
  if (line === "repeat") return { reply: null, lineKey: `teach.line.${beat}`, pose: BEAT_POSE[beat] };
  if (!line || !(await outputOk(ctx, d, att.task.id, c.lang, line.reply))) return { reply: null, lineKey: null, pose: BEAT_POSE[beat] };
  const ok: boolean = await ctx.runMutation(internal.teach.recordBobrLine, { studentId: a.studentId, turnNo: a.turnNo, reply: line.reply });
  return ok ? { reply: line.reply, lineKey: null, pose: line.pose } : "stale";
}

function respond(status: Status, ap: Applied, att: Att | null, line: { reply: string | null; lineKey: string | null; pose: BobrPose }): Reply {
  return {
    status, state: ap.state, beat: ap.beat, reply: line.reply, lineKey: line.lineKey, pose: line.pose,
    attempt: att?.attempt ?? null, expression: att?.expression ?? null,
    task: att && { kind: att.task.kind, params: att.task.params, numbersShown: att.task.numbersShown }, // без answer и distractors
    rounds: ap.rounds, bobrLevel: ap.level,
    demo: att && ap.beat === "give_up"
      ? toStored(normalizeComponent(null, { operands: operandFractions(att.task.params), childFractions: [], answer: att.task.answer }).component)
      : null,
  };
}

// ── публичные action ──
// Вход как у turn: токен ребёнка; studentId работает только на демо-стенде (session.resolve).

export const start = action({
  args: { ...whoArgs, topic: v.string() },
  returns: replyV,
  handler: async (ctx, { topic, ...who }): Promise<Reply> => {
    const studentId: Id<"students"> | null = await ctx.runQuery(internal.session.resolve, who);
    if (!studentId) return NONE("rejected");
    const att = (TOPIC_IDS as readonly string[]).includes(topic) && checklistFor(topic as TopicId) ? entryAttempt(topic as TopicId) : null;
    const c: SceneCtx | null = att ? await ctx.runQuery(internal.teach.context, { studentId }) : null;
    if (!att || !c) return NONE("rejected");
    const turnNo: number | null = await ctx.runMutation(internal.teach.beginScene, { studentId, topic });
    if (turnNo === null) return NONE("rejected");
    const d: Diag = {};
    const line = await speak(ctx, d, { studentId, turnNo, c, beat: "entry", att, missing: null, childInput: null });
    if (line === "stale") return NONE("stale");
    return { ...respond("replied", { state: "TEACH_BOBR", beat: "entry", rounds: 0, level: c.bobrLevel, attempt: att }, att, line), diag: d };
  },
});

export const explain = action({
  args: { ...whoArgs, value: v.string() },
  returns: replyV,
  handler: async (ctx, { value, ...who }): Promise<Reply> => {
    const d: Diag = {};
    return { ...(await explainTurn(ctx, d, who, value)), diag: d };
  },
});

async function explainTurn(ctx: ActionCtx, d: Diag, who: { token?: string; studentId?: Id<"students"> }, value: string): Promise<Reply> {
  const studentId: Id<"students"> | null = await ctx.runQuery(internal.session.resolve, who);
  if (!studentId) return NONE("rejected");
  const c: SceneCtx | null = await ctx.runQuery(internal.teach.context, { studentId });
  if (!c) return NONE("rejected");

  // 1. preGuard (код): маска ПДн, нормализация, CRISIS. Кризис важнее состояния сцены: до любых проверок темы.
  const pg = preGuard(value, c.lang);
  if (pg.crisis) {
    await ctx.runMutation(internal.conductor.setCrisis, { studentId, category: pg.crisis.category, also: pg.crisis.also });
    await ctx.runMutation(internal.teach.settleCrisisState, { studentId });
    return NONE("crisis");
  }
  const topic = c.currentTopic as TopicId | null;
  const checklist = topic && (TOPIC_IDS as readonly string[]).includes(topic) ? checklistFor(topic) : null;
  const entry = checklist && topic ? entryAttempt(topic) : null;
  if (!topic || !checklist || !entry || c.level !== "solved_self" || !WAITING_STATES.includes(c.state)) return NONE("rejected");
  if (!pg.text.trim()) return NONE("rejected");

  // 2. ход ребёнка: JUDGING + номер хода
  const turnNo: number | null = await ctx.runMutation(internal.teach.beginExplain, { studentId, topic, value: pg.text });
  if (turnNo === null) return NONE("rejected");

  // 3. copyCheck (код) ∥ guardIn ∥ судья. Судья не нужен, если ребёнок переписал Ustoz.
  const copiedByCode = copyCheck(pg.text, c.ustozLines).copied;
  // Ответ судьи — дословные цитаты ребёнка: в llmCache он попадает только после guard SAFE (flush ниже).
  const judgeCache = deferredPut(cacheOf(ctx));
  let judgeDown = false;
  const judgeStep = async (): Promise<JudgeDecision> => {
    const r = await callStructured({
      ...llm(), breaker, cache: judgeCache.cache, step: "judge", model: MODELS.judge, schema: Judge, system: JUDGE_PREFIX,
      tail: judgeTail({ lang: c.lang, expression: entry.expression, attempt: entry.attempt, checklist, explanation: pg.text }),
      timeoutMs: TIMEOUTS_MS.judge, effort: "medium", maxTokens: 2048,
      cacheKey: cacheKey({ step: "judge", beat: "explain", itemId: entry.task.id, lang: c.lang, normInput: pg.text }),
    });
    // TODO(спека): при partial ещё 2 судьи параллельно
    d.judge = { ok: r.ok, why: r.ok ? undefined : r.reason, ms: r.meta.ms };
    judgeDown = !r.ok;
    return r.ok ? decideJudge(r.value, { checklist, explanation: pg.text }) : judgeUnavailable(checklist);
  };
  const [g, decision] = await Promise.all([
    callStructured({
      ...llm(), breaker, cache: cacheOf(ctx), step: "guardIn", model: MODELS.guardIn, schema: GuardResult, system: GUARD_PREFIX,
      tail: guardTail({ lang: c.lang, last6: c.last6, riskCount: c.riskCount, childInput: pg.text }),
      timeoutMs: TIMEOUTS_MS.guard, effort: "low", thinkingOff: true,
      cacheKey: guardCacheKey({ lang: c.lang, itemId: entry.task.id, last6: c.last6, riskCount: c.riskCount, childInput: pg.text }),
    }),
    copiedByCode ? null : judgeStep(),
  ]);

  // Вердикт кода применяется один раз; null = ход устарел или повтор.
  const apply = async (outcome: Outcome): Promise<Applied | null> =>
    await ctx.runMutation(internal.teach.applyVerdict, { studentId, turnNo, outcome });
  const noText = async (status: "retry" | "copied", outcome: "retry" | "copy"): Promise<Reply> => {
    const ap = await apply(outcome);
    return ap ? respond(status, ap, ap.attempt, { reply: null, lineKey: status === "copied" ? "teach.copyCheck" : "teach.line.question", pose: BEAT_POSE.question }) : NONE("stale");
  };

  // 4. guard, как в turn.ts: наружу и к вердикту идёт только SAFE.
  d.guard = { ok: g.ok, why: g.ok ? (g.value.category === "SAFE" ? undefined : `category:${g.value.category}`) : g.reason, ms: g.meta.ms };
  if (!g.ok) {
    if (pg.suppressed) {
      await ctx.runMutation(internal.conductor.flagRisk, { studentId, category: pg.suppressed.category, severity: 1, notifyParent: false });
    }
    return await noText("retry", "retry");
  }
  const { category, severity } = g.value;
  if (category !== "SAFE" && severity >= 2 && crisisRouting(category)) {
    await ctx.runMutation(internal.conductor.setCrisis, { studentId, category });
    await ctx.runMutation(internal.teach.settleCrisisState, { studentId });
    return NONE("crisis");
  }
  if (category !== "SAFE") {
    await ctx.runMutation(internal.conductor.flagRisk, {
      studentId, category, severity, notifyParent: crisisRouting(category)?.notifyParent ?? false,
    });
    if (category === "PII") await ctx.runMutation(internal.conductor.maskChildTurn, { studentId, turnNo });
    return await noText("retry", "retry");
  }

  await judgeCache.flush();

  // 5. copied — без LLM
  if (copiedByCode || decision?.copied) return await noText("copied", "copy");
  const ap = await apply(judgeDown ? "unavailable" : (decision?.verdict ?? "partial"));
  if (!ap) return NONE("stale");

  // 6. реплика Bobr. Нет попытки (у темы нет генератора) → без текста.
  const att = ap.attempt;
  if (!att) return respond("replied", ap, null, { reply: null, lineKey: `teach.line.${ap.beat}`, pose: BEAT_POSE[ap.beat] });
  const line = await speak(ctx, d, {
    studentId, turnNo, c, beat: ap.beat, att, missing: ap.beat === "question" ? (decision?.missingIdea?.about ?? null) : null, childInput: pg.text,
  });
  return line === "stale" ? NONE("stale") : respond("replied", ap, att, line);
}
