// Адаптивная диагностика: какую пробу задать следующей. Чистый модуль, порядок вытекает из графа.
// Ошибка открывает пререквизиты темы, верный ответ закрывает ветку. Темы без пробы прозрачны: идём к их
// пререквизитам, результата для них нет. Обход в глубину, среди пререквизитов одной темы — больший индекс графа первым.
import { DEMO_PROBE_ORDER } from "../config";
import type { Graph } from "../content";
import { DEMO_PROBES, type Task } from "../fractions";
import type { TopicId } from "../types";

/** Единственный банк проб темы (режим меняет только порядок, не числа). null — пробы нет. */
export const probeFor = (topic: TopicId): Task | null => DEMO_PROBES.find((p) => p.topic === topic) ?? null;

export function nextProbeTopic(a: {
  graph: Graph;
  results: { topic: TopicId; ok: boolean }[];
  targets: readonly TopicId[];
  maxProbes: number;
  script: boolean;
}): TopicId | null {
  const { graph, results, targets, maxProbes, script } = a;
  if (results.length >= maxProbes) return null;
  const asked = new Set(results.map((r) => r.topic));
  if (script) return DEMO_PROBE_ORDER.find((t) => probeFor(t) && !asked.has(t)) ?? null;

  const byId = new Map(graph.topics.map((t, i) => [t.id, { prereqs: t.prereqs, i }]));
  const seen = new Set<TopicId>();
  const visit = (id: TopicId): TopicId | null => {
    if (seen.has(id)) return null;
    seen.add(id);
    if (probeFor(id)) {
      const r = results.find((x) => x.topic === id);
      if (!r) return id;
      if (r.ok) return null; // ветка закрыта
    }
    const pre = [...byId.get(id)!.prereqs].sort((x, y) => byId.get(y)!.i - byId.get(x)!.i);
    for (const p of pre) {
      const found = visit(p);
      if (found) return found;
    }
    return null;
  };
  for (const t of targets) {
    const found = visit(t);
    if (found) return found;
  }
  return null;
}
