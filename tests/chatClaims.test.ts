import { describe, expect, it } from "vitest";
import { openAnswers, scanMath } from "../lib/chat/claims";
import { postChecksChat } from "../lib/chat/postChecks";
import { chatLine } from "../lib/chat/fallback";
import { chatTail } from "../lib/llm/prompts/chat";

const ok = (t: string) => scanMath(t).claims.map((c) => c.ok);

describe("scanMath claims", () => {
  it("true and false for + - * / :", () => {
    expect(ok("1/2 + 1/3 = 5/6")).toEqual([true]);
    expect(ok("1/2 + 1/3 = 2/5")).toEqual([false]);
    expect(ok("1/2 - 1/3 = 1/6")).toEqual([true]);
    expect(ok("1/3 - 1/2 = -1/6")).toEqual([true]);
    expect(ok("3/4 * 2/5 = 3/10")).toEqual([true]);
    expect(ok("3/4 × 2/5 = 6/9")).toEqual([false]);
    expect(ok("1/2 : 1/4 = 2")).toEqual([true]);
    expect(ok("1/2 / 1/4 = 3")).toEqual([false]);
    expect(ok("2 + 3 = 5")).toEqual([true]);
  });
  it("equivalence, equal forms of the result", () => {
    expect(ok("1/2 = 3/6")).toEqual([true]);
    expect(ok("1/2 = 2/5")).toEqual([false]);
    expect(ok("1/2 + 1/3 = 10/12")).toEqual([true]);
    expect(ok("1/2 + 1/3 = 5/6 и 1/2 = 3/6")).toEqual([true, true]);
  });
  it("mixed ru/uz text", () => {
    expect(ok("Я думаю, что 1/2 + 1/3 = 2/5, да?")).toEqual([false]);
    expect(ok("Menimcha 1/2 + 1/3 = 5/6 boʻladi")).toEqual([true]);
    expect(ok("Верно: 3/4 × 2/5 = 3/10.")).toEqual([true]);
  });
  it("no floats: huge and repeating values stay exact", () => {
    expect(ok("1/3 + 1/3 + 1/3 = 1")).toEqual([]); // цепочки не разбираем
    expect(ok("1/3 + 1/3 = 2/3")).toEqual([true]);
    expect(ok("1/10 + 2/10 = 3/10")).toEqual([true]);
    expect(ok("999999/1 * 999999/1 = 999998000001/1")).toEqual([]); // 12 цифр — вне формата, не считаем
    expect(ok("999999/7 * 7/999999 = 1")).toEqual([true]);
  });
  it("division by zero and malformed are skipped, not thrown", () => {
    for (const t of ["1/0 + 1/2 = 3/2", "1/2 : 0 = 5", "1/2 / 0/3 = 1", "1/0 = 2/4", "1/2 + = 3", "= 1/2", "1/2 +", "", "10-12 лет", "в 10:30 = обед", "1/2 + 1/3 = "])
      expect(() => scanMath(t)).not.toThrow();
    expect(ok("1/0 + 1/2 = 3/2")).toEqual([]);
    expect(ok("1/2 : 0 = 5")).toEqual([]);
    expect(ok("1/0 = 2/4")).toEqual([]);
    expect(ok("10-12 лет")).toEqual([]);
    expect(ok("10:30 = 3")).toEqual([]);
  });
  it("unsolved expressions are open with exact value and operands", () => {
    expect(scanMath("сколько будет 3/4 * 2/5?").open).toEqual([{ expr: "3/4*2/5", value: "3/10", operands: ["3/4", "2/5"] }]);
    expect(scanMath("3/4 × 2/5 = ?").open[0].value).toBe("3/10");
    expect(scanMath("1/2 + 1/3 = 5/6").open).toEqual([]);
  });
  it("a later correct claim of the child closes the open expression", () => {
    expect(openAnswers(["3/4 * 2/5 = ?"])).toEqual([{ answer: "3/10", numbersShown: ["3/4", "2/5"] }]);
    expect(openAnswers(["3/4 * 2/5 = ?", "наверное 3/4 * 2/5 = 3/10"])).toEqual([]);
    expect(openAnswers(["3/4 * 2/5 = ?", "наверное 3/4 * 2/5 = 6/9"])).toHaveLength(1);
  });
});

const turn = (reply: string) => ({ reply, pose: "happy" as const });
const base = { lang: "ru" as const, task: null, childNumbers: [], recent: [] };
const ustoz = { ...base, who: "ustoz" as const };

describe("ustoz postChecks", () => {
  it("false claim in the reply fails (claim), true claim passes; Bobr is untouched", () => {
    expect(postChecksChat(turn("Смотри: 1/2 + 1/3 = 2/5, понятно?"), ustoz)).toEqual({ ok: false, reason: "claim" });
    expect(postChecksChat(turn("Смотри: 1/2 = 3/7"), ustoz)).toEqual({ ok: false, reason: "claim" });
    expect(postChecksChat(turn("Смотри: 1/2 + 1/4 = 3/4, а теперь ты."), ustoz).ok).toBe(true);
    expect(postChecksChat(turn("Смотри: 1/2 + 1/3 = 2/5, понятно?"), { ...base, who: "bobr" }).ok).toBe(true);
  });
  it("reply restating the child's true claim is fine", () => {
    const open = openAnswers(["1/2 + 1/3 = 5/6"]);
    expect(postChecksChat(turn("Верно: 1/2 + 1/3 = 5/6. Как ты это получил?"), { ...ustoz, open }).ok).toBe(true);
  });
  it("leak: value or equal form of the child's unsolved expression fails, operands and other numbers pass", () => {
    const open = openAnswers(["сколько будет 3/4 * 2/5?"]);
    const c = { ...ustoz, open, childNumbers: ["3/4", "2/5"] };
    for (const bad of ["Получится 3/10.", "Вот: 3/4 × 2/5 = 3/10", "это 6/20", "ответ 0,3", "три десятых"])
      expect(postChecksChat(turn(bad), c)).toEqual({ ok: false, reason: "leak" });
    expect(postChecksChat(turn("Давай сначала: что делаем с числителями 3 и 2? А со знаменателями 4 и 5?"), c).ok).toBe(true);
    expect(postChecksChat(turn("На примере 1/2 * 1/3 = 1/6 видно приём. Попробуй свой."), c).ok).toBe(true);
    expect(postChecksChat(turn("Получится 3/10."), { ...ustoz, open: [] }).ok).toBe(true); // без выражения ребёнка нечего скрывать
  });
  it("lesson task: answer still leaks, but other numbers are allowed for Ustoz only", () => {
    const task = { answer: "5/6", numbersShown: ["1/2", "1/3"] };
    expect(postChecksChat(turn("Там 5/6"), { ...ustoz, task })).toEqual({ ok: false, reason: "leak" });
    expect(postChecksChat(turn("Представь 4 яблока и 7 груш."), { ...ustoz, task }).ok).toBe(true);
    expect(postChecksChat(turn("Представь 4 яблока и 7 груш."), { ...base, task })).toEqual({ ok: false, reason: "numbers" });
  });
  it("fallback for Ustoz asks a question, never 'my head is a mess'", () => {
    for (const lang of ["ru", "uz"] as const) for (const seed of [0, 1]) expect(chatLine("ustoz", lang, "fallback", seed)).toContain("?");
  });
});

describe("tutor tail", () => {
  it("code_check carries true/false only, no result value, fenced; 12 lines kept for Ustoz", () => {
    const hist = Array.from({ length: 14 }, (_, i) => ({ role: "child" as const, text: `m${i}` }));
    const claims = scanMath("1/2 + 1/3 = 2/5").claims;
    const t = chatTail({ lang: "ru", history: hist, forbiddenLines: [], childInput: "1/2 + 1/3 = 2/5", keep: 12, codeCheck: claims });
    expect(t).toContain("<code_check>\n1/2 + 1/3 = 2/5: false\n</code_check>");
    expect(t).not.toContain("5/6");
    expect(t).toContain("m2");
    expect(t).not.toContain("m1<");
    expect(chatTail({ lang: "ru", history: hist, forbiddenLines: [], childInput: "x" })).not.toContain("code_check");
  });
});
