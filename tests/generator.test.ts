import { describe, expect, it } from "vitest";
import Fraction from "fraction.js";
import { DEMO_PROBES, generateTask, mcqOptions, type GenKind } from "../lib/fractions/generator";
import { checkAnswer } from "../lib/fractions/parseAnswer";
import type { TopicId } from "../lib/types";

const TOPICS: TopicId[] = ["N2", "N3", "N4", "N5", "N6", "N8", "N9"];
const KINDS: GenKind[] = ["picture", "word", "missing"];
const SEEDS = 1000;
const eq = (a: string, b: string) => new Fraction(a).equals(new Fraction(b));

describe("generateTask: свойства", () => {
  for (const topic of TOPICS) {
    for (const kind of KINDS) {
      it(`${topic}/${kind}: ${SEEDS} seed`, () => {
        for (let seed = 0; seed < SEEDS; seed++) {
          const t = generateTask(topic, kind, seed);
          expect(t).toEqual(generateTask(topic, kind, seed)); // детерминизм
          expect(t.kind).toBe(kind);
          // дистракторы: ≥2, различны, ≠ ответу
          expect(t.distractors.length).toBeGreaterThanOrEqual(2);
          const vals = t.distractors.map((d) => d.value);
          for (let i = 0; i < vals.length; i++) {
            expect(eq(vals[i], t.answer)).toBe(false);
            for (let j = i + 1; j < vals.length; j++) expect(eq(vals[i], vals[j])).toBe(false);
          }
          // сериализация: JSON-круг без потерь, только строки (Fraction/BigInt не просочились)
          expect(JSON.parse(JSON.stringify(t))).toEqual(t);
          for (const x of [...Object.values(t.params), t.answer, ...vals, ...t.numbersShown]) expect(typeof x).toBe("string");
          // ответ несократим (строка = toFraction)
          expect(t.answer).toBe(new Fraction(t.answer).toFraction());
          // знаменатели операндов 2–12
          for (const k of topic === "N9" ? ["b", "d"] : ["den", "b", "d", "toDen", "p", "q"]) { // N9 missing: toDen = НОК, может быть >12
            if (t.params[k]) expect(+t.params[k]).toBeGreaterThanOrEqual(2), expect(+t.params[k]).toBeLessThanOrEqual(12);
          }
          if (topic === "N6") expect(t.requireReduced).toBe(false);
          else if (topic !== "N5" && kind !== "missing") expect(t.requireReduced).toBe(true);
          if (kind === "missing" && t.params.toDen) {
            // контракт: числитель над toDen или любая равная полная дробь — верно
            expect(checkAnswer(t.answer, t).status).toBe("ok");
            expect(checkAnswer(`${t.answer}/${t.params.toDen}`, t).status).toBe("ok");
            expect(t.requireReduced).toBe(false);
            for (const d of t.distractors) expect(d.value).toMatch(/^\d+$/);
            const m9 = t.distractors.find((d) => d.misconception === "M9");
            if (topic === "N9" && m9) expect(+t.params.b + +t.params.d).toBe(+t.params.toDen);
            expect(topic === "N8" ? m9 : undefined).toBeUndefined();
          } else if (topic === "N8" || topic === "N9") {
            const m9 = t.distractors.filter((d) => d.misconception === "M9");
            const { a, c } = t.params;
            const den = topic === "N8" ? `${2 * +t.params.den}` : `${+t.params.b + +t.params.d}`;
            const expected = new Fraction(`${+a + +c}/${den}`);
            if (expected.equals(new Fraction(t.answer))) expect(m9).toHaveLength(0);
            else expect(m9.map((d) => d.value)).toEqual([expected.toFraction()]);
          }
          expect(t.distractors.filter((d) => d.misconception && d.misconception !== "M9")).toHaveLength(0);
        }
      });
    }
  }

  it("разные seed дают разные задачи", () => {
    const ids = new Set(Array.from({ length: 50 }, (_, s) => JSON.stringify(generateTask("N9", "word", s).params)));
    expect(ids.size).toBeGreaterThan(10);
  });

  it("numbersShown: 1/2 + 1/3", () => {
    expect(DEMO_PROBES[0].numbersShown).toEqual(["1", "2", "1", "3"]);
  });

  it("missing: N8 seed 3 (1/10 + 4/10 = ?/10) — 5 и 5/10 верно, 1/2 тоже", () => {
    const t = generateTask("N8", "missing", 3);
    expect(checkAnswer(t.answer, t).status).toBe("ok");
    expect(checkAnswer("1/2", t).status).toBe("ok");
  });

  it("N5 1/2 = ?/6: 3/6 верно", () => {
    const t = generateTask("N5", "missing", 1);
    expect(checkAnswer(`${t.answer}/${t.params.toDen}`, t).status).toBe("ok");
  });

  it("N4: больше та единичная дробь, у которой знаменатель меньше; missing — этот знаменатель", () => {
    for (let seed = 0; seed < 200; seed++) {
      const { p, q } = generateTask("N4", "word", seed).params;
      expect(p).not.toBe(q);
      expect(generateTask("N4", "word", seed).answer).toBe(`1/${Math.min(+p, +q)}`);
      expect(generateTask("N4", "picture", seed).answer).toBe(`1/${Math.min(+p, +q)}`);
      const m = generateTask("N4", "missing", seed);
      expect(m.answer).toBe(String(Math.min(+m.params.p, +m.params.q)));
      expect(checkAnswer(m.answer, m).status).toBe("ok");
    }
  });

  it("N3: k/n несократима, точка внутри отрезка 0..1", () => {
    for (let seed = 0; seed < 200; seed++) {
      const t = generateTask("N3", "word", seed);
      expect(+t.params.num).toBeLessThan(+t.params.den);
      expect(t.answer).toBe(`${t.params.num}/${t.params.den}`);
    }
  });

  it("неподдержанная тема — понятная ошибка", () => {
    expect(() => generateTask("N7", "word", 1)).toThrow("generator: topic N7 not supported yet");
  });
});

describe("DEMO_PROBES", () => {
  it("сериализация: JSON-круг, только строки", () => {
    for (const p of DEMO_PROBES) {
      expect(JSON.parse(JSON.stringify(p))).toEqual(p);
      for (const x of [...Object.values(p.params), p.answer, ...p.distractors.map((d) => d.value), ...p.numbersShown])
        expect(typeof x).toBe("string");
    }
  });
  it("порядок и kind", () => {
    expect(DEMO_PROBES.map((p) => p.topic)).toEqual(["N9", "N8", "N2", "N5", "N6"]); // N1 — TODO
    expect(DEMO_PROBES.every((p) => p.kind === "mcq")).toBe(true);
  });
  it("N9: 1/2 + 1/3 = 5/6, M9 → 2/5", () => {
    const p = DEMO_PROBES[0];
    expect(p.answer).toBe("5/6");
    expect(p.distractors[0]).toEqual({ value: "2/5", misconception: "M9" });
  });
  it("N8: 1/5 + 2/5 = 3/5, M9 → 3/10", () => {
    const p = DEMO_PROBES[1];
    expect(p.answer).toBe("3/5");
    expect(p.distractors[0]).toEqual({ value: "3/10", misconception: "M9" });
  });
  it("N5: 1/2 = ?/6 → 3; N6: НОК(2,3) → 6", () => {
    expect(DEMO_PROBES[3].answer).toBe("3");
    expect(DEMO_PROBES[4].answer).toBe("6");
  });
  it("варианты MCQ: ответ + дистракторы, детерминированно", () => {
    for (const p of DEMO_PROBES) {
      expect(mcqOptions(p).sort()).toEqual([p.answer, ...p.distractors.map((d) => d.value)].sort());
      expect(mcqOptions(p)).toEqual(mcqOptions(p));
    }
  });
});
