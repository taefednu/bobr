import { describe, expect, it } from "vitest";
import ru from "../i18n/ru.json";
import uz from "../i18n/uz.json";
import { detectLeak } from "../lib/fractions/leakDetector";

const keys = (o: Record<string, string>) => Object.keys(o).filter((k) => k !== "_todo").sort();

describe("i18n", () => {
  it("uz and ru have identical key sets, no empty values", () => {
    expect(keys(uz)).toEqual(keys(ru));
    for (const o of [uz, ru] as Record<string, string>[])
      for (const k of keys(o)) expect(o[k].trim(), k).not.toBe("");
  });

  // Лесенка подсказок идёт из кода мимо postChecks: в тексте не должно быть ни цифр, ни слов-дробей, ни ответа.
  it("code hint ladder strings leak no answer or digit", () => {
    for (const [lang, o] of [["uz", uz], ["ru", ru]] as const) {
      const steps = Object.entries(o).filter(([k]) => k.startsWith("lesson.hintStep."));
      expect(steps.length, lang).toBeGreaterThanOrEqual(4);
      for (const [k, text] of steps) {
        expect(text, k).not.toMatch(/\d/);
        for (const answer of ["5/6", "1/2", "3", "6"]) expect(detectLeak(text, answer), `${k} vs ${answer}`).toEqual({ leaked: false });
      }
    }
  });
});
