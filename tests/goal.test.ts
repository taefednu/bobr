import { describe, expect, it } from "vitest";
import { normalizeGoal } from "../lib/planner";

const today = "2026-11-18";

describe("normalizeGoal", () => {
  it("test_soon keeps a valid date (today and later)", () => {
    expect(normalizeGoal({ goal: "test_soon", testDate: "2026-11-18", today })).toEqual({ goal: "test_soon", testDate: "2026-11-18" });
    expect(normalizeGoal({ goal: "test_soon", testDate: "2027-01-05", today }).testDate).toBe("2027-01-05");
  });
  it.each(["improve", "just_practice"] as const)("%s drops the date", (goal) => {
    expect(normalizeGoal({ goal, testDate: "2026-12-01", today })).toEqual({ goal, testDate: undefined });
  });
  it("test_soon without a date is fine", () => {
    expect(normalizeGoal({ goal: "test_soon", today })).toEqual({ goal: "test_soon", testDate: undefined });
  });
  it.each(["18.11.2026", "2026-1-5", "2026-02-31", "2026-13-01", "2026-11-17", "soon"])("bad date %s throws", (d) => {
    expect(() => normalizeGoal({ goal: "test_soon", testDate: d, today })).toThrow("bad testDate");
  });
});
