import { describe, expect, it } from "vitest";
import { BUBBLE_DELAY_S, TYPING, typingSeconds } from "../lib/motion";

describe("typingSeconds", () => {
  it("one word: bubble delay plus fade", () => {
    expect(typingSeconds("Привет")).toBeCloseTo(BUBBLE_DELAY_S + TYPING.wordFadeS);
  });
  it("long reply fits maxS plus delay and fade", () => {
    const long = Array.from({ length: 80 }, (_, i) => `w${i}`).join(" ");
    expect(typingSeconds(long)).toBeLessThanOrEqual(BUBBLE_DELAY_S + TYPING.maxS + TYPING.wordFadeS);
  });
  it("empty is zero", () => expect(typingSeconds("  ")).toBe(0));
});
