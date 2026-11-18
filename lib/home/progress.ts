// Прогресс по плану для экранов /home и /house: чистые функции, считает код, не LLM (docs/design/v3/README.md).
const DAY_MS = 86_400_000;
export const HOUSE_WINDOW = 6; // камней на острове (level1…6)

export const isDone = (level: string | undefined) => level === "solved_self" || level === "taught_bobr";

/** Первая тема плана, которую ещё не прошли и с которой можно начать урок (иначе стрелка баннера мертва). */
export function pickNext(order: readonly string[], levelOf: (t: string) => string | undefined, startable: (t: string) => boolean): string | null {
  return order.find((t) => !isDone(levelOf(t)) && startable(t)) ?? null;
}

/** Тема для круга «Научи»: последняя solved_self, которая есть в плане и стартуема (иначе mahalla:startLesson бросит «cannot start»). */
export function pickTeach(
  rows: readonly { topic: string; level: string; solvedSelfAt?: number }[],
  order: readonly string[],
  startable: (t: string) => boolean,
): string | null {
  const ok = rows.filter((r) => r.level === "solved_self" && order.includes(r.topic) && startable(r.topic));
  return ok.sort((a, b) => (b.solvedSelfAt ?? 0) - (a.solvedSelfAt ?? 0))[0]?.topic ?? null;
}

/** Патч строки темы при старте урока: выдана 1 задача. Серию обнуляем, только если прошлая сессия темы закончена (или не начиналась):
 *  ребёнок, ушедший с темы на полпути, возвращается к своей серии, а не к нулю. */
export function sessionStartPatch(row: { tasksThisSession: number }, maxTasks: number): { tasksThisSession: number; streak?: number } {
  const unfinished = row.tasksThisSession > 0 && row.tasksThisSession < maxTasks;
  return unfinished ? { tasksThisSession: 1 } : { tasksThisSession: 1, streak: 0 };
}

export function planProgress(order: readonly string[], levelOf: (t: string) => string | undefined) {
  const done = order.filter((t) => isDone(levelOf(t))).length;
  return { done, total: order.length, percent: order.length ? Math.round((done * 100) / order.length) : 0 };
}

export type LevelState = "done" | "current" | "next" | "review";

/** Темы камней: startable-темы плана в порядке плана, затем остальные startable-темы графа в порядке пререквизитов; первые 6.
 *  Один источник для house:view и mahalla:startLesson, чтобы показанный камень всегда стартует. */
export function houseTopics(
  order: readonly string[],
  topics: readonly { id: string; prereqs: readonly string[] }[],
  startable: (t: string) => boolean,
): string[] {
  const byId = new Map(topics.map((t) => [t.id, t]));
  const seen = new Set<string>();
  const topo: string[] = [];
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id); // раньше обхода: защита от цикла
    byId.get(id)?.prereqs.forEach(visit);
    topo.push(id); // пререквизиты раньше темы
  };
  topics.forEach((t) => visit(t.id));
  return [...new Set([...order.filter(startable), ...topo.filter(startable)])].slice(0, HOUSE_WINDOW);
}

/** Уровни острова по темам из houseTopics. Текущий — первая не пройденная (камень «следующий» всё равно открывается). n — номер камня, с 1. */
export function houseLevels(
  topics: readonly string[],
  levelOf: (t: string) => string | undefined,
  needsReview: (t: string) => boolean,
): { n: number; topic: string; state: LevelState; canStart: boolean }[] {
  const current = topics.find((t) => !isDone(levelOf(t)));
  return topics.map((topic, i) => ({
    n: i + 1,
    topic,
    state: topic === current ? "current" : isDone(levelOf(topic)) ? (needsReview(topic) ? "review" : "done") : "next",
    canStart: true,
  }));
}
