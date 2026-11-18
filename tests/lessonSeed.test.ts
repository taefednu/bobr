// Находка 8: повторная сессия темы не должна выдавать уже решённые задачи (иначе solved_self накручивается повтором).
import { describe, expect, it, vi } from "vitest";
import type { MutationCtx } from "../convex/_generated/server";
import { nextSeed } from "../convex/conductor";
import { startLesson } from "../convex/mahalla";

type Row = Record<string, unknown> & { _id: string };
const tables = new Map<string, Row[]>();
const rows = (t: string) => { if (!tables.has(t)) tables.set(t, []); return tables.get(t)!; };
let seq = 0;
const db = {
  get: async (t: string, id: string) => rows(t).find((r) => r._id === id) ?? null,
  insert: async (t: string, v: Record<string, unknown>) => { const _id = `${t}:${++seq}`; rows(t).push({ ...v, _id }); return _id; },
  patch: async (t: string, id: string, v: Record<string, unknown>) => {
    const r = rows(t).find((x) => x._id === id)!;
    for (const [k, e] of Object.entries(v)) { if (e === undefined) delete r[k]; else r[k] = e; }
  },
  query: (t: string) => {
    const conds: [string, unknown][] = [];
    const match = () => rows(t).filter((r) => conds.every(([k, v]) => r[k] === v));
    const q = {
      withIndex: (_n: string, fn: (b: unknown) => unknown) => { const b = { eq: (k: string, v: unknown) => { conds.push([k, v]); return b; } }; fn(b); return q; },
      order: () => q, take: async (n: number) => match().slice(0, n), first: async () => match().at(-1) ?? null, unique: async () => match()[0] ?? null,
    };
    return q;
  },
};
vi.mock("../convex/session", async (orig) => ({
  ...(await orig<object>()),
  childOf: async () => rows("students")[0],
  childOrNull: async () => rows("students")[0],
}));

const start = (topic: string) => (startLesson as unknown as { _handler: (c: MutationCtx, a: object) => Promise<null> })
  ._handler({ db } as unknown as MutationCtx, { token: "t", topic });
const taskId = () => (rows("students")[0].currentTask as { id: string }).id;

describe("seed задач зависит от номера сессии темы", () => {
  it("первая сессия — 101, повторная N8 после N9 — другие задачи; дальше seed + 1", async () => {
    const studentId = await db.insert("students", { lang: "ru", state: "HOME", turnNo: 0 });
    await db.insert("plans", { studentId, order: ["N8", "N9"] });
    await start("N8");
    expect(taskId()).toBe("N8-word-101");
    await start("N9");
    await start("N8");
    expect(taskId()).not.toBe("N8-word-101");
    expect(taskId()).toBe("N8-word-201");
    expect(nextSeed(taskId(), 2)).toBe(202);
    expect(nextSeed("N8-word-101", 2)).toBe(102);
    expect(nextSeed("N8-mcq", 2)).toBe(102);
  });
});
