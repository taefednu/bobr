// Цель ребёнка (экран «Bobr спрашивает»): чистая проверка. Дата нужна только для test_soon.
import type { Goal } from "../types";

export function normalizeGoal({ goal, testDate, today }: { goal: Goal; testDate?: string; today: string }):
  { goal: Goal; testDate: string | undefined } {
  if (goal !== "test_soon" || testDate === undefined) return { goal, testDate: undefined };
  const d = new Date(`${testDate}T00:00:00Z`); // 2026-13-01 → Invalid Date, 2026-02-31 → не совпадёт при обратном форматировании
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(testDate) && !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === testDate;
  if (!ok || testDate < today) throw new Error("bad testDate");
  return { goal, testDate };
}
