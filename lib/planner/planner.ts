// planner: замыкание пререквизитов, топосорт, ≤ LESSON.maxNewTopicsPerDay новых тем в день,
// review-слот для taught ≥ dimmedAfterDays, в день перед testDate — mixed_check.
//
// Правила, которых спека не задаёт (приняты здесь):
// 1. В план входят цели и их замыкание пререквизитов, но только темы с level "gap"; сама цель — если не
//    решена (нет статуса или gap). Темы без статуса вне целей (не пробовались, напр. N3/N4 в демо) НЕ входят.
//    Тема готова, когда сделаны все запланированные темы среди её ТРАНЗИТИВНЫХ пререквизитов в полном
//    графе (непробованные N3/N4 цепочку не рвут); незапланированные считаются выполненными.
// 2. Среди готовых тем первой идёт та, что ближе к цели (кратчайшая цепочка пререквизитов; прямой
//    пререквизит раньше дальнего), затем порядок id в графе.
// 3. Review: каждая taught_bobr-тема (taughtAt + 7 дн ≤ день; для первого дня — max(день, now)) один раз,
//    в первый подходящий день. Если срок позже последнего дня плана — review не ставится.
// 4. mixed_check: один элемент в день testDate−1 (если он ≥ today и есть цель), topic = первая цель.
//    Без цели mixed_check нет. Дни плана заканчиваются на этом дне: новые темы по ≤2 в день с today,
//    не поместившиеся до него остаются в `order`, но в днях не стоят (после контрольной учить поздно).
//    testDate = завтра → mixed_check сегодня вместе с ≤2 новыми.
// 5. Без новых тем и без testDate всё равно один день (для review).
import { LESSON } from "../config";
import type { Graph } from "../content";
import type { TopicId, TopicLevel } from "../types";

const DAY_MS = 86_400_000;
type Status = { level: TopicLevel; taughtAt?: number };
type Item = { topic: TopicId; kind: "new" | "review" | "mixed_check" };
export type Plan = { order: TopicId[]; days: { date: string; items: Item[] }[] };

const addDays = (date: string, n: number) => new Date(Date.parse(date) + n * DAY_MS).toISOString().slice(0, 10);

export function buildPlan(a: {
  graph: Graph;
  statuses: Partial<Record<TopicId, Status>>;
  targets: TopicId[];
  today: string;
  testDate?: string;
  now: number;
}): Plan {
  const { graph, statuses, targets, today, testDate, now } = a;
  const byId = new Map(graph.topics.map((t) => [t.id, t]));
  const idx = new Map(graph.topics.map((t, i) => [t.id, i]));

  // BFS по пререквизитам: расстояние до ближайшей цели
  const dist = new Map<TopicId, number>(targets.map((t) => [t, 0]));
  for (let q = [...targets]; q.length; ) {
    const id = q.shift()!;
    for (const p of byId.get(id)!.prereqs)
      if (!dist.has(p)) { dist.set(p, dist.get(id)! + 1); q.push(p); }
  }

  const anc = (id: TopicId, seen = new Set<TopicId>()): Set<TopicId> => {
    for (const p of byId.get(id)!.prereqs) if (!seen.has(p)) { seen.add(p); anc(p, seen); }
    return seen;
  };

  const inPlan = new Set<TopicId>(
    [...dist.keys()].filter((id) => {
      const lvl = statuses[id]?.level;
      return lvl === "gap" || (targets.includes(id) && lvl === undefined);
    }),
  );

  const order: TopicId[] = [];
  const done = new Set<TopicId>();
  while (order.length < inPlan.size) {
    const next = [...inPlan]
      .filter((id) => !done.has(id) && [...anc(id)].every((p) => !inPlan.has(p) || done.has(p)))
      .sort((x, y) => dist.get(x)! - dist.get(y)! || idx.get(x)! - idx.get(y)!)[0];
    order.push(next);
    done.add(next);
  }

  const mixedDay = testDate ? addDays(testDate, -1) : undefined;
  const newDays = Math.ceil(order.length / LESSON.maxNewTopicsPerDay);
  const mixedIdx = mixedDay && targets.length && mixedDay >= today ? (Date.parse(mixedDay) - Date.parse(today)) / DAY_MS : -1;
  const len = mixedIdx >= 0 ? mixedIdx + 1 : Math.max(1, newDays);

  const reviewed = new Set<TopicId>();
  const days = Array.from({ length: len }, (_, i) => {
    const date = addDays(today, i);
    const items: Item[] = order
      .slice(i * LESSON.maxNewTopicsPerDay, (i + 1) * LESSON.maxNewTopicsPerDay)
      .map((topic) => ({ topic, kind: "new" }));
    const at = i === 0 ? Math.max(now, Date.parse(date)) : Date.parse(date);
    for (const t of graph.topics) {
      const s = statuses[t.id];
      if (s?.level === "taught_bobr" && s.taughtAt !== undefined && !reviewed.has(t.id) &&
          s.taughtAt + LESSON.dimmedAfterDays * DAY_MS <= at) {
        reviewed.add(t.id);
        items.push({ topic: t.id, kind: "review" });
      }
    }
    if (i === mixedIdx) items.push({ topic: targets[0], kind: "mixed_check" });
    return { date, items };
  });
  return { order, days };
}
