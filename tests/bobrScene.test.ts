import { describe, expect, it } from "vitest";
import { LESSON } from "../lib/config";
import { BEAT_POSE, WAITING_STATES, stepScene, type Beat } from "../lib/bobr/scene";

const MAX = LESSON.bobrQuestionMaxRounds;

describe("stepScene", () => {
  it("pass → TOPIC_DONE/solved, taught, rounds без изменений, в любом круге", () => {
    for (let r = 0; r <= MAX + 2; r++) {
      expect(stepScene(r, "pass")).toEqual({ state: "TOPIC_DONE", beat: "solved", rounds: r, taught: true, demo: false });
    }
  });
  it("partial до границы → BOBR_QUESTION/question, rounds+1", () => {
    for (let r = 0; r + 1 < MAX; r++) {
      expect(stepScene(r, "partial")).toEqual({ state: "BOBR_QUESTION", beat: "question", rounds: r + 1, taught: false, demo: false });
    }
  });
  it("fail до границы → BOBR_ATTEMPT/wrong_rule, rounds+1", () => {
    for (let r = 0; r + 1 < MAX; r++) {
      expect(stepScene(r, "fail")).toEqual({ state: "BOBR_ATTEMPT", beat: "wrong_rule", rounds: r + 1, taught: false, demo: false });
    }
  });
  it("граница: rounds+1 ≥ max → give_up, demo, не taught (partial и fail)", () => {
    for (const v of ["partial", "fail"] as const) {
      for (const r of [MAX - 1, MAX, MAX + 3]) {
        expect(stepScene(r, v)).toEqual({ state: "TOPIC_DONE", beat: "give_up", rounds: r + 1, taught: false, demo: true });
      }
      // одним кругом раньше — ещё не сдался
      expect(stepScene(MAX - 2, v).beat).not.toBe("give_up");
    }
  });
  it("3-й круг подряд: partial,partial,partial и fail,fail,fail → give_up", () => {
    for (const v of ["partial", "fail"] as const) {
      let s = stepScene(0, v);
      s = stepScene(s.rounds, v);
      expect(s.beat).not.toBe("give_up");
      s = stepScene(s.rounds, v);
      expect(s.beat).toBe("give_up");
      expect(s.taught).toBe(false);
    }
  });
  it("taught только на pass", () => {
    for (let r = 0; r <= MAX; r++) {
      for (const v of ["pass", "partial", "fail"] as const) expect(stepScene(r, v).taught).toBe(v === "pass");
    }
  });
  it("demo только на give_up", () => {
    for (let r = 0; r <= MAX; r++) {
      for (const v of ["pass", "partial", "fail"] as const) {
        const s = stepScene(r, v);
        expect(s.demo).toBe(s.beat === "give_up");
      }
    }
  });
});

describe("BEAT_POSE / WAITING_STATES", () => {
  it("запасные позы по спеке", () => {
    const want: Record<Beat, string> = { entry: "happy", question: "confused", wrong_rule: "confused", solved: "aha", give_up: "think" };
    expect(BEAT_POSE).toEqual(want);
  });
  it("объяснение принимается в TEACH_BOBR, BOBR_QUESTION, BOBR_ATTEMPT, JUDGING и больше нигде", () => {
    expect([...WAITING_STATES].sort()).toEqual(["BOBR_ATTEMPT", "BOBR_QUESTION", "JUDGING", "TEACH_BOBR"]);
    expect(WAITING_STATES).not.toContain("TOPIC_DONE");
  });
});
