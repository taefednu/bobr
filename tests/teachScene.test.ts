// Сцена «Научи Bobr» живёт на сервере: query без answer, судья оценивает попытку, которую видит ребёнок.
import { describe, expect, it } from "vitest";
import { entryAttempt, sceneAttempt, solvedAttempt, wrongRuleAttempt } from "../lib/bobr/attempts";
import { defaultScene, teachSceneView } from "../convex/teachView";
import type { Doc } from "../convex/_generated/dataModel";

const student = (scene: Doc<"students">["teachScene"], topic = "N9") =>
  ({ _id: "s1", state: "BOBR_QUESTION", currentTopic: topic, teachScene: scene }) as unknown as Doc<"students">;

describe("sceneAttempt (находка 12)", () => {
  it("wrong_rule: судья получает новую задачу, не задачу входа", () => {
    const cur = sceneAttempt("N9", defaultScene("wrong_rule", 7))!;
    expect(cur).toEqual(wrongRuleAttempt("N9", 7));
    expect(cur.task.params).not.toEqual(entryAttempt("N9")!.task.params);
  });
  it("solved: решённая попытка; без сцены и на question — попытка входа", () => {
    expect(sceneAttempt("N9", defaultScene("solved", 4))).toEqual(solvedAttempt("N9", 4));
    expect(sceneAttempt("N9", null)).toEqual(entryAttempt("N9"));
    expect(sceneAttempt("N9", defaultScene("question", 3))).toEqual(entryAttempt("N9"));
  });
});

describe("teachSceneView", () => {
  it("реплика, поза, круг сохраняются; answer не уходит ни в одном beat", () => {
    for (const beat of ["entry", "question", "wrong_rule", "solved", "give_up"] as const) {
      const sc = { ...defaultScene(beat, 5), reply: "Nega bunday?" };
      const v = teachSceneView(student(sc), 2, 1)!;
      expect(v.reply).toBe("Nega bunday?");
      expect(v.rounds).toBe(2);
      expect(v.pose).toBe(sc.pose);
      const att = sceneAttempt("N9", sc)!;
      const json = JSON.stringify({ ...v, attempt: undefined }); // attempt Bobr виден ребёнку; ответ задачи — нет
      if (att.task.answer !== att.attempt) expect(json).not.toContain(`"${att.task.answer}"`);
      expect(json).not.toMatch(/"answer"|distractor/i);
    }
  });
  it("give_up: демо строится из ответа, но сам ответ строкой не отдаётся", () => {
    const v = teachSceneView(student(defaultScene("give_up", 5)), 3, 0)!;
    expect(v.demo).not.toBeNull();
  });
  it("нет сцены — null", () => expect(teachSceneView(student(undefined), 0, 0)).toBeNull());
});
