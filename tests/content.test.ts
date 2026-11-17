import { describe, expect, it } from "vitest";
import { graph, validateGraph, type Graph } from "../lib/content";

const SPEC_EDGES: [string, string][] = [
  ["N1", "N2"], ["N2", "N3"], ["N3", "N4"], ["N4", "N5"], ["N6", "N5"],
  ["N5", "N7"], ["N2", "N8"], ["N5", "N9"], ["N8", "N9"], ["N3", "N10"],
];

describe("content/graph.json", () => {
  it("has N1..N10 with ru and uz titles", () => {
    expect(graph.topics.map((t) => t.id)).toEqual(Array.from({ length: 10 }, (_, i) => `N${i + 1}`));
    for (const t of graph.topics) {
      expect(t.title.ru).toBeTruthy();
      expect(t.title.uz).toBeTruthy();
    }
  });

  it("has exactly the spec edges (from -> to)", () => {
    const edges = graph.topics.flatMap((t) => t.prereqs.map((p) => `${p}->${t.id}`)).sort();
    expect(edges).toEqual(SPEC_EDGES.map(([a, b]) => `${a}->${b}`).sort());
  });

  it("rejects cycles and unknown prereqs", () => {
    const t = (id: string, prereqs: string[]) => ({ id, title: { ru: id, uz: id }, prereqs });
    expect(() => validateGraph({ topics: [t("N1", ["N2"]), t("N2", ["N1"])] } as Graph)).toThrow(/cycle/);
    expect(() => validateGraph({ topics: [t("N1", ["N9"])] } as Graph)).toThrow(/unknown prereq/);
  });
});

describe("zod schemas", () => {
  it("normalises enum case", async () => {
    const { GuardResult, Judge } = await import("../lib/types");
    expect(GuardResult.parse({ category: "self_harm", severity: 3 }).category).toBe("SELF_HARM");
    expect(Judge.parse({ ideas: [], falseClaims: [], verdict: "PASS", copiedFromUstoz: false }).verdict).toBe("pass");
  });
});
