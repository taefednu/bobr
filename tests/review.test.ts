import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { MutationCtx, QueryCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { closeHandler, listOpenHandler, REVIEW_LIST_LIMIT } from "../convex/review";

type Row = Record<string, unknown> & { _id: string; _creationTime: number };
function database() {
  const rows: Row[] = [];
  const db = {
    get: async (_t: string, id: string) => rows.find((r) => r._id === id) ?? null,
    patch: async (_t: string, id: string, value: Record<string, unknown>) => { Object.assign(rows.find((r) => r._id === id)!, value); },
    query: () => {
      const cond: [string, unknown][] = [];
      const q = {
        withIndex: (_n: string, fn: (b: unknown) => unknown) => { const f = { eq: (k: string, x: unknown) => { cond.push([k, x]); return f; } }; fn(f); return q; },
        take: async (n: number) => rows.filter((r) => cond.every(([k, x]) => r[k] === x)).slice(0, n),
      };
      return q;
    },
  };
  const add = (extra: Record<string, unknown> = {}) => {
    const id = `reviewQueue:${rows.length + 1}`;
    rows.push({ studentId: "students:1", category: "BULLYING", severity: 2, status: "open", notifyParent: true, ...extra, _id: id, _creationTime: rows.length + 1 });
    return id as Id<"reviewQueue">;
  };
  return { ctx: { db } as unknown as QueryCtx & MutationCtx, rows, add };
}

const SECRET = "test-secret";
let saved: string | undefined;
beforeEach(() => { saved = process.env.BOT_SECRET; process.env.BOT_SECRET = SECRET; });
afterEach(() => { if (saved === undefined) delete process.env.BOT_SECRET; else process.env.BOT_SECRET = saved; });

describe("reviewer queue", () => {
  it("refuses list and close without the right secret, and when the env secret is unset", async () => {
    const s = database(); const id = s.add();
    await expect(listOpenHandler(s.ctx, { botSecret: "wrong" })).rejects.toThrow("unauthorized");
    await expect(closeHandler(s.ctx, { botSecret: "wrong", id, status: "reviewed" })).rejects.toThrow("unauthorized");
    expect(s.rows[0].status).toBe("open");
    delete process.env.BOT_SECRET;
    await expect(listOpenHandler(s.ctx, { botSecret: "" })).rejects.toThrow("unauthorized");
    await expect(closeHandler(s.ctx, { botSecret: "", id, status: "reviewed" })).rejects.toThrow("unauthorized");
  });

  it("lists only open rows, withheldPush first, minimal fields", async () => {
    const s = database();
    s.add({ category: "BULLYING" });
    s.add({ category: "SELF_HARM", withheldPush: true, severity: 4 });
    s.add({ status: "reviewed" });
    s.add({ category: "GROOMING", withheldPush: true, severity: 4 });
    const list = await listOpenHandler(s.ctx, { botSecret: SECRET });
    expect(list.map((r) => r.category)).toEqual(["SELF_HARM", "GROOMING", "BULLYING"]);
    expect(Object.keys(list[0]).sort()).toEqual(["category", "createdAt", "id", "notifyParent", "severity", "studentId", "withheldPush"]);
  });

  it("bounds the response", async () => {
    const s = database();
    for (let i = 0; i < REVIEW_LIST_LIMIT + 20; i++) s.add();
    expect((await listOpenHandler(s.ctx, { botSecret: SECRET })).length).toBe(REVIEW_LIST_LIMIT);
  });

  it("close changes only status, is idempotent, and does not flip a closed row", async () => {
    const s = database(); const id = s.add({ withheldPush: true });
    const before = { ...s.rows[0] };
    expect(await closeHandler(s.ctx, { botSecret: SECRET, id, status: "reviewed" })).toEqual({ status: "reviewed" });
    expect(s.rows[0]).toEqual({ ...before, status: "reviewed" });
    expect(await closeHandler(s.ctx, { botSecret: SECRET, id, status: "reviewed" })).toEqual({ status: "reviewed" });
    expect(await closeHandler(s.ctx, { botSecret: SECRET, id, status: "dismissed" })).toEqual({ status: "reviewed" });
    expect((await listOpenHandler(s.ctx, { botSecret: SECRET })).length).toBe(0);
    expect(await closeHandler(s.ctx, { botSecret: SECRET, id: "reviewQueue:99" as Id<"reviewQueue">, status: "dismissed" })).toEqual({ status: "missing" });
  });
});
