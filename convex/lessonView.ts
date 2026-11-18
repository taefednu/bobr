// Публичная проекция урока для useQuery: БЕЗ answer и distractors (спека: ANSWER_EXTRACTION через подписку).
// Чистые функции: тестируются в tests/lessonView.test.ts. Импорты lib/ — только относительные.
import { crisisMessage } from "../lib/safety/crisis";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { publicProgress } from "./socraticState";

type Task = NonNullable<Doc<"students">["currentTask"]>;

export const publicTask = (t: Pick<Task, "topic" | "kind" | "params" | "numbersShown">) => ({
  topic: t.topic,
  kind: t.kind,
  params: Object.fromEntries(Object.entries(t.params).filter(([key]) => ["a", "b", "c", "d", "den", "num", "toDen"].includes(key))),
  numbersShown: t.numbersShown,
});

/** Операнды задачи дробями из params (для компонента-запасника). Только то, что ребёнок и так видит. */
export function operandFractions(p: Record<string, string>): string[] {
  if (p.a && p.b && p.c && p.d) return [`${p.a}/${p.b}`, `${p.c}/${p.d}`];
  if (p.a && p.c && p.den) return [`${p.a}/${p.den}`, `${p.c}/${p.den}`];
  if (p.num && p.den) return [`${p.num}/${p.den}`];
  return [];
}

/** Рисунок-условие задачи вида picture (текст ссылается на «картинку»). Это данные условия, они и так в params.
 *  Отдаём геометрию (k закрашено из n), а не строку-дробь: в useQuery строки с ответом задачи быть не должно.
 *  Клиент рисует без числовой подписи. Подсказкой не является и от реплики не зависит. */
export type TaskPicture = { type: "pie" | "strip" | "line"; cells: { k: number; n: number }[] };
export function taskPicture(t: Pick<Task, "topic" | "kind" | "params">): TaskPicture | null {
  if (t.kind !== "picture") return null;
  const p = t.params;
  const c = (k: string, n: string) => ({ k: Number(k), n: Number(n) });
  switch (t.topic) {
    case "N2": return p.num && p.den ? { type: "pie", cells: [c(p.num, p.den)] } : null;
    case "N3": return p.num && p.den ? { type: "line", cells: [c(p.num, p.den)] } : null;
    case "N4": return p.p && p.q ? { type: "pie", cells: [c("1", p.p), c("1", p.q)] } : null;
    case "N5": return p.num && p.den ? { type: "strip", cells: [c(p.num, p.den)] } : null;
    case "N6": return p.a && p.b ? { type: "line", cells: [c(p.a, "1"), c(p.b, "1")] } : null; // бусины на a и b, кратные не отмечены
    case "N8": return p.a && p.c && p.den ? { type: "strip", cells: [c(p.a, p.den), c(p.c, p.den)] } : null;
    case "N9": return p.a && p.b && p.c && p.d ? { type: "pie", cells: [c(p.a, p.b), c(p.c, p.d)] } : null;
    default: return null;
  }
}

// Состояния урока и сцены «Научи Bobr» (из них сцену можно войти заново: перезагрузка посреди сцены).
const TEACH_ENTRY_STATES = ["LESSON_SOLVE", "TOPIC_DONE", "TEACH_BOBR", "BOBR_QUESTION", "BOBR_ATTEMPT", "JUDGING"];

/** «Научи Bobr» открыт: тема решена сама (solved_self) и ребёнок в уроке или в сцене. Уровень темы считает код, клиент его не выводит. */
const canTeachFrom = (s: Doc<"students">, level: string | null) =>
  level === "solved_self" && TEACH_ENTRY_STATES.includes(s.state);

export function lessonView(s: Doc<"students">, progress: Doc<"taskProgress"> | null = null, topicLevel: string | null = null) {
  const crisis = s.state === "CRISIS" ? crisisMessage(s.lang) : null;
  return {
    lang: s.lang,
    state: s.state,
    turnNo: s.turnNo ?? 0,
    lastVerdict: s.lastVerdict ?? null,
    hintLevel: progress ? progress.escalationLevel - 1 : (s.hintLevel ?? 0),
    socratic: publicProgress(progress, s),
    canTeach: canTeachFrom(s, topicLevel),
    task: s.currentTask && s.currentTask.kind !== "mcq" ? publicTask(s.currentTask) : null, // проба диагностики идёт только через diagnose:view
    picture: s.currentTask && s.currentTask.kind !== "mcq" ? taskPicture(s.currentTask) : null,
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
  socratic: v.union(v.null(), v.object({
    taskInstanceId: v.id("taskProgress"), lessonSessionId: v.id("lessonSessions"),
    attemptCount: v.number(), escalationLevel: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4)),
    misconceptionTag: v.union(v.string(), v.null()), interestTheme: v.union(v.literal("Nonvoyxona"), v.literal("Football"), v.literal("Minecraft")),
  })),
  task: v.union(v.null(), v.object({
    topic: v.string(), kind: v.string(), params: v.record(v.string(), v.string()), numbersShown: v.array(v.string()),
  })),
  picture: v.union(v.null(), v.object({ type: v.union(v.literal("pie"), v.literal("strip"), v.literal("line")), cells: v.array(v.object({ k: v.number(), n: v.number() })) })),
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
