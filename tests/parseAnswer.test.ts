import { describe, expect, it } from "vitest";
import { checkAnswer, parseFraction } from "../lib/fractions/parseAnswer";

const half = { answer: "1/2", distractors: [], requireReduced: true };
const val = (s: string) => {
  const r = parseFraction(s);
  return r.ok ? r.value : r;
};

describe("checkAnswer", () => {
  it("distractor with id → misconception (demo M9)", () => {
    const t = { answer: "5/6", distractors: [{ value: "2/5", misconception: "M9" }], requireReduced: true };
    expect(checkAnswer("2/5", t)).toEqual({ status: "misconception", value: "2/5", misconception: "M9" });
    expect(checkAnswer("5/6", t).status).toBe("ok");
    expect(checkAnswer("1/3", t).status).toBe("wrong");
  });
  it("distractor without id → wrong", () => {
    expect(checkAnswer("1/3", { ...half, distractors: [{ value: "1/3" }] }).status).toBe("wrong");
  });
  it("word forms = 1/2, any case", () => {
    for (const w of ["yarim", "Yarim", "YARIM", "половина", "Половина", "пол"]) {
      expect(checkAnswer(w, half).status, w).toBe("ok");
    }
    expect(parseFraction("yarimta").ok).toBe(false);
  });
  it("comma decimal: 0,5 → ok (right value, not 'almost')", () => {
    expect(checkAnswer("0,5", half).status).toBe("ok");
    expect(checkAnswer("0.5", half).status).toBe("ok");
  });
  it("unreduced → almost only when requireReduced", () => {
    expect(checkAnswer("2/4", half).status).toBe("almost");
    expect(checkAnswer("2/4", { ...half, requireReduced: false }).status).toBe("ok");
    expect(checkAnswer("1/2", half).status).toBe("ok");
  });
  it("½, 1½, 1+1/2 vs 3/2", () => {
    const t = { answer: "3/2", distractors: [], requireReduced: true };
    expect(checkAnswer("½", half).status).toBe("ok");
    expect(checkAnswer("1½", t).status).toBe("ok");
    expect(checkAnswer("1+1/2", t).status).toBe("ok");
    expect(checkAnswer("1 1/2", t).status).toBe("ok");
    expect(checkAnswer("1 yarim", t).status).toBe("ok");
  });
  it("unparsed carries reason", () => {
    expect(checkAnswer("1/0", half)).toEqual({ status: "unparsed", reason: "div_by_zero" });
    expect(checkAnswer("abc", half)).toEqual({ status: "unparsed", reason: "invalid" });
    expect(checkAnswer("  ", half)).toEqual({ status: "unparsed", reason: "empty" });
    expect(checkAnswer("1/2".repeat(200), half)).toEqual({ status: "unparsed", reason: "too_long" });
  });
});

describe("parseFraction", () => {
  it("canonical values and reducible flag", () => {
    expect(parseFraction("2/4")).toEqual({ ok: true, value: "1/2", reducible: true });
    expect(parseFraction("1/2")).toEqual({ ok: true, value: "1/2", reducible: false });
    expect(parseFraction("6")).toEqual({ ok: true, value: "6", reducible: false });
    expect(parseFraction("1 2/4")).toEqual({ ok: true, value: "3/2", reducible: true });
    expect(parseFraction("1 / 2")).toEqual({ ok: true, value: "1/2", reducible: false });
  });
  it("zero-width inside is stripped", () => {
    const raw = "2​/5";
    expect(raw).not.toBe("2/5");
    expect(val(raw)).toBe("2/5");
  });
  it("full-width digits and slash", () => {
    const raw = "２／５";
    expect(raw).not.toBe("2/5");
    expect(val(raw)).toBe("2/5");
  });
  it("garbage and negatives rejected", () => {
    for (const s of ["abc", "1/2/3", "-1/2", "1/2abc", "1..2"]) expect(parseFraction(s).ok, s).toBe(false);
  });
});
