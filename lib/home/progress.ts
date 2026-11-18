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

export function planProgress(order: readonly string[], levelOf: (t: string) => string | undefined) {
  const done = order.filter((t) => isDone(levelOf(t))).length;
  return { done, total: order.length, percent: order.length ? Math.round((done * 100) / order.length) : 0 };
}

export type LevelState = "done" | "current" | "next" | "review";

/** Уровни острова: только startable-темы плана в порядке плана, первые 6. n — номер камня, с 1. */
export function houseLevels(
  order: readonly string[],
  levelOf: (t: string) => string | undefined,
  current: string | null,
  needsReview: (t: string) => boolean,
  startable: (t: string) => boolean,
): { n: number; topic: string; state: LevelState; canStart: boolean }[] {
  return order.filter(startable).slice(0, HOUSE_WINDOW).map((topic, i) => ({
    n: i + 1,
    topic,
    state: topic === current ? "current" : isDone(levelOf(topic)) ? (needsReview(topic) ? "review" : "done") : "next",
    canStart: true,
  }));
}
