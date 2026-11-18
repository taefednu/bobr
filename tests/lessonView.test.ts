// Публичная проекция урока: ответ и дистракторы не должны попадать в useQuery (ANSWER_EXTRACTION).
import { describe, expect, it } from "vitest";
import { DEMO_PROBES } from "../lib/fractions";
import { lessonView, operandFractions } from "../convex/lessonView";
import type { Doc } from "../convex/_generated/dataModel";

const probe = DEMO_PROBES.find((p) => p.topic === "N9")!;
const { seed: _seed, ...task } = probe;
const student = {
  _id: "s1", _creationTime: 0, lang: "ru", consent: true, state: "LESSON_SOLVE", riskCount: 0,
  currentTask: { ...task, id: "demo-N9-word", kind: "word" },
  turnNo: 2, lastVerdict: "misconception:M9",
} as unknown as Doc<"students">;

describe("lessonView", () => {
  it("diagnosis probe (mcq) is not a lesson task: hidden from the lesson view", () => {
    expect(lessonView({ ...student, state: "DIAGNOSE", currentTask: { ...task, kind: "mcq" } } as unknown as Doc<"students">).task).toBeNull();
  });

  it("never exposes answer or distractors", () => {
    expect(probe.answer).toBe("5/6");
    expect(probe.distractors.some((d) => d.value === "2/5")).toBe(true);
    const json = JSON.stringify(lessonView(student));
    expect(json).not.toMatch(/answer|distractor|misconception":/i);
    expect(json).not.toContain("5/6");
    expect(json).not.toContain("2/5");
    expect(lessonView(student).task).toEqual({ topic: "N9", kind: "word", params: probe.params, numbersShown: probe.numbersShown });
  });

  it("never spreads reference fields or hidden nested params", () => {
    const hidden = { ...student.currentTask!, answerKey: "PRIVATE_KEY", referenceSteps: ["PRIVATE_STEPS"],
      params: { ...student.currentTask!.params, answerKey: "PRIVATE_PARAM", referenceSteps: "PRIVATE_PARAM_STEPS" } };
    const json = JSON.stringify(lessonView({ ...student, currentTask: hidden }));
    expect(json).not.toContain("PRIVATE_");
  });

  it("keeps lesson state under the CRISIS overlay", () => {
    const v = lessonView({ ...student, state: "CRISIS", stateBeforeCrisis: "LESSON_SOLVE" });
    expect(v.crisis?.numbers).toEqual(["112"]);
    expect(v.task?.kind).toBe("word");
  });

  it("canTeach is decided by the server: solved_self topic in the lesson only", () => {
    expect(lessonView(student).canTeach).toBe(false);
    expect(lessonView(student, null, "gap").canTeach).toBe(false);
    expect(lessonView(student, null, "solved_self").canTeach).toBe(true);
    expect(lessonView({ ...student, state: "TOPIC_DONE" } as unknown as Doc<"students">, null, "solved_self").canTeach).toBe(true);
    expect(lessonView({ ...student, state: "BOBR_QUESTION" } as unknown as Doc<"students">, null, "solved_self").canTeach).toBe(true); // reload mid-scene
    expect(lessonView({ ...student, state: "HOME" } as unknown as Doc<"students">, null, "solved_self").canTeach).toBe(false);
    expect(lessonView(student, null, "taught_bobr").canTeach).toBe(false);
    expect(lessonView({ ...student, state: "CRISIS" } as unknown as Doc<"students">, null, "solved_self").canTeach).toBe(false);
    expect(JSON.stringify(lessonView(student, null, "solved_self"))).not.toMatch(/answer|distractor/i);
  });

  it("operand fractions come from params only", () => {
    expect(operandFractions(probe.params)).toEqual(["1/2", "1/3"]);
  });
});
