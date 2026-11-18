export type HouseState = "empty" | "scaffold" | "built" | "alive" | "dimmed";

export function knownHouseState(state: string): HouseState | null {
  return ["empty", "scaffold", "built", "alive", "dimmed"].includes(state) ? state as HouseState : null;
}

export function nextTopicDay<T extends { date: string; items: { topic: string }[] }>(days: T[], topic: string | null, today: string | null): T | null {
  if (topic === null || today === null) return null;
  return days.find((day) => day.date >= today && day.items.some((item) => item.topic === topic)) ?? null;
}

/** Calendar countdown in Asia/Tashkent (UTC+5), never the device's timezone. */
export function daysUntilTest(date: string | null, now: number): number | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const due = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(due) || new Date(due).toISOString().slice(0, 10) !== date) return null;
  const today = new Date(now + 5 * 3600_000).toISOString().slice(0, 10);
  return Math.max(0, (due - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/** Keep numeric order explicit: Node and browser ICU may disagree on Uzbek month names/order. */
export function formatParentDate(date: string | number, lang: "uz" | "ru"): string | null {
  const value = new Date(typeof date === "string" ? `${date}T00:00:00+05:00` : date);
  if (!Number.isFinite(value.getTime()) || (typeof date === "string" && daysUntilTest(date, value.getTime()) === null)) return null;
  const parts = new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "uz-Latn-UZ", {
    timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit", numberingSystem: "latn",
  }).formatToParts(value);
  return ["day", "month", "year"].map((type) => parts.find((part) => part.type === type)?.value).join(".");
}
