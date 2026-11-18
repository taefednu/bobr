import { describe, expect, it } from "vitest";
import { graph } from "../lib/content";
import { buildPlan } from "../lib/planner/planner";
import type { TopicId, TopicLevel } from "../lib/types";

const D = 86_400_000;
const today = "2026-11-18";
const now = Date.parse(today);
const demo: Partial<Record<TopicId, { level: TopicLevel; taughtAt?: number }>> = {
  N9: { level: "gap" }, N8: { level: "gap" }, N5: { level: "gap" }, N6: { level: "gap" },
  N2: { level: "solved_self" }, N1: { level: "solved_self" },
};
const plan = (o: Partial<Parameters<typeof buildPlan>[0]> = {}) =>
  buildPlan({ graph, statuses: demo, targets: ["N9"], today, now, ...o });

describe("planner", () => {
  it("spec demo: N8 → N6 → N5 → N9 (N3/N4 unprobed, not added)", () => {
    expect(plan().order).toEqual(["N8", "N6", "N5", "N9"]);
  });
  it("<=2 new topics per day, no testDate: days until done", () => {
    const p = plan();
    expect(p.days.map((d) => d.items.filter((i) => i.kind === "new").map((i) => i.topic))).toEqual([
      ["N8", "N6"], ["N5", "N9"],
    ]);
    expect(p.days.map((d) => d.date)).toEqual(["2026-11-18", "2026-11-19"]);
  });
  it("review slot for taught_bobr >= 7 days old, not for fresh", () => {
    const statuses = { ...demo, N2: { level: "taught_bobr" as const, taughtAt: now - 7 * D }, N1: { level: "taught_bobr" as const, taughtAt: now - 2 * D } };
    const items = plan({ statuses }).days.flatMap((d) => d.items);
    expect(items.filter((i) => i.kind === "review")).toEqual([{ topic: "N2", kind: "review" }]);
  });
  it("mixed_check the day before testDate; days extend to it", () => {
    const p = plan({ testDate: "2026-11-22" });
    expect(p.days.at(-1)).toEqual({ date: "2026-11-21", items: [{ topic: "N9", kind: "mixed_check" }] });
    expect(p.days.flatMap((d) => d.items).filter((i) => i.kind === "mixed_check")).toHaveLength(1);
  });
  it("solved target is not planned; empty plan still has a day", () => {
    const p = plan({ statuses: { N9: { level: "solved_self" } } });
    expect(p.order).toEqual([]);
    expect(p.days).toHaveLength(1);
  });
  it("unprobed N3/N4 do not break the chain: N1,N2 before N5 and N8", () => {
    const all = { N9: { level: "gap" as const }, N8: { level: "gap" as const }, N5: { level: "gap" as const }, N6: { level: "gap" as const }, N2: { level: "gap" as const }, N1: { level: "gap" as const } };
    const o = plan({ statuses: all }).order;
    expect(o).toHaveLength(6);
    for (const late of ["N5", "N8"] as const)
      for (const early of ["N1", "N2"] as const) expect(o.indexOf(early)).toBeLessThan(o.indexOf(late));
    expect(o.indexOf("N6")).toBeLessThan(o.indexOf("N5"));
    expect(o.at(-1)).toBe("N9");
  });
  it("testDate tomorrow: mixed_check today with <=2 new; overflow stays in order only", () => {
    const p = plan({ testDate: "2026-11-19" });
    expect(p.days).toEqual([{ date: today, items: [
      { topic: "N8", kind: "new" }, { topic: "N6", kind: "new" }, { topic: "N9", kind: "mixed_check" }] }]);
    expect(p.order).toEqual(["N8", "N6", "N5", "N9"]);
  });
  it("no targets: no mixed_check even with testDate", () => {
    const p = plan({ targets: [], testDate: "2026-11-22" });
    expect(p.days.flatMap((d) => d.items)).toEqual([]);
  });
});
