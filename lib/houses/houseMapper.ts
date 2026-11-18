import { LESSON } from "../config";
import type { HouseState, TopicLevel } from "../types";

const DAY_MS = 86_400_000;

/** unknown→empty, gap→scaffold, solved_self→built, taught_bobr <7 дн→alive, ≥7 дн→dimmed (ровно 7 дней = dimmed). */
export function houseState(
  status: { level?: TopicLevel; taughtAt?: number } | undefined,
  now: number,
): HouseState {
  switch (status?.level) {
    case undefined: return "empty";
    case "gap": return "scaffold";
    case "solved_self": return "built";
    case "taught_bobr":
      // нет taughtAt у taught_bobr — не знаем, когда учил: считаем свежим (alive)
      return status.taughtAt !== undefined && now - status.taughtAt >= LESSON.dimmedAfterDays * DAY_MS ? "dimmed" : "alive";
  }
}

/** taught_bobr→solved_self→gap, gap остаётся gap. */
export function demote(level: TopicLevel): TopicLevel {
  return level === "taught_bobr" ? "solved_self" : "gap";
}
