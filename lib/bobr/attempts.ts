// «Ошибка Bobr» берётся из дистракторов генератора, а не от LLM: код решает, LLM только говорит.
import { DEMO_PROBES, generateTask } from "../fractions/generator";
import type { Task } from "../fractions/task";
import type { TopicId } from "../types";

export type SceneTask = Pick<Task, "id" | "topic" | "kind" | "params" | "answer" | "numbersShown">;
export type Attempt = { task: SceneTask; attempt: string; expression: string; misconception: string | null };

export function taskExpression(t: Pick<Task, "topic" | "params">): string {
  const p = t.params;
  switch (t.topic) {
    case "N8": return `${p.a}/${p.den} + ${p.c}/${p.den}`;
    case "N9": return `${p.a}/${p.b} + ${p.c}/${p.d}`;
    case "N5": return `${p.num}/${p.den} = ?/${p.toDen}`;
    case "N6": return `LCM(${p.a}, ${p.b})`;
    default: return "?"; // N2: `num/den` и есть верный ответ, в промпт его нельзя
  }
}

const gen = (topic: TopicId, seed: number): Task | null => {
  try {
    return generateTask(topic, "word", seed);
  } catch {
    return null; // у темы нет генератора
  }
};

// Только поля сцены: seed и distractors не выходят за генератор (и не проходят returns-валидатор convex/teach.ts).
const sceneTask = ({ id, topic, kind, params, answer, numbersShown }: Task): SceneTask =>
  ({ id, topic, kind, params, answer, numbersShown });

// Дистрактор с заблуждением, иначе первый.
function build(task: Task | null): Attempt | null {
  const d = task && (task.distractors.find((x) => x.misconception) ?? task.distractors[0]);
  if (!task || !d) return null;
  return { task: sceneTask(task), attempt: d.value, expression: taskExpression(task), misconception: d.misconception ?? null };
}

// TODO(core): брать настоящую ошибку ребёнка из диагностики (заявка в SCHEMA_REQUESTS)
export function entryAttempt(topic: TopicId): Attempt | null {
  return build(DEMO_PROBES.find((p) => p.topic === topic) ?? gen(topic, 1));
}

// Новая задача, не совпадающая по params с задачей входа.
function other(topic: TopicId, seed: number): Task | null {
  const entry = entryAttempt(topic);
  if (!entry) return null;
  const key = JSON.stringify(entry.task.params);
  for (let s = 10_000 + seed, i = 0; i < 20; s++, i++) {
    const t = gen(topic, s);
    if (t && JSON.stringify(t.params) !== key) return t;
  }
  return null;
}

// TODO: FAIL пока применяет заблуждение темы; настоящее «правило ребёнка» — классификация объяснения
export function wrongRuleAttempt(topic: TopicId, seed: number): Attempt | null {
  return build(other(topic, seed));
}

export function solvedAttempt(topic: TopicId, seed: number): Attempt | null {
  const t = other(topic, seed);
  return t && { task: sceneTask(t), attempt: t.answer, expression: taskExpression(t), misconception: null };
}
