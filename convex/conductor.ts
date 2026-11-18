// Дирижёр урока: mutations, которые решают всё сами (вердикт, серия, уровень темы, дома). LLM сюда не ходит.
// Две мутации на ход (decisions 18.11): submitAnswer пишет вердикт ДО вызова LLM, recordReply — реплику
// второй мутацией со сверкой номера хода. Импорты lib/ — только относительные.
import { v } from "convex/values";
import { CHAT, LESSON } from "../lib/config";
import { checkAnswer, DEMO_PROBES, generateTask, type TaskKind } from "../lib/fractions";
import { houseState } from "../lib/houses";
import { ABUSE_LOOKUP_BOUND, crisisRouting, priorAbuseFrom, parentNotifyDecision } from "../lib/safety/crisis";
import { GUARD_CATEGORIES, type GuardCategory, type TopicId } from "../lib/types";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { operandFractions } from "./lessonView";
import { enqueueCrisis } from "./outbox";

const lang = v.union(v.literal("uz"), v.literal("ru"));
// дублирует Component из lib/types.ts
const component = v.union(v.null(), v.object({
  type: v.union(v.literal("pie"), v.literal("strip"), v.literal("line")),
  params: v.array(v.object({ key: v.string(), value: v.string() })),
}));

const taskV = v.object({
  id: v.string(), topic: v.string(), kind: v.string(), params: v.record(v.string(), v.string()), answer: v.string(),
  distractors: v.array(v.object({ value: v.string(), misconception: v.optional(v.string()) })),
  requireReduced: v.boolean(), numbersShown: v.array(v.string()),
});

// beat для хвоста Ustoz: что реплика должна сделать. Решает код по вердикту.
const BEAT: Record<string, string> = {
  ok: "confirm_and_ask_how", almost: "ask_to_reduce", misconception: "probe_misconception",
  wrong: "nudge_step", unparsed: "clarify_input",
};

/** Демо-урок: задача N9 `1/2 + 1/3` (текстовая), ответ 5/6, дистрактор 2/5 = M9. Из DEMO_PROBES, не выдумана. */
export const startDemoLesson = mutation({
  args: { lang },
  returns: v.id("students"),
  handler: async (ctx, { lang }) => {
    const probe = DEMO_PROBES.find((p) => p.topic === "N9");
    if (!probe) throw new Error("DEMO_PROBES: нет пробы N9");
    const { seed: _seed, ...task } = probe;
    return await ctx.db.insert("students", {
      lang, consent: true, state: "LESSON_SOLVE", currentTopic: "N9", riskCount: 0,
      currentTask: { ...task, id: "demo-N9-word", kind: "word" },
      turnNo: 0, hintLevel: 0,
    });
  },
});

/** Всё, что нужно action'у для хода. Содержит answer — только для сервера, наружу не отдаётся. */
export const turnContext = internalQuery({
  args: { studentId: v.id("students") },
  returns: v.union(v.null(), v.object({
    lang, state: v.string(), task: taskV, hintLevel: v.number(), turnNo: v.number(), lastVerdict: v.string(),
    riskCount: v.number(), recent: v.array(v.string()), last6: v.array(v.string()),
  })),
  handler: async (ctx, { studentId }) => {
    const s = await ctx.db.get("students", studentId);
    // Проба диагностики (mcq) — не задача урока: ход урока по ней дал бы вердикт-подсказку и затёр пробу.
    if (!s || !s.currentTask || s.currentTask.kind === "mcq") return null;
    const last = await ctx.db.query("turns").withIndex("by_student_and_ts", (q) => q.eq("studentId", studentId))
      .order("desc").take(60);
    return {
      lang: s.lang, state: s.state, task: s.currentTask, hintLevel: s.hintLevel ?? 0, turnNo: s.turnNo ?? 0,
      lastVerdict: s.lastVerdict ?? "none", riskCount: s.riskCount,
      recent: last.filter((t) => t.role === "ustoz").slice(0, 30).map((t) => t.text),
      last6: last.filter((t) => t.role === "child").slice(0, 6).reverse().map((t) => t.text),
    };
  },
});

// Виды задач по кругу (спека: 3 вида): word → picture → missing. Сид зависит от номера задачи.
const KINDS = ["word", "picture", "missing"] as const;

/** value — УЖЕ после preGuard (маска ПДн). Дальше — только код. Верный ответ → следующая задача (другой id/вид). */
export const submitAnswer = internalMutation({
  args: { studentId: v.id("students"), value: v.string() },
  returns: v.object({ turnNo: v.number(), verdict: v.string(), beat: v.string(), hintLevel: v.number() }),
  handler: async (ctx, { studentId, value }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s?.currentTask || s.currentTask.kind === "mcq") throw new Error("no current task");
    const task = s.currentTask;
    const r = checkAnswer(value, { ...task, kind: task.kind as TaskKind });
    const verdict = r.status === "misconception" ? `misconception:${r.misconception}` : r.status;
    const now = Date.now();
    const hint = s.hintLevel ?? 0;

    // Лесенка подсказок (код): каждые 2 ошибки на задаче → +1, потолок 4. Модель уровень не двигает.
    const wrongs = (s.wrongOnTask ?? 0) + (r.status === "wrong" || r.status === "misconception" ? 1 : 0);
    let nextHint = r.status !== "almost" && wrongs > (s.wrongOnTask ?? 0) && wrongs % 2 === 0 ? Math.min(4, hint + 1) : hint;

    const row = await ctx.db.query("topicStatus")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", task.topic)).unique();
    // Серия по РАЗНЫМ задачам (после верного — новая): верный ВВОДОМ без подсказок +1; другой разбор (кроме
    // нераспознанного ввода) обнуляет.
    let streak = row?.streak ?? 0;
    if (r.status === "ok" && hint === 0) streak++;
    else if (r.status !== "unparsed") streak = 0;
    let level = row?.level ?? "gap"; // тема, по которой идёт урок, до серии — gap (дом «леса»)
    let solvedSelfAt = row?.solvedSelfAt;
    if (level === "gap" && streak >= LESSON.solvedSelfStreak) {
      level = "solved_self";
      solvedSelfAt = now;
    }
    let served = row?.tasksThisSession ?? 1; // выданных задач темы за сессию (текущая уже посчитана)
    const patch: Record<string, unknown> = {};
    if (r.status === "ok") {
      if (served >= LESSON.maxTasksPerTopicPerSession) {
        patch.state = "TOPIC_DONE";
      } else {
        served++;
        const fresh = generateTask(task.topic as TopicId, KINDS[(served - 1) % KINDS.length], 100 + served);
        const { seed: _seed, ...rest } = fresh;
        patch.currentTask = rest;
        nextHint = 0;
        patch.wrongOnTask = 0;
      }
    } else patch.wrongOnTask = wrongs;
    if (row) await ctx.db.patch("topicStatus", row._id, { streak, level, tasksThisSession: served, solvedSelfAt });
    else await ctx.db.insert("topicStatus", {
      studentId, topic: task.topic, level, streak, tasksThisSession: served, bobrQuestionRounds: 0, solvedSelfAt,
    });

    const house = houseState({ level, taughtAt: row?.taughtAt }, now);
    const h = await ctx.db.query("houses")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", task.topic)).unique();
    if (h) await ctx.db.patch("houses", h._id, { state: house });
    else await ctx.db.insert("houses", { studentId, topic: task.topic, state: house });

    const turnNo = (s.turnNo ?? 0) + 1;
    await ctx.db.patch("students", studentId, { ...patch, turnNo, lastVerdict: verdict, hintLevel: nextHint, lastReply: undefined });
    await ctx.db.insert("turns", {
      studentId, sessionId: studentId, role: "child", kind: "answer", text: value, turnNo, state: s.state, ts: now,
    });
    return { turnNo, verdict, beat: BEAT[r.status] ?? "nudge_step", hintLevel: nextHint };
  },
});

/** Кнопка «подсказка»: код двигает лесенку (+1, потолок 4) и показывает компонент по операндам. LLM не нужен. */
export const pressHint = internalMutation({
  args: { studentId: v.id("students") },
  returns: v.number(),
  handler: async (ctx, { studentId }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s?.currentTask || s.currentTask.kind === "mcq") throw new Error("no current task");
    const hintLevel = Math.min(4, (s.hintLevel ?? 0) + 1);
    const turnNo = (s.turnNo ?? 0) + 1;
    const params = operandFractions(s.currentTask.params).map((value, i) => ({ key: `f${i + 1}`, value }));
    await ctx.db.patch("students", studentId, {
      turnNo, hintLevel,
      lastReply: { turnNo, reply: null, component: params.length ? { type: "pie", params } : null, hintButton: hintLevel < 4 },
    });
    return hintLevel;
  },
});

/** Флаг риска от guard: reviewQueue + riskCount. Текста ребёнка не пишем. */
export const flagRisk = internalMutation({
  args: { studentId: v.id("students"), category: v.string(), severity: v.number(), notifyParent: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { studentId, category, severity, notifyParent }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s) return null;
    const cat = (GUARD_CATEGORIES as readonly string[]).includes(category) ? (category as GuardCategory) : "OFF_TOPIC_UNSAFE";
    await ctx.db.patch("students", studentId, { riskCount: s.riskCount + 1 });
    // «Скажи ответ» и попытки взлома — частые и не про безопасность ребёнка: только счётчик риска,
    // без строки на ревью (иначе очередь тонет в шуме и пропускает настоящие флаги).
    if (cat === "ANSWER_EXTRACTION" || cat === "JAILBREAK") return null;
    await ctx.db.insert("reviewQueue", { studentId, category: cat, severity: Math.max(1, Math.min(4, Math.round(severity))), status: "open", notifyParent });
    return null;
  },
});

/** guard сказал PII: в БД остаётся маска, чтобы значение не попало в последующие last6. */
export const maskChildTurn = internalMutation({
  args: { studentId: v.id("students"), turnNo: v.number() },
  returns: v.null(),
  handler: async (ctx, { studentId, turnNo }) => {
    const rows = await ctx.db.query("turns").withIndex("by_student_and_ts", (q) => q.eq("studentId", studentId)).order("desc").take(10);
    const t = rows.find((r) => r.role === "child" && r.turnNo === turnNo);
    if (t) await ctx.db.patch("turns", t._id, { text: "[PII]" });
    return null;
  },
});

/** Выход из CRISIS-оверлея: урок продолжается с сохранённого стейта; болталка остаётся закрытой (chatBlockedUntil). */
export const leaveCrisis = mutation({
  args: { studentId: v.id("students") },
  returns: v.null(),
  handler: async (ctx, { studentId }) => {
    const s = await ctx.db.get("students", studentId);
    if (s?.state !== "CRISIS") return null;
    await ctx.db.patch("students", studentId, { state: s.stateBeforeCrisis ?? "LESSON_SOLVE", stateBeforeCrisis: undefined });
    return null;
  },
});

/** Текстовый ход: вердикт не меняется, номер хода растёт (старая реплика не перезапишет новую). */
export const recordText = internalMutation({
  args: { studentId: v.id("students"), value: v.string() },
  returns: v.number(),
  handler: async (ctx, { studentId, value }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s) throw new Error("no student");
    const turnNo = (s.turnNo ?? 0) + 1;
    await ctx.db.patch("students", studentId, { turnNo, lastReply: undefined });
    await ctx.db.insert("turns", {
      studentId, sessionId: studentId, role: "child", kind: "text", text: value, turnNo, state: s.state, ts: Date.now(),
    });
    return turnNo;
  },
});

/** Реплика Ustoz. Пишет, только если turnNo ещё текущий; иначе → false (устаревший ответ отброшен). */
export const recordReply = internalMutation({
  args: {
    studentId: v.id("students"), turnNo: v.number(), reply: v.union(v.string(), v.null()), component,
    hintButton: v.boolean(),
  },
  returns: v.boolean(),
  handler: async (ctx, { studentId, turnNo, reply, component, hintButton }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s || (s.turnNo ?? 0) !== turnNo) return false;
    // hintLevel от модели игнорируется: лесенку ведёт только код (submitAnswer / useHint)
    await ctx.db.patch("students", studentId, { lastReply: { turnNo, reply, component, hintButton } });
    if (reply !== null) {
      await ctx.db.insert("turns", {
        studentId, sessionId: studentId, role: "ustoz", kind: "reply", text: reply, state: s.state, ts: Date.now(),
      });
    }
    return true;
  },
});

/** CRISIS — оверлей: стейт урока сохранён, болталка закрыта на 24 ч, флаг в reviewQueue. Цитат нет. */
export const setCrisis = internalMutation({
  // also — другие категории того же сообщения (preGuard). ABUSE_HOME среди них или в истории → родителю ничего.
  args: { studentId: v.id("students"), category: v.string(), also: v.optional(v.array(v.string())) },
  returns: v.null(),
  handler: async (ctx, { studentId, category, also }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s) return null;
    const valid = (c: string) => (GUARD_CATEGORIES as readonly string[]).includes(c);
    const cat = valid(category) ? (category as GuardCategory) : "SELF_HARM";
    const cats = [...new Set([cat, ...(also ?? []).filter(valid)])] as GuardCategory[];
    const now = Date.now();
    // История читается ДО вставки строк этого кризиса.
    const past = await ctx.db.query("reviewQueue").withIndex("by_student_and_category", (q) => q.eq("studentId", studentId).eq("category", "ABUSE_HOME"))
      .order("desc").take(ABUSE_LOOKUP_BOUND);
    const priorAbuse = priorAbuseFrom(past, now);
    const notify = parentNotifyDecision({ categories: cats, priorAbuse }).notify;
    await ctx.db.patch("students", studentId, {
      state: "CRISIS",
      stateBeforeCrisis: s.state === "CRISIS" ? s.stateBeforeCrisis : s.state,
      chatBlockedUntil: now + CHAT.crisisBlockHours * 3_600_000,
      riskCount: s.riskCount + 1,
    });
    // Каждая категория — своя строка на ревью; notifyParent — решение кода (ABUSE_HOME рядом → false у всех).
    for (const c of cats) {
      const route = crisisRouting(c);
      await ctx.db.insert("reviewQueue", {
        studentId, category: c, severity: route?.urgent ? 4 : 3, status: "open", notifyParent: notify && (route?.notifyParent ?? false),
      });
    }
    await enqueueCrisis(ctx, studentId, cats, priorAbuse); // родителю без цитат
    return null;
  },
});
