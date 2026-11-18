import { describe, expect, it } from "vitest";
import { graph } from "../lib/content";
import { nextProbeTopic, probeFor } from "../lib/planner";
import type { TopicId } from "../lib/types";

type R = { topic: TopicId; ok: boolean };
// Гоним диагностику: verdict(topic) → ok; возвращает порядок вопросов.
const walk = (verdict: (t: TopicId) => boolean, o: { maxProbes?: number; script?: boolean; targets?: TopicId[] } = {}) => {
  const results: R[] = [];
  for (;;) {
    const t = nextProbeTopic({ graph, results, targets: o.targets ?? ["N9"], maxProbes: o.maxProbes ?? 6, script: o.script ?? false });
    if (!t) return results.map((r) => r.topic);
    results.push({ topic: t, ok: verdict(t) });
  }
};

describe("diagnose: nextProbeTopic", () => {
  it("демо-ответы (N2 верно, остальное нет) → N9, N8, N2, N5, N6", () => {
    expect(walk((t) => t === "N2")).toEqual(["N9", "N8", "N2", "N5", "N6"]);
  });
  it("всё верно → стоп после N9", () => {
    expect(walk(() => true)).toEqual(["N9"]);
  });
  it("тема не спрашивается дважды", () => {
    const order = walk(() => false, { maxProbes: 20 });
    expect(new Set(order).size).toBe(order.length);
  });
  it("потолок maxProbes", () => {
    expect(walk(() => false, { maxProbes: 2 })).toEqual(["N9", "N8"]);
  });
  it("темы без пробы (N4, N3) проходятся насквозь и в результатах не появляются", () => {
    expect(probeFor("N4")).toBeNull();
    expect(probeFor("N3")).toBeNull();
    const order = walk(() => false, { maxProbes: 20 });
    expect(order).not.toContain("N4");
    expect(order).not.toContain("N3");
    // цель без пробы: идём к пререквизитам N4 → N3 → N2
    expect(walk(() => false, { targets: ["N4"] })).toEqual(["N2"]);
  });
  it("script: DEMO_PROBE_ORDER без N1 при любых ответах", () => {
    expect(walk(() => true, { script: true })).toEqual(["N9", "N8", "N2", "N5", "N6"]);
    expect(walk(() => false, { script: true })).toEqual(["N9", "N8", "N2", "N5", "N6"]);
  });
});
