import { describe, expect, it } from "vitest";
import { approvedHints, hintSelectionTail, renderHint, safeAnalogy, HINT_CATALOG, HINT_CATALOG_VERSION, type HintTemplate, type HintContext } from "../lib/socratic/hints";

const context: HintContext = {
  lang: "uz", escalationLevel: 2, misconceptionTag: "added_denominators", interestTheme: "Minecraft",
  task: { topic: "N9", kind: "word", params: { a: "1", b: "2", c: "1", d: "3" }, numbersShown: ["1/2", "1/3"] },
};
const reviewed: HintTemplate = {
  id: "test-reviewed", escalationLevel: 2, misconceptionTag: "added_denominators", interestTheme: "Minecraft",
  review: { uz: "reviewed", ru: "draft" },
  text: { uz: "{theme}: {operand1} va {operand2} boʻlaklari bir xilmi?", ru: "{theme}: сравни {operand1} и {operand2}." },
  visual: "strip",
};

describe("reviewed Socratic hint selection", () => {
  it("rejects an analogous example with an operand or result equivalent to the private answer", () => {
    expect(safeAnalogy(["1/4", "1/4"], "2/8")).toBe(false);
    expect(safeAnalogy(["1/4", "1/4"], "2/4")).toBe(false);
    expect(safeAnalogy(["1/4", "1/4"], "5/6")).toBe(true);
  });
  it("ships no draft as reviewed; locale, level, theme and misconception must match", () => {
    expect(HINT_CATALOG_VERSION).toBeTruthy();
    expect(approvedHints(context)).toEqual([]);
    expect(HINT_CATALOG).toHaveLength(4);
    expect(approvedHints(context, [reviewed])).toEqual([reviewed]);
    expect(approvedHints(context, [{ ...reviewed, topics: ["N8"] }])).toEqual([]);
    for (const patch of [{ lang: "ru" }, { escalationLevel: 3 }, { interestTheme: "Football" }, { misconceptionTag: null }]) {
      expect(approvedHints({ ...context, ...patch } as HintContext, [reviewed])).toEqual([]);
    }
  });

  it("projects only numeric public context into selector, never secrets or child text", () => {
    const malicious = { ...context, childInput: "my name", answerKey: "5/6", referenceSteps: ["secret"],
      task: { ...context.task, answer: "5/6", params: { ...context.task.params, answerKey: "5/6", referenceSteps: "secret", school: "secret" } } };
    const tail = hintSelectionTail(malicious, [reviewed]);
    expect(tail).toContain("Minecraft");
    expect(tail).toContain("added_denominators");
    expect(tail).toContain("test-reviewed");
    for (const forbidden of ["5/6", "answerKey", "referenceSteps", "childInput", "school", "secret", "my name"]) expect(tail).not.toContain(forbidden);
  });

  it("rejects model-selected unknown IDs, wrong-level IDs and injected answer parameters", () => {
    expect(renderHint("invented", context, [reviewed])).toBeNull();
    expect(renderHint(reviewed.id, { ...context, escalationLevel: 4 }, [reviewed])).toBeNull();
    const rendered = renderHint(reviewed.id, context, [reviewed]);
    expect(rendered?.reply).toContain("1/2");
    expect(rendered?.component).toEqual({ type: "strip", fractions: ["1/2", "1/3"] });
    expect(renderHint(reviewed.id, context, [{ ...reviewed, text: { ...reviewed.text, uz: "{answerKey}" } }])).toBeNull();
  });

  it("analogous examples contain operands only and do not replace the graded task", () => {
    const example = { ...reviewed, escalationLevel: 3 as const, visual: "pie" as const,
      text: { uz: "{example1} va {example2} uchun bir xil qadamni sinab koʻr.", ru: "Сравни {example1} и {example2}." } };
    const rendered = renderHint(example.id, { ...context, escalationLevel: 3 }, [example]);
    expect(rendered?.component?.fractions).toEqual(["1/4", "1/4"]);
    expect(rendered?.numbersShown).toEqual(["1/2", "1/3", "1/4"]);
    expect(context.task.params).toEqual({ a: "1", b: "2", c: "1", d: "3" });
    expect(rendered?.reply).not.toContain("=");
  });
});
