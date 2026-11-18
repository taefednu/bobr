import Fraction from "fraction.js";
import { describe, expect, it } from "vitest";
import { entryAttempt, solvedAttempt, taskExpression, wrongRuleAttempt } from "../lib/bobr/attempts";
import type { TopicId } from "../lib/types";

const SEEDS = 500;
const eq = (a: string, b: string) => new Fraction(a).equals(new Fraction(b));
const TOPICS: TopicId[] = ["N2", "N5", "N6", "N8", "N9"];

// Сумма операндов из params, независимо от task.answer.
function operandSum(topic: "N8" | "N9", p: Record<string, string>): Fraction {
  return topic === "N8"
    ? new Fraction(`${p.a}/${p.den}`).add(new Fraction(`${p.c}/${p.den}`))
    : new Fraction(`${p.a}/${p.b}`).add(new Fraction(`${p.c}/${p.d}`));
}

describe("taskExpression", () => {
  it("по формату спеки", () => {
    expect(taskExpression({ topic: "N8", params: { a: "1", c: "2", den: "5" } })).toBe("1/5 + 2/5");
    expect(taskExpression({ topic: "N9", params: { a: "1", b: "2", c: "1", d: "3" } })).toBe("1/2 + 1/3");
    expect(taskExpression({ topic: "N5", params: { num: "1", den: "2", toDen: "6" } })).toBe("1/2 = ?/6");
    expect(taskExpression({ topic: "N6", params: { a: "2", b: "3" } })).toBe("LCM(2, 3)");
    expect(taskExpression({ topic: "N2", params: { num: "3", den: "4" } })).toBe("?"); // 3/4 — это ответ
  });
});

describe("N2: выражение не содержит ответ", () => {
  it("entry/wrong_rule/solved: expression «?», верный ответ в нём не виден", () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const a of [entryAttempt("N2"), wrongRuleAttempt("N2", seed), solvedAttempt("N2", seed)]) {
        expect(a!.expression).toBe("?");
        expect(a!.expression).not.toContain(a!.task.answer);
      }
    }
  });
});

describe("entryAttempt", () => {
  it("N9: 1/2 + 1/3, ответ Bobr 2/5, заблуждение M9", () => {
    const a = entryAttempt("N9")!;
    expect(a.expression).toBe("1/2 + 1/3");
    expect(a.attempt).toBe("2/5");
    expect(a.misconception).toBe("M9");
    expect(eq(a.task.answer, "5/6")).toBe(true);
    expect(eq(a.attempt, a.task.answer)).toBe(false);
  });
  it("N8: 1/5 + 2/5, Bobr сложил знаменатели (3/10), M9", () => {
    const a = entryAttempt("N8")!;
    expect(a.expression).toBe("1/5 + 2/5");
    expect(a.attempt).toBe("3/10");
    expect(a.misconception).toBe("M9");
  });
  it("все темы с генератором: attempt неверен, expression совпадает с задачей", () => {
    for (const t of TOPICS) {
      const a = entryAttempt(t)!;
      expect(a, t).not.toBeNull();
      expect(a.task.topic).toBe(t);
      expect(eq(a.attempt, a.task.answer), t).toBe(false);
      expect(a.expression).toBe(taskExpression(a.task));
    }
  });
  it("тема без генератора → null (не бросает)", () => {
    expect(entryAttempt("N1")).toBeNull();
    expect(wrongRuleAttempt("N1", 3)).toBeNull();
    expect(solvedAttempt("N1", 3)).toBeNull();
  });
});

describe("solvedAttempt", () => {
  for (const topic of ["N8", "N9"] as const) {
    it(`${topic}: attempt = ответ задачи = сумма операндов, ${SEEDS} seed`, () => {
      for (let seed = 0; seed < SEEDS; seed++) {
        const a = solvedAttempt(topic, seed)!;
        expect(a.attempt).toBe(a.task.answer);
        expect(new Fraction(a.attempt).equals(operandSum(topic, a.task.params)), `${topic}#${seed}`).toBe(true);
        expect(a.misconception).toBeNull();
        expect(a.expression).toBe(taskExpression(a.task));
        expect(JSON.stringify(a.task.params)).not.toBe(JSON.stringify(entryAttempt(topic)!.task.params));
      }
    });
  }
  it("N2, N5, N6: attempt === answer", () => {
    for (const t of ["N2", "N5", "N6"] as const) {
      for (let seed = 0; seed < 100; seed++) {
        const a = solvedAttempt(t, seed)!;
        expect(a.attempt).toBe(a.task.answer);
      }
    }
  });
  it("детерминизм: тот же seed → та же сцена", () => {
    expect(solvedAttempt("N9", 7)).toEqual(solvedAttempt("N9", 7));
  });
});

describe("wrongRuleAttempt", () => {
  for (const topic of TOPICS) {
    it(`${topic}: attempt ≠ верный ответ, params отличаются от entry, ${SEEDS} seed`, () => {
      const entryParams = JSON.stringify(entryAttempt(topic)!.task.params);
      for (let seed = 0; seed < SEEDS; seed++) {
        const a = wrongRuleAttempt(topic, seed)!;
        expect(a, `${topic}#${seed}`).not.toBeNull();
        expect(eq(a.attempt, a.task.answer), `${topic}#${seed}`).toBe(false);
        expect(JSON.stringify(a.task.params)).not.toBe(entryParams);
        expect(a.expression).toBe(taskExpression(a.task));
      }
    });
  }
  it("N8/N9: у ошибки есть id заблуждения", () => {
    for (const t of ["N8", "N9"] as const) {
      for (let seed = 0; seed < 100; seed++) expect(wrongRuleAttempt(t, seed)!.misconception).toMatch(/^M\d+/);
    }
  });
});

describe("форма задачи сцены", () => {
  // returns-валидатор convex/teach.ts не допускает лишних полей; distractors и seed не должны покидать генератор.
  it("task содержит только поля SceneTask", () => {
    const fields = ["answer", "id", "kind", "numbersShown", "params", "topic"];
    for (const t of TOPICS) {
      for (const a of [entryAttempt(t)!, wrongRuleAttempt(t, 1)!, solvedAttempt(t, 1)!]) {
        expect(Object.keys(a.task).sort(), t).toEqual(fields);
      }
    }
  });
});
