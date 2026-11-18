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

describe("fallbackUstoz", () => {
  it("null reply, pie of the operands, hint button", () => {
    expect(fallbackUstoz({ numbersShown: ["1/2", "1/3"] })).toEqual({
      reply: null, hintButton: true,
      component: { type: "pie", params: [{ key: "f1", value: "1/2" }, { key: "f2", value: "1/3" }] },
    });
  });
});
