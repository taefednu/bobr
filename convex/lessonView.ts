// Публичная проекция урока для useQuery: БЕЗ answer и distractors (спека: ANSWER_EXTRACTION через подписку).
// Чистые функции: тестируются в tests/lessonView.test.ts. Импорты lib/ — только относительные.
import { crisisMessage } from "../lib/safety/crisis";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

type Task = NonNullable<Doc<"students">["currentTask"]>;

export const publicTask = (t: Task) => ({
  topic: t.topic,
  kind: t.kind,
  params: t.params,
  numbersShown: t.numbersShown,
});

/** Операнды задачи дробями из params (для компонента-запасника). Только то, что ребёнок и так видит. */
export function operandFractions(p: Record<string, string>): string[] {
  if (p.a && p.b && p.c && p.d) return [`${p.a}/${p.b}`, `${p.c}/${p.d}`];
  if (p.a && p.c && p.den) return [`${p.a}/${p.den}`, `${p.c}/${p.den}`];
  if (p.num && p.den) return [`${p.num}/${p.den}`];
  return [];
}

// Состояния урока и сцены «Научи Bobr» (из них сцену можно войти заново: перезагрузка посреди сцены).
const TEACH_ENTRY_STATES = ["LESSON_SOLVE", "TOPIC_DONE", "TEACH_BOBR", "BOBR_QUESTION", "BOBR_ATTEMPT", "JUDGING"];

/** «Научи Bobr» открыт: тема решена сама (solved_self) и ребёнок в уроке или в сцене. Уровень темы считает код, клиент его не выводит. */
const canTeachFrom = (s: Doc<"students">, level: string | null) =>
  level === "solved_self" && TEACH_ENTRY_STATES.includes(s.state);

export function lessonView(s: Doc<"students">, topicLevel: string | null = null) {
  const crisis = s.state === "CRISIS" ? crisisMessage(s.lang) : null;
  return {
    lang: s.lang,
    state: s.state,
    turnNo: s.turnNo ?? 0,
    lastVerdict: s.lastVerdict ?? null,
    hintLevel: s.hintLevel ?? 0,
    canTeach: canTeachFrom(s, topicLevel),
    task: s.currentTask && s.currentTask.kind !== "mcq" ? publicTask(s.currentTask) : null, // проба диагностики идёт только через diagnose:view
    reply: s.lastReply
      ? { text: s.lastReply.reply, component: s.lastReply.component, hintButton: s.lastReply.hintButton }
      : null,
    // стейт урока под оверлеем сохранён (task, reply остаются в ответе)
    crisis: crisis ? { text: crisis.trustedAdultFirst, numbers: [...crisis.numbers] } : null,
  };
}

// returns-валидатор: заодно фиксирует, что answer/distractors в публичном ответе не бывает (лишнее поле = ошибка).
export const viewValidator = v.union(v.null(), v.object({
  lang: v.union(v.literal("uz"), v.literal("ru")),
  state: v.string(),
  turnNo: v.number(),
  lastVerdict: v.union(v.string(), v.null()),
  hintLevel: v.number(),
  canTeach: v.boolean(),
  task: v.union(v.null(), v.object({
    topic: v.string(), kind: v.string(), params: v.record(v.string(), v.string()), numbersShown: v.array(v.string()),
  })),
  reply: v.union(v.null(), v.object({
    text: v.union(v.string(), v.null()),
    component: v.union(v.null(), v.object({
      type: v.union(v.literal("pie"), v.literal("strip"), v.literal("line")),
      params: v.array(v.object({ key: v.string(), value: v.string() })),
    })),
    hintButton: v.boolean(),
  })),
  crisis: v.union(v.null(), v.object({ text: v.string(), numbers: v.array(v.string()) })),
}));
