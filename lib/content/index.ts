import type { Lang, TopicId } from "../types";
import raw from "../../content/graph.json";

export type Topic = { id: TopicId; title: Record<Lang, string>; prereqs: TopicId[] };
export type Graph = { topics: Topic[] };

/** Бросает, если у темы несуществующий пререквизит или в графе цикл. */
export function validateGraph(g: Graph): Graph {
  const ids = new Set<string>(g.topics.map((t) => t.id));
  for (const t of g.topics)
    for (const p of t.prereqs) if (!ids.has(p)) throw new Error(`graph: ${t.id} has unknown prereq ${p}`);
  const state = new Map<string, 1 | 2>(); // 1 = в стеке, 2 = готово
  const byId = new Map<string, Topic>(g.topics.map((t) => [t.id, t]));
  const visit = (id: string): void => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) throw new Error(`graph: cycle through ${id}`);
    state.set(id, 1);
    for (const p of byId.get(id)!.prereqs) visit(p);
    state.set(id, 2);
  };
  g.topics.forEach((t) => visit(t.id));
  return g;
}

export const graph = validateGraph(raw as Graph);
