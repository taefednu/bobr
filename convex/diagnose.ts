// Адаптивная диагностика (этап 3, docs/specs/API_CHILD.md). Вердикт и следующая проба — код, LLM не участвует.
// Ребёнку верно/неверно не сообщается: результат виден в плане. Импорты lib/ — только относительные.
import { v } from "convex/values";
import { DIAGNOSE, isScriptDiagnosis } from "../lib/config";
import { graph } from "../lib/content";
import { checkAnswer, mcqOptions, type TaskKind } from "../lib/fractions";
import { houseState } from "../lib/houses";
import { nextProbeTopic, probeFor } from "../lib/planner";
import type { TopicId } from "../lib/types";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { env } from "./botAuth";
import { rebuildPlan } from "./plan";
import { childOf, childOrNull } from "./session";
import { publicTask } from "./lessonView";

type Result = { topic: string; ok: boolean; misconception?: string };

/** Патч students с очередной пробой: currentTask без seed (answer только на сервере) + перемешанные варианты. */
function issue(topic: TopicId, results: Result[]) {
  const probe = probeFor(topic)!;
  const { seed: _seed, ...task } = probe;
  return { currentTask: task, currentTopic: topic, diagnosis: { results, options: mcqOptions(probe) } };
}

const next = (results: Result[]) =>
  nextProbeTopic({ graph, results: results as { topic: TopicId; ok: boolean }[], targets: DIAGNOSE.targets, maxProbes: DIAGNOSE.maxProbes, script: isScriptDiagnosis(env("DEMO_MODE")) });

export const start = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, { token }) => {
    const s = await childOf(ctx, token);
    if (s.state !== "DIAGNOSE" || s.currentTask || s.diagnosis?.results.length) return null;
    const first = next([]);
    if (first) await ctx.db.patch("students", s._id, issue(first, []));
    return null;
  },
});

// returns-валидатор: answer/distractors в публичном ответе не бывает (лишнее поле = ошибка).
export const view = query({
  args: { token: v.string() },
  returns: v.union(v.null(), v.object({
    state: v.string(), asked: v.number(), maxProbes: v.number(),
    probe: v.union(v.null(), v.object({
      id: v.string(), topic: v.string(), kind: v.string(),
      params: v.record(v.string(), v.string()), numbersShown: v.array(v.string()), options: v.array(v.string()),
    })),
  })),
  handler: async (ctx, { token }) => {
    const s = await childOrNull(ctx, token);
    if (!s) return null;
    const t = s.currentTask;
    const live = s.state === "DIAGNOSE" && t?.kind === "mcq";
    return {
      state: s.state,
      asked: s.diagnosis?.results.length ?? 0,
      maxProbes: DIAGNOSE.maxProbes,
      probe: live ? { id: t.id, ...publicTask(t), options: s.diagnosis?.options ?? [] } : null,
    };
  },
});

export const answer = mutation({
  args: { token: v.string(), probeId: v.string(), value: v.string() },
  returns: v.object({ accepted: v.boolean(), done: v.boolean() }),
  handler: async (ctx, { token, probeId, value }) => {
    const s = await childOf(ctx, token);
    const task = s.currentTask;
    if (s.state !== "DIAGNOSE" || !task || task.id !== probeId) return { accepted: false, done: false };
    // «почти» (несокращённая дробь) тоже верно: проба проверяет понимание, а не сокращение
    const r = checkAnswer(value, { ...task, kind: task.kind as TaskKind });
    const res: Result = {
      topic: task.topic, ok: r.status === "ok" || r.status === "almost",
      ...(r.status === "misconception" ? { misconception: r.misconception } : {}),
    };
    const results = [...(s.diagnosis?.results ?? []), res];
    const nextTopic = next(results);
    if (nextTopic) {
      await ctx.db.patch("students", s._id, issue(nextTopic, results));
      return { accepted: true, done: false };
    }
    await finish(ctx, s._id, results);
    return { accepted: true, done: true };
  },
});

async function finish(ctx: MutationCtx, studentId: Id<"students">, results: Result[]) {
  const now = Date.now();
  for (const { topic, ok } of results) {
    const level = ok ? "solved_self" : "gap";
    const status = { level, streak: 0, tasksThisSession: 0, bobrQuestionRounds: 0, ...(ok ? { solvedSelfAt: now } : {}) } as const;
    const row = await ctx.db.query("topicStatus")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", topic)).unique();
    if (row) await ctx.db.patch("topicStatus", row._id, { ...status, solvedSelfAt: ok ? now : undefined });
    else await ctx.db.insert("topicStatus", { studentId, topic, ...status });
    const house = houseState({ level }, now);
    const h = await ctx.db.query("houses")
      .withIndex("by_student_and_topic", (q) => q.eq("studentId", studentId).eq("topic", topic)).unique();
    if (h) await ctx.db.patch("houses", h._id, { state: house });
    else await ctx.db.insert("houses", { studentId, topic, state: house });
  }
  await ctx.db.patch("students", studentId, { currentTask: undefined, currentTopic: undefined, state: "PLAN" });
  await rebuildPlan(ctx, studentId);
}
