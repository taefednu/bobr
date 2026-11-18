import { describe, expect, it } from "vitest";
import { fallbackUstoz, postChecksUstoz } from "../lib/llm";
import type { UstozTurn } from "../lib/types";

const ctx = { answer: "5/6", numbersShown: ["1/2", "1/3"], childNumbers: ["2/5"], recent: [] as string[] };
const turn = (reply: string, over: Partial<UstozTurn> = {}): UstozTurn => ({
  reply, intent: "ask", component: null, hintLevel: 1, revealsAnswer: false, ...over,
});

describe("postChecksUstoz", () => {
  it("accepts a Socratic reply quoting the child's 2/5 and the operands", () => {
    const out = turn("Ты получил 2/5, а 1/2 и 1/3 — куски одного размера? Что сделать, чтобы их сложить?", {
      component: { type: "pie", params: [{ key: "a", value: "1/2" }, { key: "b", value: "1/3" }] },
    });
    expect(postChecksUstoz(out, ctx)).toEqual({ ok: true, value: out });
  });
  it("numbers are a SET: repeats of allowed numbers pass (real numbersShown, prompt style example)", () => {
    const real = { answer: "5/6", numbersShown: ["1", "2", "1", "3"], childNumbers: ["2", "5"], recent: [] as string[] };
    const out = turn("Ты получил 2/5 — давай проверим на полоске: 2/5 больше или меньше половины?");
    expect(postChecksUstoz(out, real)).toEqual({ ok: true, value: out });
  });
  it("uz article «bir xil» is not a number word", () => {
    const out = turn("Ikkala boʻlak bir xil kattalikdami?");
    expect(postChecksUstoz(out, ctx)).toEqual({ ok: true, value: out });
  });
  it.each([
    ["ответ 5/6"], ["это 10/12"], ["пять шестых получится"], ["чему равно 5 / 6?"],
  ])("rejects leak: %s", (r) => {
    expect(postChecksUstoz(turn(r), ctx)).toEqual({ ok: false, reason: "leak" });
  });
  it("rejects a number word (uz and ru) and stray digits", () => {
    expect(postChecksUstoz(turn("Natija olti bo'ladi"), { ...ctx, answer: "6", numbersShown: ["4", "2"] })).toEqual({ ok: false, reason: "numbers" });
    expect(postChecksUstoz(turn("Подумай про 7 частей"), ctx)).toEqual({ ok: false, reason: "numbers" });
    expect(postChecksUstoz(turn("Подумай про шесть частей"), { ...ctx, answer: "7/9" })).toEqual({ ok: false, reason: "numbers" });
  });
  it("rejects answer hidden in component params", () => {
    const pair = turn("Смотри на картинку", { component: { type: "pie", params: [{ key: "num", value: "5" }, { key: "den", value: "6" }] } });
    expect(postChecksUstoz(pair, ctx)).toEqual({ ok: false, reason: "leak" });
    const whole = turn("Смотри", { component: { type: "strip", params: [{ key: "f", value: "10/12" }] } });
    expect(postChecksUstoz(whole, ctx)).toEqual({ ok: false, reason: "leak" });
  });
  it("rejects revealsAnswer and repeats", () => {
    expect(postChecksUstoz(turn("Сложи куски", { revealsAnswer: true }), ctx)).toEqual({ ok: false, reason: "reveals_answer" });
    const line = "Как ты думаешь, одинаковые ли куски у половины и трети?";
    expect(postChecksUstoz(turn(line), { ...ctx, recent: [line] })).toEqual({ ok: false, reason: "repeat" });
  });
});

describe("postChecksUstoz: списки в params компонента", () => {
  // Живой прогон 18.11: Ustoz кладёт в params «2,3» и «1/2,1/3» — это списки, не десятичные 2.3 и 2.1.
  const ctx = { answer: "5/6", numbersShown: ["1", "2", "1", "3"], childNumbers: ["2/5"], recent: [] };
  const reply = "Javobni masalaning oʻzi tekshiradi, men emas. Keling, tasmada 1/2 va 1/3 ni yonma-yon qoʻyib koʻramiz: ularning boʻlaklari bir xil kattalikdami?";
  const turn = (params: { key: string; value: string }[]) =>
    postChecksUstoz({ reply, intent: "hint", component: { type: "strip", params }, hintLevel: 0, revealsAnswer: false }, ctx);

  it("список операндов через запятую проходит", () => {
    expect(turn([{ key: "fractions", value: "1/2,1/3" }, { key: "parts", value: "2,3" }]).ok).toBe(true);
    expect(turn([{ key: "parts", value: "2, 3" }, { key: "shaded", value: "1;1" }]).ok).toBe(true);
  });

  it("ответ в списке всё равно ловится", () => {
    expect(turn([{ key: "fractions", value: "1/2,5/6" }]).ok).toBe(false);
    expect(turn([{ key: "parts", value: "6,6" }, { key: "shaded", value: "5" }]).ok).toBe(false);
  });
});

describe("fallbackUstoz", () => {
  it("null reply, pie of the operands, hint button", () => {
    expect(fallbackUstoz({ numbersShown: ["1/2", "1/3"] })).toEqual({
      reply: null, hintButton: true,
      component: { type: "pie", params: [{ key: "f1", value: "1/2" }, { key: "f2", value: "1/3" }] },
    });
  });
});
