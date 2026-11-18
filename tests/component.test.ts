import { describe, expect, it } from "vitest";
import { normalizeComponent, postUstoz, toStored } from "../lib/llm";
import type { UstozTurn } from "../lib/types";

// Демо-задача N9: 1/2 + 1/3, ответ 5/6, ребёнок написал 2/5.
const ctx = { operands: ["1/2", "1/3"], childFractions: ["2/5"], answer: "5/6" };
const pie = (fractions: string[], type: "pie" | "strip" | "line" = "pie") => ({ type, fractions });

describe("normalizeComponent", () => {
  it.each([
    [pie(["1/2", "1/3"])], [pie(["1/2"], "strip")], [pie(["1/3", "1/2"], "line")], [pie(["2/5"])],
  ])("valid %j passes as is", (c) => {
    expect(normalizeComponent(c, ctx)).toEqual({ component: c, from: "model" });
  });

  it.each([
    ["invented fraction", pie(["7/8"])],
    ["answer 5/6", pie(["1/2", "5/6"])],
    ["equivalent 10/12", pie(["10/12"], "strip")],
    ["denominator 13", pie(["1/13"])],
    ["not a fraction", pie(["a", "b"])],
    ["empty", pie([])],
    ["improper for strip", pie(["3/2"], "strip")],
  ])("%s -> code-built from operands, same type", (_n, c) => {
    expect(normalizeComponent(c, ctx)).toEqual({ component: { type: c.type, fractions: ["1/2", "1/3"] }, from: "code" });
  });

  it("more than 3 distinct allowed fractions -> code-built", () => {
    const c4 = { ...ctx, childFractions: ["2/5", "1/4"] };
    expect(normalizeComponent(pie(["1/2", "1/3", "2/5", "1/4"]), c4).from).toBe("code");
  });

  it("null -> pie of operands", () => {
    expect(normalizeComponent(null, ctx)).toEqual({ component: pie(["1/2", "1/3"]), from: "code" });
  });

  it("child's own fraction equal to the answer is rejected", () => {
    expect(normalizeComponent(pie(["10/12"]), { ...ctx, childFractions: ["10/12"] }).from).toBe("code");
  });

  it("toStored keeps the DB shape", () => {
    expect(toStored(pie(["1/2", "1/3"], "line"))).toEqual({ type: "line", params: [{ key: "f1", value: "1/2" }, { key: "f2", value: "1/3" }] });
    expect(toStored(pie([]))).toBeNull();
  });
});

describe("10 turns in a row, a picture always draws", () => {
  const post = { answer: "5/6", numbersShown: ["1", "2", "1", "3"], childNumbers: ["2/5"], recent: [] as string[], operands: ["1/2", "1/3"], childFractions: ["2/5"] };
  const out = (component: unknown): UstozTurn =>
    ({ reply: "Смотри на 1/2 и 1/3: куски одного размера?", intent: "ask", component, hintLevel: 1, revealsAnswer: false }) as UstozTurn;
  const outputs = [
    pie(["1/2", "1/3"]), pie(["1/2"], "strip"), pie(["1/3"], "line"), null,
    { type: "pie", fractions: ["5/6"] }, { type: "strip", fractions: ["10/12", "1/2"] },
    { type: "line", fractions: ["1/13"] }, { type: "pie", fractions: ["1/2", "1/3", "2/5", "1/4"] },
    { type: "pie", fractions: [] }, pie(["2/5"]),
  ];

  it.each(outputs.map((c, i) => [i, c]))("turn %i", (_i, c) => {
    const { result } = postUstoz(out(c), post);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const stored = toStored(result.value.component!);
    expect(stored).not.toBeNull();
    expect(["pie", "strip", "line"]).toContain(stored!.type);
    expect(stored!.params.length).toBeGreaterThanOrEqual(1);
    expect(stored!.params.length).toBeLessThanOrEqual(3);
    for (const p of stored!.params) expect(["1/2", "1/3", "2/5"]).toContain(p.value);
  });
});
