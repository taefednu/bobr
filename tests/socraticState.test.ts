import { describe, expect, it } from "vitest";
import { escalate, misconceptionTag, independentResult, isExplicitHelpRequest } from "../lib/socratic/state";

describe("deterministic Socratic state", () => {
  it("recognizes standalone help requests in both languages without treating arbitrary text as help", () => {
    expect(isExplicitHelpRequest("Дай подсказку, пожалуйста!", "ru")).toBe(true);
    expect(isExplicitHelpRequest("Yordam ber, iltimos!", "uz")).toBe(true);
    expect(isExplicitHelpRequest("Мама попросила помочь", "ru")).toBe(false);
    expect(isExplicitHelpRequest("Помоги, мне плохо", "ru")).toBe(false);
  });
  it("every wrong/help increments and caps only the level", () => {
    let state = { attemptCount: 0, escalationLevel: 1 as 1 | 2 | 3 | 4 };
    for (let i = 1; i <= 8; i++) {
      state = escalate(state);
      expect(state.attemptCount).toBe(i);
      expect(state.escalationLevel).toBe(Math.min(4, i + 1));
    }
  });
  it("only a never-assisted task is independent and tags are evidence-based", () => {
    expect(independentResult({ attemptCount: 0, escalationLevel: 1 })).toBe(true);
    expect(independentResult({ attemptCount: 1, escalationLevel: 2 })).toBe(false);
    expect(misconceptionTag("M9")).toBe("added_denominators");
    expect(misconceptionTag("unknown")).toBeNull();
  });
});
