// Переходы сцены «Научи Bobr» считает код: вердикт судьи → состояние, beat, счётчик раундов.
import { LESSON } from "../config";
import type { BOBR_POSES } from "../types";

export type BobrPose = (typeof BOBR_POSES)[number];
export type Beat = "entry" | "question" | "wrong_rule" | "solved" | "give_up";
export type SceneStep = {
  state: "BOBR_QUESTION" | "BOBR_ATTEMPT" | "TOPIC_DONE";
  beat: Exclude<Beat, "entry">;
  rounds: number;
  taught: boolean;
  demo: boolean;
};

export function stepScene(rounds: number, verdict: "pass" | "partial" | "fail"): SceneStep {
  if (verdict === "pass") return { state: "TOPIC_DONE", beat: "solved", rounds, taught: true, demo: false };
  const next = rounds + 1;
  if (next >= LESSON.bobrQuestionMaxRounds)
    return { state: "TOPIC_DONE", beat: "give_up", rounds: next, taught: false, demo: true };
  return verdict === "partial"
    ? { state: "BOBR_QUESTION", beat: "question", rounds: next, taught: false, demo: false }
    : { state: "BOBR_ATTEMPT", beat: "wrong_rule", rounds: next, taught: false, demo: false };
}

export const BEAT_POSE: Record<Beat, BobrPose> = {
  entry: "happy", question: "confused", wrong_rule: "confused", solved: "aha", give_up: "think",
};

/** Состояния, где принимается объяснение ребёнка. */
export const WAITING_STATES: readonly string[] = ["TEACH_BOBR", "BOBR_QUESTION", "BOBR_ATTEMPT", "JUDGING"];
