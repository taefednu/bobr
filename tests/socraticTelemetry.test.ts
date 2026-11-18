import { describe, expect, it } from "vitest";
import { projectLessonSupport } from "../convex/socraticTelemetry";

const lesson = { startedAt: 100 };
const progress = (outcome: "active" | "independent" | "assisted", level = 1, createdAt = 100) => ({
  outcome, escalationLevel: level, misconceptionTag: null as string | null, createdAt,
});

describe("parent Socratic telemetry projection", () => {
  it("does not invent zero assistance or independent results for legacy lessons", () => {
    const result = projectLessonSupport("N8", null, [], []);
    expect(result.tracking).toBe("untracked");
    expect(result.independentlySolved).toBeNull();
    expect(result.assistedSolved).toBeNull();
    expect(result.independentStreak).toBeNull();
  });

  it("keeps completed support history when the next task resets to level 1", () => {
    const result = projectLessonSupport("N8", lesson, [
      progress("assisted", 4, 100), progress("independent", 1, 110), progress("active", 1, 120),
    ], []);
    expect(result.currentEscalationLevel).toBe(1);
    expect(result.maxEscalationLevel).toBe(4);
    expect(result.independentlySolved).toBe(1);
    expect(result.assistedSolved).toBe(1);
    expect(result.independentStreak).toBe(1);
  });

  it("active assistance resets a previous independent streak", () => {
    expect(projectLessonSupport("N8", lesson, [progress("independent"), progress("independent", 1, 110), progress("active", 2, 120)], []).independentStreak).toBe(0);
    expect(projectLessonSupport("N8", lesson, [progress("independent"), progress("independent", 1, 110), progress("independent", 1, 120)], []).independentStreak).toBe(3);
  });

  it("whitelists event fields and does not copy hidden solution or identity", () => {
    const result = projectLessonSupport("N8", lesson, [{ ...progress("active", 2), answerKey: "SECRET_ANSWER", referenceSteps: ["SECRET_STEPS"] }], [
      { topicNodeId: "N8", escalationLevel: 2, misconceptionTag: "added_denominators", timestamp: 123, reason: "wrong", studentId: "SECRET_ID", text: "SECRET_CHILD_TEXT" },
    ]);
    expect(result.latestMisconceptionTag).toBe("added_denominators");
    expect(result.events).toEqual([{ topicNodeId: "N8", escalationLevel: 2, misconceptionTag: "added_denominators", timestamp: 123, reason: "wrong" }]);
    expect(JSON.stringify(result)).not.toMatch(/SECRET|answerKey|referenceSteps|studentId|text/);
  });

  it("does not label truncated task counts as a complete lesson", () => {
    const result = projectLessonSupport("N8", lesson, Array.from({ length: 9 }, (_, index) => progress("independent", 1, index)), []);
    expect(result.summaryComplete).toBe(false);
    expect(result.independentlySolved).toBeNull();
    expect(result.independentStreak).toBeNull();
  });
});
