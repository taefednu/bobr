import { describe, expect, it } from "vitest";
import type { MutationCtx } from "../convex/_generated/server";
import type { Id } from "../convex/_generated/dataModel";
import { submitAttemptHandler } from "../convex/conductor";
import { beginLesson, buildReferenceSteps } from "../convex/socraticState";
import { DEMO_PROBES } from "../lib/fractions";

type Row = Record<string, unknown> & { _id: string; _creationTime: number };
function database() {
  const tables = new Map<string, Row[]>();
  let sequence = 0;
  const rows = (table: string) => { if (!tables.has(table)) tables.set(table, []); return tables.get(table)!; };
  const get = (table: string, id: string) => rows(table).find((row) => row._id === id) ?? null;
  const db = {
    get: async (table: string, id: string) => get(table, id),
    insert: async (table: string, value: Record<string, unknown>) => {
      const id = `${table}:${++sequence}`;
      rows(table).push({ ...value, _id: id, _creationTime: sequence });
      return id;
    },
    patch: async (table: string, id: string, value: Record<string, unknown>) => {
      const row = get(table, id);
      if (!row) throw new Error("missing row");
      for (const [key, entry] of Object.entries(value)) { if (entry === undefined) delete row[key]; else row[key] = entry; }
    },
    query: (table: string) => {
      const conditions: [string, unknown][] = [];
      const query = {
        withIndex: (_name: string, fn: (q: unknown) => unknown) => {
          const filter = { eq: (key: string, value: unknown) => { conditions.push([key, value]); return filter; } };
          fn(filter); return query;
        },
        unique: async () => rows(table).find((row) => conditions.every(([key, value]) => row[key] === value)) ?? null,
      };
      return query;
    },
  };
  return { ctx: { db } as unknown as MutationCtx, rows, db };
}
async function fixture() {
  const store = database();
  const studentId = await store.db.insert("students", { lang: "ru", consent: true, state: "LESSON_SOLVE", riskCount: 0, currentTopic: "N9", turnNo: 0 }) as Id<"students">;
  const probe = DEMO_PROBES.find((task) => task.topic === "N9")!;
  const { seed: _seed, ...task } = { ...probe, kind: "word" as const };
  await beginLesson(store.ctx, studentId, task, 1);
  const current = () => store.rows("students")[0];
  let request = 0;
  const submit = (kind: "answer" | "hint", value: string, options: { requestId?: string; taskInstanceId?: string } = {}) => submitAttemptHandler(store.ctx, {
    studentId, taskInstanceId: (options.taskInstanceId ?? current().taskInstanceId) as Id<"taskProgress">,
    requestId: options.requestId ?? `00000000-0000-4000-8000-${String(++request).padStart(12, "0")}`, kind, value,
  });
  return { ...store, current, submit, studentId };
}

describe("Socratic mutation persistence", () => {
  it("commits diagnosis/counters/event together and deduplicates retried requests", async () => {
    const f = await fixture();
    const requestId = "00000000-0000-4000-8000-000000000001";
    const first = await f.submit("answer", "2/5", { requestId });
    const again = await f.submit("answer", "2/5", { requestId });
    expect(first.verdict).toBe("misconception:M9");
    expect(again).toEqual({ ...first, duplicate: true });
    expect(f.rows("taskProgress")[0]).toMatchObject({ attemptCount: 1, escalationLevel: 2, misconceptionTag: "added_denominators" });
    expect(f.rows("escalationEvents")).toHaveLength(1);
    expect(f.rows("escalationEvents")[0]).not.toHaveProperty("text");
  });
  it("preserves assisted outcome after next task resets to zero and rejects stale tasks", async () => {
    const f = await fixture();
    const oldId = f.current().taskInstanceId as string;
    await f.submit("hint", "");
    await f.submit("answer", "5/6");
    expect(f.rows("taskProgress")[0]).toMatchObject({ escalationLevel: 2, outcome: "assisted" });
    expect(f.rows("taskProgress")[1]).toMatchObject({ attemptCount: 0, escalationLevel: 1, outcome: "active" });
    expect(f.rows("topicStatus")[0].streak).toBe(0);
    expect((await f.submit("answer", "5/6", { taskInstanceId: oldId })).stale).toBe(true);
  });
  it("keeps counting incidents at level four and blocks attempts under CRISIS", async () => {
    const f = await fixture();
    for (let n = 0; n < 6; n++) await f.submit("hint", "");
    expect(f.rows("taskProgress")[0]).toMatchObject({ attemptCount: 6, escalationLevel: 4 });
    expect(f.rows("escalationEvents")).toHaveLength(6);
    await f.db.patch("students", f.studentId, { state: "CRISIS" });
    expect((await f.submit("hint", "")).stale).toBe(true);
    expect(f.rows("escalationEvents")).toHaveLength(6);
  });
  it("credits three different unassisted task forms, not three submissions of one task", async () => {
    const f = await fixture();
    const kinds = [];
    for (let n = 0; n < 3; n++) {
      const task = f.current().currentTask as { answer: string; kind: string };
      kinds.push(task.kind);
      await f.submit("answer", task.answer);
    }
    expect(kinds).toEqual(["word", "picture", "missing"]);
    expect(f.rows("topicStatus")[0]).toMatchObject({ streak: 3, level: "solved_self" });
    expect(f.rows("taskProgress").slice(0, 3).every((row) => row.outcome === "independent")).toBe(true);
  });
  it("keeps the independent streak when a correct fraction only needs reduction", async () => {
    const f = await fixture();
    await f.submit("answer", "5/6");
    const task = f.current().currentTask as { answer: string };
    const [numerator, denominator = "1"] = task.answer.split("/");
    expect((await f.submit("answer", `${BigInt(numerator) * 2n}/${BigInt(denominator) * 2n}`)).verdict).toBe("almost");
    expect(f.rows("topicStatus")[0].streak).toBe(1);
    expect(f.rows("taskProgress")[1]).toMatchObject({ attemptCount: 0, escalationLevel: 1 });
    await f.submit("answer", task.answer);
    expect(f.rows("topicStatus")[0].streak).toBe(2);
  });
  it("builds exact private reference steps without using LLM arithmetic", () => {
    const task = DEMO_PROBES.find((item) => item.topic === "N9")!;
    expect(buildReferenceSteps(task)).toEqual(["common_denominator:6", "left:3/6", "right:2/6", "sum:5/6", "answer:5/6"]);
  });
});
