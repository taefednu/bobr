// Единственный шов для ещё не готового бэкенда. Заглушки, пока core не выпустит функции из
// docs/specs/API_CHILD.md (diagnose:view, plan:view, mahalla:view). Формы типов — оттуда дословно.
// Клиентский модуль: не импортирует DEMO_PROBES и ничего с ответами; вариантов без пометки «верный» нет.
import { graph } from "@/lib/content";
import { houseState } from "@/lib/houses/houseMapper";
import { buildPlan } from "@/lib/planner/planner";
import type { HouseState, Lang, TopicId } from "@/lib/types";

export type GoalIntent = "test_soon" | "improve" | "just_practice";
export const GOAL_INTENTS: GoalIntent[] = ["test_soon", "improve", "just_practice"];

export type DiagnoseView = {
  state: string;
  asked: number;
  maxProbes: number;
  probe: null | {
    id: string;
    topic: string;
    kind: "mcq";
    params: Record<string, string>;
    numbersShown: string[];
    options: string[];
  };
};

export type PlanView = {
  testDate: string | null;
  gaps: string[];
  order: { topic: string; title: string }[];
  days: { date: string; items: { topic: string; title: string; kind: "new" | "review" | "mixed_check" }[] }[];
};

export type MahallaView = {
  lang: Lang;
  state: string;
  houses: {
    topic: string;
    title: string;
    state: HouseState;
    prereqs: string[];
    inPlan: boolean;
    canStart: boolean;
  }[];
  next: string | null;
};

type Probe = NonNullable<DiagnoseView["probe"]>;
// Порядок N9 → N8 → N2 → N5 → N6; формы params как в DEMO_PROBES (lib/fractions). Порядок вариантов перемешан.
const PROBES: Probe[] = [
  { id: "probe-N9", topic: "N9", kind: "mcq", params: { a: "1", b: "2", c: "1", d: "3" }, numbersShown: ["1", "2", "1", "3"], options: ["2/5", "5/6", "1/5", "3/6"] },
  { id: "probe-N8", topic: "N8", kind: "mcq", params: { a: "1", c: "2", den: "5" }, numbersShown: ["1", "5", "2", "5"], options: ["3/5", "3/10", "2/5", "1/10"] },
  { id: "probe-N2", topic: "N2", kind: "mcq", params: { num: "3", den: "8" }, numbersShown: ["3", "8"], options: ["5/8", "3/5", "3/8", "1/8"] },
  { id: "probe-N5", topic: "N5", kind: "mcq", params: { num: "1", den: "2", toDen: "6" }, numbersShown: ["1", "2", "6"], options: ["2", "3", "4", "6"] },
  { id: "probe-N6", topic: "N6", kind: "mcq", params: { a: "2", b: "3" }, numbersShown: ["2", "3"], options: ["5", "12", "6", "1"] },
];

// TODO(core): diagnose:view
/** Демо-последовательность проб; step — сколько уже отвечено. */
export function stubDiagnose(step: number): DiagnoseView {
  const probe = PROBES[step] ?? null;
  return { state: probe ? "DIAGNOSE" : "PLAN", asked: step, maxProbes: PROBES.length, probe };
}

/** Статусы демо-пути (tests/demo-path.test.ts). */
export const DEMO_STATUSES = {
  N9: { level: "gap" },
  N8: { level: "gap" },
  N5: { level: "gap" },
  N6: { level: "gap" },
  N2: { level: "solved_self" },
  N1: { level: "solved_self" },
} as const;

const title = (id: TopicId, lang: Lang) => graph.topics.find((t) => t.id === id)!.title[lang];

function plan(now: number) {
  return buildPlan({ graph, statuses: DEMO_STATUSES, targets: ["N9"], today: new Date(now).toISOString().slice(0, 10), now });
}

// TODO(core): plan:view
/** now — аргумент, чтобы гидрация совпала: на сервере и клиенте передавайте одно значение. */
export function stubPlan(now: number, lang: Lang): PlanView {
  const p = plan(now);
  return {
    testDate: null,
    gaps: Object.entries(DEMO_STATUSES).filter(([, s]) => s.level === "gap").map(([id]) => id),
    order: p.order.map((topic) => ({ topic, title: title(topic, lang) })),
    days: p.days.map((d) => ({ date: d.date, items: d.items.map((i) => ({ ...i, title: title(i.topic, lang) })) })),
  };
}

// TODO(core): mahalla:view
export function stubMahalla(now: number, lang: Lang): MahallaView {
  const order = plan(now).order;
  return {
    lang,
    state: "HOME",
    houses: graph.topics.map((t) => ({
      topic: t.id,
      title: t.title[lang],
      state: houseState(DEMO_STATUSES[t.id as keyof typeof DEMO_STATUSES], now),
      prereqs: t.prereqs,
      inPlan: order.includes(t.id),
      canStart: order.includes(t.id),
    })),
    next: order[0] ?? null,
  };
}
