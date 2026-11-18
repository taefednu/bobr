// Демо-путь спеки («Граф тем» → «Демо-путь»), детерминированная часть, без LLM.
import { describe, expect, it } from "vitest";
import { DEMO_PROBES, checkAnswer, type Task } from "../lib/fractions";
import { buildPlan, nextProbeTopic } from "../lib/planner";
import type { TopicId } from "../lib/types";
import { houseState } from "../lib/houses";
import { graph } from "../lib/content";

const probe = (topic: string): Task => {
  const t = DEMO_PROBES.find((p) => p.topic === topic);
  if (!t) throw new Error(`нет пробы ${topic}`);
  return t;
};
const NOW = Date.parse("2026-11-18T12:00:00Z");
const DAY = 86_400_000;

describe("демо-путь", () => {
  it("1. N9: 1/2 + 1/3 = 2/5 → misconception M9", () => {
    const t = probe("N9");
    expect(t.params).toMatchObject({ a: "1", b: "2", c: "1", d: "3" });
    expect(checkAnswer("2/5", t)).toMatchObject({ status: "misconception", misconception: "M9" });
  });

  it("2. N8: 1/5 + 2/5, ответ 3/10 → та же M9 → gap", () => {
    const t = probe("N8");
    expect(t.answer).toBe("3/5");
    expect(checkAnswer("3/10", t)).toMatchObject({ status: "misconception", misconception: "M9" });
  });

  it("3. N2 ок (верный ответ на пробу)", () => {
    const t = probe("N2");
    expect(checkAnswer(t.answer, t).status).toBe("ok");
  });

  it("4. пробы N5 (1/2 = ?/6 → 3) и N6 (НОК 2 и 3 → 6)", () => {
    const n5 = probe("N5");
    expect(n5.answer).toBe("3");
    expect(checkAnswer("3", n5).status).toBe("ok");
    const n6 = probe("N6");
    expect(n6.answer).toBe("6");
  });

  it("5. planner → ровно N8 → N6 → N5 → N9", () => {
    const plan = buildPlan({
      graph,
      statuses: { N9: { level: "gap" }, N8: { level: "gap" }, N5: { level: "gap" }, N6: { level: "gap" }, N2: { level: "solved_self" }, N1: { level: "solved_self" } },
      targets: ["N9"],
      today: "2026-11-18",
      now: NOW,
    });
    expect(plan.order).toEqual(["N8", "N6", "N5", "N9"]);
  });

  it("6. houseMapper: N8 gap → scaffold; научил Bobr → alive; через 7 дней → dimmed", () => {
    expect(houseState({ level: "gap" }, NOW)).toBe("scaffold");
    expect(houseState({ level: "taught_bobr", taughtAt: NOW }, NOW)).toBe("alive");
    expect(houseState({ level: "taught_bobr", taughtAt: NOW - 7 * DAY }, NOW)).toBe("dimmed");
  });
  it("7. адаптивная диагностика по ответам ребёнка → ровно N8 → N6 → N5 → N9", () => {
    const answers: Record<string, string> = { N9: "2/5", N8: "3/10", N2: probe("N2").answer };
    const results: { topic: TopicId; ok: boolean }[] = [];
    for (;;) {
      const topic = nextProbeTopic({ graph, results, targets: ["N9"], maxProbes: 6, script: false });
      if (!topic) break;
      const t = probe(topic);
      // N5, N6: заведомо неверный вариант (дистрактор)
      const value = answers[topic] ?? t.distractors[0].value;
      results.push({ topic, ok: checkAnswer(value, t).status === "ok" });
    }
    expect(results.map((r) => r.topic)).toEqual(["N9", "N8", "N2", "N5", "N6"]);
    const statuses = Object.fromEntries(results.map((r) => [r.topic, { level: r.ok ? "solved_self" : "gap" }]));
    const plan = buildPlan({ graph, statuses, targets: ["N9"], today: "2026-11-18", now: NOW });
    expect(plan.order).toEqual(["N8", "N6", "N5", "N9"]);
  });
});
