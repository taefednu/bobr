import { describe, expect, it } from "vitest";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { deleteAccount, deleteAccountHandler, getByTelegramUserHandler, planChild, setConsent, setPause } from "../convex/parents";
import { create, createHandler } from "../convex/students";

type Row = Record<string, unknown> & { _id: string };
function database() {
  const tables = new Map<string, Row[]>();
  let seq = 0;
  const rows = (t: string) => { if (!tables.has(t)) tables.set(t, []); return tables.get(t)!; };
  const db = {
    get: async (t: string, id: string) => rows(t).find((r) => r._id === id) ?? null,
    insert: async (t: string, v: Record<string, unknown>) => { const id = `${t}:${++seq}`; rows(t).push({ ...v, _id: id }); return id; },
    patch: async (t: string, id: string, v: Record<string, unknown>) => {
      const r = rows(t).find((x) => x._id === id); if (!r) throw new Error("missing row");
      for (const [k, e] of Object.entries(v)) { if (e === undefined) delete r[k]; else r[k] = e; }
    },
    delete: async (t: string, id: string) => { tables.set(t, rows(t).filter((r) => r._id !== id)); },
    query: (t: string) => {
      const c: [string, unknown][] = [];
      const match = () => rows(t).filter((r) => c.every(([k, v]) => r[k] === v));
      const q = {
        withIndex: (_n: string, fn: (f: unknown) => unknown) => { const f = { eq: (k: string, v: unknown) => { c.push([k, v]); return f; } }; fn(f); return q; },
        take: async (n: number) => match().slice(0, n),
        first: async () => match()[0] ?? null,
      };
      return q;
    },
  };
  return { ctx: db as unknown as { db: typeof db }, rows, tables, db };
}
const mctx = (s: ReturnType<typeof database>) => ({ db: s.db }) as unknown as MutationCtx;
const qctx = (s: ReturnType<typeof database>) => ({ db: s.db }) as unknown as QueryCtx;
const handlerOf = (fn: unknown) => (fn as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;

async function seedParent(s: ReturnType<typeof database>, tg: string) {
  const parentId = (await s.db.insert("parents", { lang: "ru", telegramUserId: tg, consent: true })) as Id<"parents">;
  await s.db.insert("parentSessions", { parentId, token: "t" + tg, expiresAt: 1 });
  await s.db.insert("outbox", { parentId, chatId: "1", kind: "crisis", text: "x", createdAt: 1 });
  return parentId;
}
async function seedChild(s: ReturnType<typeof database>, parentId: Id<"parents">, name: string) {
  const sid = (await createHandler(mctx(s), { parentId, name, grade: 5 })).studentId;
  for (const t of ["turns", "escalationEvents", "attemptRequests", "taskProgress", "lessonSessions", "topicStatus", "houses", "plans", "reviewQueue", "linkCodes", "sessions"]) {
    await s.db.insert(t, { studentId: sid });
    await s.db.insert(t, { studentId: sid });
  }
  return sid;
}
const CHILD_TABLES = ["turns", "escalationEvents", "attemptRequests", "taskProgress", "lessonSessions", "topicStatus", "houses", "plans", "reviewQueue", "linkCodes", "sessions"];

describe("students.create idempotency", () => {
  it("same requestId -> same child, no duplicate row or link", async () => {
    const s = database(); const parentId = await seedParent(s, "1");
    const a = await createHandler(mctx(s), { parentId, name: "Madina", grade: 5, requestId: "r1" });
    const b = await createHandler(mctx(s), { parentId, name: "Madina", grade: 5, requestId: "r1" });
    const c = await createHandler(mctx(s), { parentId, name: "Madina", grade: 5, requestId: "r2" });
    expect(b.studentId).toBe(a.studentId);
    expect(c.studentId).not.toBe(a.studentId);
    expect(s.rows("students")).toHaveLength(2);
    expect(s.rows("parentLinks")).toHaveLength(2);
  });
});

describe("deleteAccount", () => {
  it("removes parent and every related row, across batches", async () => {
    const s = database();
    const p1 = await seedParent(s, "1"); const p2 = await seedParent(s, "2");
    const c1 = await seedChild(s, p1, "A"); const c1b = await seedChild(s, p1, "B");
    const other = await seedChild(s, p2, "Other");
    let calls = 0, r = { done: false };
    while (!r.done) { r = await deleteAccountHandler(mctx(s), p1, 7); if (++calls > 100) throw new Error("no progress"); }
    expect(calls).toBeGreaterThan(1);
    for (const t of ["parents", "students", "parentLinks", "parentSessions", "outbox", ...CHILD_TABLES]) {
      const left = s.rows(t).filter((x) => x.parentId === p1 || x.studentId === c1 || x.studentId === c1b || x._id === p1 || x._id === c1 || x._id === c1b);
      expect(left, t).toEqual([]);
    }
    // чужой родитель и его ребёнок нетронуты
    expect(s.rows("parents").map((x) => x._id)).toEqual([p2]);
    expect(s.rows("students").map((x) => x._id)).toEqual([other]);
    expect(s.rows("turns").filter((x) => x.studentId === other)).toHaveLength(2);
    expect((await deleteAccountHandler(mctx(s), p1)).done).toBe(true); // повтор
  });
  it("shared child stays with the other parent", async () => {
    const s = database();
    const p1 = await seedParent(s, "1"); const p2 = await seedParent(s, "2");
    const kid = await seedChild(s, p1, "Kid");
    await s.db.insert("parentLinks", { parentId: p2, studentId: kid });
    expect(planChild(p1, [p1, p2])).toBe("unlink");
    expect(planChild(p1, [p1])).toBe("delete");
    expect((await deleteAccountHandler(mctx(s), p1)).done).toBe(true);
    expect(s.rows("students")[0]).toMatchObject({ _id: kid, parentId: p2 });
    expect(s.rows("parentLinks")).toEqual([expect.objectContaining({ parentId: p2, studentId: kid })]);
    expect(s.rows("turns")).toHaveLength(2);
  });
});

describe("bot secret and confirmation", () => {
  it("rejects wrong secret and missing confirm", async () => {
    process.env.BOT_SECRET = "right-secret";
    const s = database(); const parentId = await seedParent(s, "1");
    await seedChild(s, parentId, "A");
    const call = (fn: unknown, args: Record<string, unknown>) => handlerOf(fn)(mctx(s), args);
    await expect(call(deleteAccount, { botSecret: "wrong", parentId, confirm: true })).rejects.toThrow("unauthorized");
    await expect(call(deleteAccount, { botSecret: "right-secret", parentId, confirm: false })).rejects.toThrow("confirmation required");
    await expect(call(create, { botSecret: "wrong", parentId, name: "x", grade: 5 })).rejects.toThrow("unauthorized");
    expect(s.rows("parents")).toHaveLength(1);
    expect(s.rows("students")).toHaveLength(1);
    await expect(call(deleteAccount, { botSecret: "right-secret", parentId, confirm: true })).resolves.toEqual({ done: true });
    expect(s.rows("parents")).toHaveLength(0);
  });
});

describe("consent, pause, lookup", () => {
  it("setConsent keeps first consentAt, clears on false; setPause bounds", async () => {
    process.env.BOT_SECRET = "right-secret";
    const s = database(); const parentId = (await s.db.insert("parents", { lang: "ru" })) as Id<"parents">;
    const call = (fn: unknown, args: Record<string, unknown>) => handlerOf(fn)(mctx(s), { botSecret: "right-secret", parentId, ...args });
    await call(setConsent, { consent: true });
    const at = s.rows("parents")[0].consentAt as number;
    expect(at).toBeGreaterThan(0);
    await new Promise((r) => setTimeout(r, 5));
    await call(setConsent, { consent: true });
    expect(s.rows("parents")[0].consentAt).toBe(at);
    await call(setConsent, { consent: false });
    expect(s.rows("parents")[0].consentAt).toBeUndefined();
    await expect(call(setPause, { until: Date.now() - 1 })).rejects.toThrow("bad pause");
    await expect(call(setPause, { until: Date.now() + 31 * 86_400_000 })).rejects.toThrow("bad pause");
    await call(setPause, { until: Date.now() + 86_400_000 });
    expect(s.rows("parents")[0].pausedUntil).toBeGreaterThan(Date.now());
    await call(setPause, { until: null });
    expect(s.rows("parents")[0].pausedUntil).toBeUndefined();
  });
  it("lookup by telegramUserId: summary for the owner, null for a stranger", async () => {
    const s = database(); const parentId = await seedParent(s, "42");
    const sid = await seedChild(s, parentId, "Madina");
    await s.db.patch("topicStatus", s.rows("topicStatus")[0]._id, { level: "gap" });
    const got = await getByTelegramUserHandler(qctx(s), "42");
    expect(got).toMatchObject({ parentId, lang: "ru", consent: true, children: [{ studentId: sid, grade: 5, progress: { gap: 1 } }] });
    expect(await getByTelegramUserHandler(qctx(s), "43")).toBeNull();
  });
});
