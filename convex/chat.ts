// Свободный чат с Ustoz и Bobr. Поток: сессия → доступ (лимиты) → preGuard (CRISIS как в turn) → запись сообщения ребёнка →
// guardIn ∥ LLM → zod ChatTurn → postChecks → outputCheck → запись реплики. Action не пишет в БД: только ctx.runMutation.
// Любой сбой → фиксированная реплика из кода (lib/chat/fallback.ts), непроверенный текст LLM наружу не идёт.
// Чат НЕ меняет students.state/currentTask/turnNo/lastReply (кроме CRISIS через общий setCrisis). Текст ребёнка не логируем (ПДн).
import { v } from "convex/values";
import { MODELS, TIMEOUTS_MS } from "../lib/config";
import { chatLine } from "../lib/chat/fallback";
import { addressedToCharacter, isCheating } from "../lib/chat/intent";
import { postChecksChat } from "../lib/chat/postChecks";
import { bumpDay, checkAccess } from "../lib/chat/limits";
import { cacheKey, callStructured, createBreaker } from "../lib/llm";
import { CHAT_BOBR_PREFIX, CHAT_USTOZ_PREFIX, chatTail } from "../lib/llm/prompts/chat";
import { crisisRouting, preGuard } from "../lib/safety";
import { CHAT_PARTNERS, ChatTurn } from "../lib/types";
import type { ChatPartner, ChatTurn as ChatTurnT } from "../lib/types";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, query, type ActionCtx, type QueryCtx } from "./_generated/server";
import { guardStep, llm, cacheOf, outputOk, type Diag, type Turn } from "./turn";
import { childOrNull } from "./session";

// ponytail: свой breaker (turn.ts держит свой): порог 3/30 с считается отдельно для чата.
const breaker = createBreaker();

const who = v.union(v.literal("ustoz"), v.literal("bobr"));
const lang = v.union(v.literal("uz"), v.literal("ru"));
const roleV = v.union(v.literal("child"), v.literal("ustoz"), v.literal("bobr"));
const reasonV = v.union(v.null(), v.literal("night"), v.literal("session_limit"), v.literal("day_limit"), v.literal("crisis_block"));
const accessV = v.object({ open: v.boolean(), reason: reasonV, minutesLeft: v.number() });
type Status = "replied" | "fallback" | "closed" | "crisis" | "rejected";

const sessionOf = (w: ChatPartner, studentId: Id<"students">) => `chat:${w}:${studentId}`;

/** Времена сообщений ребёнка в чате (оба собеседника, лимиты общие), по возрастанию. */
async function childTimes(ctx: { db: QueryCtx["db"] }, studentId: Id<"students">): Promise<number[]> {
  const rows = await Promise.all(CHAT_PARTNERS.map((w) =>
    ctx.db.query("turns").withIndex("by_session_and_ts", (q) => q.eq("sessionId", sessionOf(w, studentId))).order("desc").take(30)));
  return rows.flat().filter((t) => t.role === "child").map((t) => t.ts).sort((a, b) => a - b);
}

const lastOf = (ctx: { db: QueryCtx["db"] }, w: ChatPartner, studentId: Id<"students">, n: number) =>
  ctx.db.query("turns").withIndex("by_session_and_ts", (q) => q.eq("sessionId", sessionOf(w, studentId))).order("desc").take(n);

// ── public query ──

export const view = query({
  args: { token: v.string(), who },
  returns: v.union(v.null(), v.object({
    who,
    messages: v.array(v.object({ id: v.string(), role: roleV, text: v.string(), ts: v.number() })),
    pose: v.union(v.string(), v.null()),
    access: accessV,
  })),
  handler: async (ctx, { token, who: w }) => {
    const s = await childOrNull(ctx, token);
    if (!s) return null;
    const rows = (await lastOf(ctx, w, s._id, 40)).reverse();
    // ponytail: Date.now() в query — доступ пересчитается при следующем изменении данных (как childOrNull).
    const access = checkAccess({ now: Date.now(), blockedUntil: s.chatBlockedUntil, chatDay: s.chatDay, chatMsToday: s.chatMsToday, ts: await childTimes(ctx, s._id) });
    return {
      who: w,
      messages: rows.flatMap((t) => (t.role === "child" || t.role === "ustoz" || t.role === "bobr" ? [{ id: t._id as string, role: t.role, text: t.text, ts: t.ts }] : [])),
      pose: [...rows].reverse().find((t) => t.role === w)?.pose ?? null, access,
    };
  },
});

// ── internal ──

export const context = internalQuery({
  args: { studentId: v.id("students"), who },
  returns: v.union(v.null(), v.object({
    lang, state: v.string(), riskCount: v.number(), access: accessV,
    history: v.array(v.object({ role: roleV, text: v.string() })),
    recent: v.array(v.string()), // последние реплики собеседника (антиповтор), от старых к новым
    task: v.union(v.null(), v.object({ answer: v.string(), numbersShown: v.array(v.string()) })),
  })),
  handler: async (ctx, { studentId, who: w }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s) return null;
    const rows = (await lastOf(ctx, w, studentId, 30)).reverse();
    const history = rows.flatMap((t) => (t.role === "child" || t.role === "ustoz" || t.role === "bobr" ? [{ role: t.role, text: t.text }] : []));
    return {
      lang: s.lang, state: s.state, riskCount: s.riskCount,
      access: checkAccess({ now: Date.now(), blockedUntil: s.chatBlockedUntil, chatDay: s.chatDay, chatMsToday: s.chatMsToday, ts: await childTimes(ctx, studentId) }),
      history: history.slice(-6), recent: history.filter((h) => h.role === w).map((h) => h.text),
      task: s.currentTask ? { answer: s.currentTask.answer, numbersShown: s.currentTask.numbersShown } : null,
    };
  },
});

/** Сообщение ребёнка (уже после preGuard). Лимиты проверяются заново внутри транзакции: гонка двух send не обходит их. */
export const writeChild = internalMutation({
  args: { studentId: v.id("students"), who, text: v.string() },
  returns: v.union(v.object({ ok: v.literal(true) }), v.object({ ok: v.literal(false) })),
  handler: async (ctx, { studentId, who: w, text }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s) return { ok: false as const };
    const now = Date.now();
    const ts = await childTimes(ctx, studentId);
    if (!checkAccess({ now, blockedUntil: s.chatBlockedUntil, chatDay: s.chatDay, chatMsToday: s.chatMsToday, ts }).open) return { ok: false as const };
    await ctx.db.patch("students", studentId, bumpDay(s, ts.length ? ts[ts.length - 1] : null, now));
    await ctx.db.insert("turns", { studentId, sessionId: sessionOf(w, studentId), role: "child", kind: "text", text, state: s.state, ts: now });
    return { ok: true as const };
  },
});

/** Реплика собеседника (проверенная или фиксированная из кода). */
export const writeReply = internalMutation({
  args: { studentId: v.id("students"), who, text: v.string(), pose: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { studentId, who: w, text, pose }) => {
    const s = await ctx.db.get("students", studentId);
    if (s) await ctx.db.insert("turns", { studentId, sessionId: sessionOf(w, studentId), role: w, kind: "reply", text, pose, state: s.state, ts: Date.now() });
    return null;
  },
});

type Ctx = {
  lang: "uz" | "ru"; state: string; riskCount: number; access: { open: boolean };
  history: { role: "child" | "ustoz" | "bobr"; text: string }[]; recent: string[]; task: { answer: string; numbersShown: string[] } | null;
};

/** LLM → zod → postChecks. repeat → одна перегенерация (спека). null = любой сбой. */
async function chatStep(actx: ActionCtx, w: ChatPartner, c: Ctx, childInput: string, why: { v?: string }): Promise<ChatTurnT | null> {
  const childNumbers = childInput.match(/\d+(?:[.,]\d+)?(?:\/\d+)?/g) ?? [];
  const once = async (): Promise<ChatTurnT | null | "repeat"> => {
    const r = await callStructured({
      ...llm(), breaker, cache: cacheOf(actx), step: "chatTurn", schema: ChatTurn,
      model: w === "bobr" ? MODELS.bobrChat : MODELS.ustozTurn,
      system: w === "bobr" ? CHAT_BOBR_PREFIX : CHAT_USTOZ_PREFIX,
      tail: chatTail({ lang: c.lang, history: c.history, forbiddenLines: c.recent.slice(-20), childInput }),
      timeoutMs: w === "bobr" ? TIMEOUTS_MS.bobr : TIMEOUTS_MS.ustoz, effort: "low", thinkingOff: true,
      // ключ: собеседник, язык, маскированный ввод и последние реплики (от них зависит ответ); сырой текст не нужен
      cacheKey: cacheKey({ step: "chatTurn", beat: w, itemId: "chat", lang: c.lang, normInput: `${childInput}\n${c.history.map((h) => h.text).join("\n")}` }),
    });
    if (!r.ok) return (why.v = `llm:${r.reason}`), null;
    const post = postChecksChat(r.value, { lang: c.lang, task: c.task, childNumbers, recent: c.recent });
    if (!post.ok) why.v = `post:${post.reason}`;
    return post.ok ? post.value : post.reason === "repeat" || post.reason === "lang" ? "repeat" : null;
  };
  const first = await once();
  if (first !== "repeat") return first;
  const again = await once();
  return again === "repeat" ? null : again;
}

// ── public action ──

export const send = action({
  args: { token: v.string(), who, text: v.string() },
    // diag — только причины сбоев без текста (как в turn); контракт status не меняет
  returns: v.object({
    status: v.union(v.literal("replied"), v.literal("fallback"), v.literal("closed"), v.literal("crisis"), v.literal("rejected")),
    diag: v.optional(v.string()),
  }),
  handler: async (ctx, { token, who: w, text }): Promise<{ status: Status; diag?: string }> => {
    const studentId: Id<"students"> | null = await ctx.runQuery(internal.session.resolve, { token });
    if (!studentId) return { status: "rejected" };
    const c: Ctx | null = await ctx.runQuery(internal.chat.context, { studentId, who: w });
    if (!c) return { status: "rejected" };
    if (!c.access.open) return { status: "closed" };

    // preGuard (код): маска ПДн, нормализация, триггеры → тот же путь CRISIS, что в turn.
    const pg = preGuard(text, c.lang);
    if (pg.crisis) {
      await ctx.runMutation(internal.conductor.setCrisis, { studentId, category: pg.crisis.category, also: pg.crisis.also });
      return { status: "crisis" };
    }
    if (!pg.text.trim()) return { status: "rejected" };
    const written: { ok: boolean } = await ctx.runMutation(internal.chat.writeChild, { studentId, who: w, text: pg.text });
    if (!written.ok) return { status: "closed" };

    const reply = async (line: string, status: Status, pose?: string): Promise<{ status: Status }> => {
      await ctx.runMutation(internal.chat.writeReply, { studentId, who: w, text: line, pose });
      return { status };
    };
    const why: { v?: string } = {};
    const fallback = async (kind: "fallback" | "redirect" | "support" | "cheat" = "fallback") => ({ ...(await reply(chatLine(w, c.lang, kind, Date.now()), "fallback")), diag: why.v });

    // guardIn ∥ LLM. Реплика живёт, только если guard SAFE; ANSWER_EXTRACTION — фиксированный отказ в образе.
    const gc = { lang: c.lang, task: { id: `chat:${w}` }, hintLevel: 0, lastVerdict: "", riskCount: c.riskCount, recent: c.recent, last6: c.history.filter((h) => h.role === "child").map((h) => h.text) } as unknown as Turn;
    const [g, u] = await Promise.all([guardStep(ctx, gc, pg.text), chatStep(ctx, w, c, pg.text, why)]);
    if (!g.ok) {
      why.v = `guard:${g.reason}`;
      if (pg.suppressed) await ctx.runMutation(internal.conductor.flagRisk, { studentId, category: pg.suppressed.category, severity: 1, notifyParent: false });
      return await fallback();
    }
    const { category, severity } = g.value;
    // Просьба к самому персонажу («дай свой телефон») не рассказ о реальном человеке: фиксированная реплика в образе, без CRISIS.
    // Сюда попадаем только если preGuard ничего не нашёл; любое третье лицо в тексте или истории оставляет CRISIS как раньше.
    if ((category === "GROOMING" || category === "PII") && !pg.suppressed && addressedToCharacter(pg.text, c.lang, c.history.filter((h) => h.role === "child").map((h) => h.text))) {
      await ctx.runMutation(internal.conductor.flagRisk, { studentId, category, severity, notifyParent: false });
      why.v = "guard:directed";
      return { ...(await reply(chatLine(w, c.lang, "safety", Date.now()), "fallback")), diag: why.v };
    }
    if (category !== "SAFE" && severity >= 2 && crisisRouting(category)) {
      await ctx.runMutation(internal.conductor.setCrisis, { studentId, category });
      return { status: "crisis" };
    }
    if (category !== "SAFE") {
      await ctx.runMutation(internal.conductor.flagRisk, { studentId, category, severity, notifyParent: crisisRouting(category)?.notifyParent ?? false });
    }
    why.v ??= category === "SAFE" ? undefined : `guard:${category}`;
    if (category === "ANSWER_EXTRACTION") return await reply(chatLine(w, c.lang, isCheating(pg.text, c.lang) ? "cheat" : "refusal", Date.now()), "replied");
    // Тяжёлые темы ниже кризиса: тёплая фиксированная реплика «поговори со взрослым», не «в голове каша».
    if (category === "BULLYING" || category === "DEPENDENCY" || category === "VIOLENCE") return await fallback("support");
    // Guard писался для урока и на «не про дроби» срабатывает как OFF_TOPIC_UNSAFE (live 18.11: собаки, футбол — темы allowlist).
    // sev 1 — обычный уход в сторону: реплику ведёт персона по правилам тем, её всё равно проверит outputCheck.
    // sev ≥ 2 (политика, взрослое, азарт) — мягкий возврат в тему фиксированной строкой из кода.
    const offList = category === "OFF_TOPIC_UNSAFE";
    if (offList && severity >= 2) return await fallback("redirect");
    if ((category !== "SAFE" && !offList) || !u) return await fallback();
    const d: Diag = { totalMs: 0 };
    if (!(await outputOk(ctx, d, gc, u.reply))) return (why.v = `outputCheck:${d.outputCheck?.why ?? d.outputCheck?.ok}`), await fallback();
    return await reply(u.reply, "replied", u.pose);
  },
});
