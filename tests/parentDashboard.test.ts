import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import { dashboardHandler, minutesByDay, setNotificationsHandler, setPauseHandler } from "../convex/parent";

type Row = Record<string, unknown> & { _id: string };
const NOW = Date.parse("2026-11-18T10:00:00Z");
const MIN = 60_000;

function database() {
  const tables = new Map<string, Row[]>();
  const rows = (t: string) => { if (!tables.has(t)) tables.set(t, []); return tables.get(t)!; };
  let n = 0;
  const add = (t: string, v: Record<string, unknown>) => { const _id = `${t}:${++n}`; rows(t).push({ ...v, _id }); return _id; };
  const db = {
    get: async (t: string, id: string) => rows(t).find((r) => r._id === id) ?? null,
    patch: async (t: string, id: string, v: Record<string, unknown>) => {
      const r = rows(t).find((x) => x._id === id)!;
      for (const [k, e] of Object.entries(v)) { if (e === undefined) delete r[k]; else r[k] = e; }
    },
    query: (t: string) => {
      const conds: [string, string, unknown][] = [];
      let dir = 1;
      const f = {
        eq: (k: string, x: unknown) => (conds.push([k, "eq", x]), f),
        gte: (k: string, x: unknown) => (conds.push([k, "gte", x]), f),
      };
      const run = () => rows(t).filter((r) => conds.every(([k, op, x]) => (op === "eq" ? r[k] === x : (r[k] as number) >= (x as number))))
        .sort((a, b) => dir * (((a.ts ?? a.timestamp ?? a.createdAt ?? 0) as number) - ((b.ts ?? b.timestamp ?? b.createdAt ?? 0) as number)));
      const q = {
        withIndex: (_i: string, fn: (q: unknown) => unknown) => (fn(f), q),
        order: (o: string) => (dir = o === "desc" ? -1 : 1, q),
        take: async (k: number) => run().slice(0, k),
        first: async () => run()[0] ?? null,
      };
      return q;
    },
  };
  return { ctx: { db } as unknown as QueryCtx & MutationCtx, add, rows };
}

function world() {
  const d = database();
  const parent = d.add("parents", { lang: "ru", firstName: "Mama" });
  const other = d.add("parents", { lang: "ru" });
  const mine = d.add("students", { displayName: "Aya" });
  const foreign = d.add("students", { displayName: "Stranger" });
  d.add("parentLinks", { parentId: parent, studentId: mine });
  d.add("parentLinks", { parentId: other, studentId: foreign });
  d.add("parentSessions", { parentId: parent, token: "good", expiresAt: NOW + 1e6 });
  d.add("parentSessions", { parentId: parent, token: "old", expiresAt: NOW - 1 });
  d.add("topicStatus", { studentId: mine, topic: "N8", level: "taught_bobr", streak: 0, tasksThisSession: 0, bobrQuestionRounds: 0, taughtAt: NOW - 1000 });
  for (const ts of [NOW - 10 * MIN, NOW - 8 * MIN, NOW - 6 * MIN, NOW - 60 * MIN]) {
    d.add("turns", { studentId: mine, role: "child", kind: "text", text: "SECRET_CHILD_TEXT", ts });
  }
  d.add("turns", { studentId: foreign, role: "child", kind: "text", text: "FOREIGN_TEXT", ts: NOW - MIN });
  d.add("escalationEvents", { studentId: mine, topicNodeId: "N9", misconceptionTag: "added_denominators", timestamp: NOW - MIN });
  d.add("escalationEvents", { studentId: mine, topicNodeId: "N9", misconceptionTag: "added_denominators", timestamp: NOW - 2 * MIN });
  d.add("escalationEvents", { studentId: mine, topicNodeId: "N9", misconceptionTag: null, timestamp: NOW - 3 * MIN });
  return { ...d, parent };
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => vi.useRealTimers());

describe("parent.dashboard", () => {
  it("returns mastery dates, mistake type and minutes per day", async () => {
    const { ctx } = world();
    const r = await dashboardHandler(ctx, { sessionToken: "good" });
    const c = r.children[0];
    expect(r.children).toHaveLength(1);
    expect(c.topics).toEqual([expect.objectContaining({ topic: "N8", taughtAt: NOW - 1000, solvedSelfAt: null })]);
    expect(c.mistakes).toEqual([{ topic: "N9", tag: "added_denominators", count: 2 }]);
    expect(c.week.minutesByDay).toHaveLength(7);
    expect(c.week.minutesByDay.at(-1)).toEqual({ date: "2026-11-18", minutes: 4 }); // 10→8→6 мин назад; 60 мин назад — отдельно
    expect(c.week.minutes).toBe(4);
    expect(c.week.activeDays).toBe(1);
    expect(c.week.minutesLimited).toBe(false);
    expect(r.parent).toMatchObject({ notifications: { taughtBobr: true, dailySummary: true, forgotten: true }, pausedUntil: null });
  });

  it("never leaks child text, ids or foreign children", async () => {
    const { ctx } = world();
    const json = JSON.stringify(await dashboardHandler(ctx, { sessionToken: "good" }));
    expect(json).not.toMatch(/SECRET_CHILD_TEXT|FOREIGN_TEXT|Stranger|studentId|students:|"text"|lastReply/);
  });

  it("rejects unknown and expired tokens", async () => {
    const { ctx } = world();
    await expect(dashboardHandler(ctx, { sessionToken: "nope" })).rejects.toThrow("unauthorized");
    await expect(dashboardHandler(ctx, { sessionToken: "old" })).rejects.toThrow("unauthorized");
  });
});

describe("minutesByDay", () => {
  it("ignores gaps over five minutes", () => {
    expect(minutesByDay([NOW - 20 * MIN, NOW - 10 * MIN, NOW - 8 * MIN], ["2026-11-18"])).toEqual([{ date: "2026-11-18", minutes: 2 }]);
  });
});

describe("parent settings", () => {
  it("merges notifications and persists them for the dashboard", async () => {
    const { ctx } = world();
    expect(await setNotificationsHandler(ctx, { sessionToken: "good", dailySummary: false })).toEqual({ taughtBobr: true, dailySummary: false, forgotten: true });
    expect((await dashboardHandler(ctx, { sessionToken: "good" })).parent.notifications.dailySummary).toBe(false);
    await expect(setNotificationsHandler(ctx, { sessionToken: "bad", forgotten: false })).rejects.toThrow("unauthorized");
  });

  it("sets, validates and clears pause", async () => {
    const { ctx } = world();
    await setPauseHandler(ctx, { sessionToken: "good", pausedUntil: NOW + 3600_000 });
    expect((await dashboardHandler(ctx, { sessionToken: "good" })).parent.pausedUntil).toBe(NOW + 3600_000);
    await expect(setPauseHandler(ctx, { sessionToken: "good", pausedUntil: NOW - 1 })).rejects.toThrow("bad pause");
    await expect(setPauseHandler(ctx, { sessionToken: "good", pausedUntil: NOW + 40 * 86_400_000 })).rejects.toThrow("bad pause");
    await expect(setPauseHandler(ctx, { sessionToken: "bad", pausedUntil: null })).rejects.toThrow("unauthorized");
    await setPauseHandler(ctx, { sessionToken: "good", pausedUntil: null });
    expect((await dashboardHandler(ctx, { sessionToken: "good" })).parent.pausedUntil).toBeNull();
  });
});
