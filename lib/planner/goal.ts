// Цель ребёнка (экран «Bobr спрашивает»): чистая проверка. Дата нужна только для test_soon.
import type { Goal } from "../types";

export const MAX_TEST_DAYS = 365; // дальше — не «скоро контрольная»; и buildPlan строит день на каждую дату до теста

/** Настоящая дата YYYY-MM-DD в окне [today, today + MAX_TEST_DAYS]. Единственная проверка даты теста для всех входов. */
export function validTestDate(testDate: string, today: string): boolean {
  const d = new Date(`${testDate}T00:00:00Z`); // 2026-13-01 → Invalid Date, 2026-02-31 → не совпадёт при обратном форматировании
  if (!/^\d{4}-\d{2}-\d{2}$/.test(testDate) || isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== testDate) return false;
  const max = new Date(Date.parse(`${today}T00:00:00Z`) + MAX_TEST_DAYS * 86_400_000).toISOString().slice(0, 10);
  return testDate >= today && testDate <= max;
}

export function normalizeGoal({ goal, testDate, today }: { goal: Goal; testDate?: string; today: string }):
  { goal: Goal; testDate: string | undefined } {
  if (goal !== "test_soon" || testDate === undefined) return { goal, testDate: undefined };
  if (!validTestDate(testDate, today)) throw new Error("bad testDate");
  return { goal, testDate };
}
