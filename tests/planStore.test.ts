import { describe, expect, it } from "vitest";
import { dayItems, toStoredDays, usableTestDate } from "../convex/plan";
import type { Plan } from "../lib/planner";

describe("plan store mapping", () => {
  it("round trip: new + review + mixed_check в одном дне", () => {
    const plan: Plan = {
      order: ["N8", "N6"],
      days: [{ date: "2026-12-01", items: [
        { topic: "N8", kind: "new" }, { topic: "N6", kind: "new" },
        { topic: "N5", kind: "review" }, { topic: "N9", kind: "mixed_check" },
      ] }],
    };
    const stored = toStoredDays(plan);
    expect(stored).toEqual([{ date: "2026-12-01", newTopics: ["N8", "N6"], reviewTopics: ["N5"], mixedCheck: true }]);
    expect(dayItems(stored[0])).toEqual(plan.days[0].items);
  });

  it("прошедшая и кривая testDate не доходят до buildPlan", () => {
    expect(usableTestDate("2026-11-01", "2026-11-18")).toBeUndefined();
    expect(usableTestDate("завтра", "2026-11-18")).toBeUndefined();
    expect(usableTestDate("2026-13-45", "2026-11-18")).toBeUndefined();
    expect(usableTestDate("2026-11-18", "2026-11-18")).toBe("2026-11-18");
    expect(usableTestDate(undefined, "2026-11-18")).toBeUndefined();
  });
});
