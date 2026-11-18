// Формы ответов core для экранов ребёнка (docs/specs/API_CHILD.md). Только типы, без данных.
import type { HouseState, Lang } from "@/lib/types";

export type GoalIntent = "test_soon" | "improve" | "just_practice";
export const GOAL_INTENTS: GoalIntent[] = ["test_soon", "improve", "just_practice"];

export type DiagnoseView = {
  state: string;
  asked: number;
  maxProbes: number;
  probe: null | {
    id: string;
    topic: string;
    kind: "mcq";
    params: Record<string, string>;
    numbersShown: string[];
    options: string[];
  };
};

export type PlanView = {
  testDate: string | null;
  gaps: string[];
  order: { topic: string; title: string }[];
  days: { date: string; items: { topic: string; title: string; kind: "new" | "review" | "mixed_check" }[] }[];
};

export type MahallaView = {
  lang: Lang;
  state: string;
  houses: {
    topic: string;
    title: string;
    state: HouseState;
    prereqs: string[];
    inPlan: boolean;
    canStart: boolean;
  }[];
  next: string | null;
};
