// Дирижёр урока: mutations, которые решают всё сами (вердикт, серия, уровень темы, дома). LLM сюда не ходит.
// Две мутации на ход (decisions 18.11): submitAnswer пишет вердикт ДО вызова LLM, recordReply — реплику
// второй мутацией со сверкой номера хода. Импорты lib/ — только относительные.
import { v } from "convex/values";
import { CHAT, LESSON } from "../lib/config";
import { checkAnswer, DEMO_PROBES, type TaskKind } from "../lib/fractions";
import { houseState } from "../lib/houses";
import { crisisRouting } from "../lib/safety/crisis";
import { GUARD_CATEGORIES, type GuardCategory } from "../lib/types";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

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
    if (!s || !s.currentTask) return null;
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

/** value — УЖЕ после preGuard (маска ПДн). Дальше — только код. */
export const submitAnswer = internalMutation({
  args: { studentId: v.id("students"), value: v.string() },
  returns: v.object({ turnNo: v.number(), verdict: v.string(), beat: v.string() }),
  handler: async (ctx, { studentId, value }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s?.currentTask) throw new Error("no current task");
    const task = s.currentTask;
    const r = checkAnswer(value, { ...task, kind: task.kind as TaskKind });
    const verdict = r.status === "misconception" ? `misconception:${r.misconception}` : r.status;
    const now = Date.now();
    const hint = s.hintLevel ?? 0;

    const row = await ctx.db.query("topicStatus")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", task.topic)).unique();
    // Серия: верный ВВОДОМ без подсказок +1; любой другой разбор (кроме нераспознанного ввода) обнуляет.
    let streak = row?.streak ?? 0;
    if (r.status === "ok" && hint === 0) streak++;
    else if (r.status !== "unparsed") streak = 0;
    let level = row?.level ?? "gap"; // тема, по которой идёт урок, до серии — gap (дом «леса»)
    let solvedSelfAt = row?.solvedSelfAt;
    if (level === "gap" && streak >= LESSON.solvedSelfStreak) {
      level = "solved_self";
      solvedSelfAt = now;
    }
    const tasks = (row?.tasksThisSession ?? 0) + 1;
    if (row) await ctx.db.patch("topicStatus", row._id, { streak, level, tasksThisSession: tasks, solvedSelfAt });
    else await ctx.db.insert("topicStatus", {
      studentId, topic: task.topic, level, streak, tasksThisSession: tasks, bobrQuestionRounds: 0, solvedSelfAt,
    });

    const house = houseState({ level, taughtAt: row?.taughtAt }, now);
    const h = await ctx.db.query("houses")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", task.topic)).unique();
    if (h) await ctx.db.patch("houses", h._id, { state: house });
    else await ctx.db.insert("houses", { studentId, topic: task.topic, state: house });

    const turnNo = (s.turnNo ?? 0) + 1;
    await ctx.db.patch("students", studentId, { turnNo, lastVerdict: verdict, lastReply: undefined });
    await ctx.db.insert("turns", {
      studentId, sessionId: studentId, role: "child", kind: "answer", text: value, state: s.state, ts: now,
    });
    return { turnNo, verdict, beat: BEAT[r.status] ?? "nudge_step" };
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
      studentId, sessionId: studentId, role: "child", kind: "text", text: value, state: s.state, ts: Date.now(),
    });
    return turnNo;
  },
});

/** Реплика Ustoz. Пишет, только если turnNo ещё текущий; иначе → false (устаревший ответ отброшен). */
export const recordReply = internalMutation({
  args: {
    studentId: v.id("students"), turnNo: v.number(), reply: v.union(v.string(), v.null()), component,
    hintButton: v.boolean(), hintLevel: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, { studentId, turnNo, reply, component, hintButton, hintLevel }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s || (s.turnNo ?? 0) !== turnNo) return false;
    const cur = s.hintLevel ?? 0;
    // число от модели — подсказка коду: растёт не быстрее чем на 1 за ход, потолок 4
    const next = hintLevel === undefined ? cur : Math.min(4, Math.max(cur, Math.min(Math.trunc(hintLevel), cur + 1)));
    await ctx.db.patch("students", studentId, { lastReply: { turnNo, reply, component, hintButton }, hintLevel: next });
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
  args: { studentId: v.id("students"), category: v.string() },
  returns: v.null(),
  handler: async (ctx, { studentId, category }) => {
    const s = await ctx.db.get("students", studentId);
    if (!s) return null;
    const cat = (GUARD_CATEGORIES as readonly string[]).includes(category) ? (category as GuardCategory) : "SELF_HARM";
    const route = crisisRouting(cat);
    const now = Date.now();
    await ctx.db.patch("students", studentId, {
      state: "CRISIS",
      stateBeforeCrisis: s.state === "CRISIS" ? s.stateBeforeCrisis : s.state,
      chatBlockedUntil: now + CHAT.crisisBlockHours * 3_600_000,
      riskCount: s.riskCount + 1,
    });
    // Каждый кризис — флаг на ревью; notifyParent — по таблице спеки (ABUSE_HOME → false).
    await ctx.db.insert("reviewQueue", {
      studentId, category: cat, severity: route?.urgent ? 4 : 3, status: "open", notifyParent: route?.notifyParent ?? false,
    });
    return null;
  },
});
