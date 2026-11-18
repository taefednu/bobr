import { describe, expect, it } from "vitest";
import { trigramJaccard } from "../lib/text/similarity";

describe("trigramJaccard", () => {
  it("1 для одинаковых, 0 для пустых, без NaN", () => {
    expect(trigramJaccard("Привет, мир!", "привет мир")).toBe(1);
    expect(trigramJaccard("", "")).toBe(0);
    expect(trigramJaccard("abc", "")).toBe(0);
  });
  it("суффиксы узбекского дают высокое, но не 1", () => {
    const s = trigramJaccard("oltita", "olti");
    expect(s).toBeGreaterThan(0.3);
    expect(s).toBeLessThan(1);
  });
});
