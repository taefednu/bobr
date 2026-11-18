import { describe, expect, it } from "vitest";
import { isQuietHour, planDigest, selectDeliverable, tashkentDayStart } from "../lib/telegram/delivery";

// 2026-11-18 в Ташкенте (UTC+5): локальное время -> UTC ms
const at = (h: number, m = 0) => Date.UTC(2026, 10, 18, h - 5, m);
const H = 3_600_000;

describe("тихие часы Asia/Tashkent", () => {
  it("границы: 20:59 можно, 21:00 тихо, 07:59 тихо, 08:00 можно", () => {
    expect(isQuietHour(at(20, 59))).toBe(false);
    expect(isQuietHour(at(21, 0))).toBe(true);
    expect(isQuietHour(at(7, 59))).toBe(true);
    expect(isQuietHour(at(8, 0))).toBe(false);
  });
  it("начало суток по Ташкенту, а не по UTC", () => {
    expect(tashkentDayStart(at(23, 30))).toBe(at(0, 0));
    expect(tashkentDayStart(at(0, 10))).toBe(at(0, 0));
  });
});

const row = (id: string, parentId: string, kind: string, createdAt = 1, studentId?: string) => ({ _id: id, parentId, kind, studentId, createdAt });
const base = { limit: 20, sentTodayParents: new Set<string>(), parents: new Map(), abuseStudents: new Set<string>() };

describe("selectDeliverable", () => {
  it("в тихие часы несрочное не уходит", () => {
    expect(selectDeliverable({ ...base, rows: [row("a", "p1", "daily_summary")], now: at(22) })).toEqual([]);
  });
  it("один несрочный на родителя в день: из двух уходит первый, и ничего, если уже было сегодня", () => {
    const rows = [row("a", "p1", "daily_summary", 1), row("b", "p1", "forgotten", 2), row("c", "p2", "taught_bobr", 3)];
    expect(selectDeliverable({ ...base, rows, now: at(10) }).map((r) => r._id)).toEqual(["a", "c"]);
    expect(selectDeliverable({ ...base, rows, now: at(10), sentTodayParents: new Set(["p1"]) }).map((r) => r._id)).toEqual(["c"]);
  });
  it("пауза и выключенная настройка задерживают; кризис в этой функции не обрабатывается", () => {
    const now = at(10);
    const parents = new Map<string, { pausedUntil?: number; notifications?: { taughtBobr: boolean; dailySummary: boolean; forgotten: boolean } }>([
      ["p1", { pausedUntil: now + H }], ["p2", { notifications: { taughtBobr: true, dailySummary: false, forgotten: true } }],
    ]);
    const rows = [row("a", "p1", "taught_bobr"), row("b", "p2", "daily_summary"), row("c", "p2", "forgotten"), row("d", "p3", "crisis")];
    expect(selectDeliverable({ ...base, rows, now, parents }).map((r) => r._id)).toEqual(["c"]);
  });
  it("ABUSE_HOME: ни сводка, ни «научил» родителю не уходит", () => {
    const rows = [row("a", "p1", "daily_summary", 1, "s1"), row("b", "p2", "taught_bobr", 2, "s2")];
    expect(selectDeliverable({ ...base, rows, now: at(10), abuseStudents: new Set(["s1"]) }).map((r) => r._id)).toEqual(["b"]);
  });
});

describe("planDigest", () => {
  const now = at(8);
  const topics = [{ level: "solved_self" as const, solvedSelfAt: now - H }];
  const old = [{ level: "taught_bobr" as const, taughtAt: now - 8 * 86_400_000 }];
  it("сводка с ключом по дате; повтор с этим ключом ничего не создаёт", () => {
    const d = planDigest({ studentId: "s1", now, topics, existingKeys: new Set() });
    expect(d).toEqual({ kind: "daily_summary", dedupeKey: "daily:s1:2026-11-18", solved: 1, taught: 0 });
    expect(planDigest({ studentId: "s1", now, topics, existingKeys: new Set([d!.dedupeKey]) })).toBeNull();
  });
  it("нет активности и нет гаснущих домов: ничего; гаснущие дома: forgotten раз в неделю", () => {
    expect(planDigest({ studentId: "s1", now, topics: [], existingKeys: new Set() })).toBeNull();
    const d = planDigest({ studentId: "s1", now, topics: old, existingKeys: new Set() });
    expect(d).toMatchObject({ kind: "forgotten", dimmed: 1 });
    expect(planDigest({ studentId: "s1", now: now + H, topics: old, existingKeys: new Set([(d as { dedupeKey: string }).dedupeKey]) })).toBeNull();
  });
  it("выключенная настройка: не создаёт", () => {
    expect(planDigest({ studentId: "s1", now, topics, existingKeys: new Set(), notifications: { taughtBobr: true, dailySummary: false, forgotten: true } })).toBeNull();
  });
});
