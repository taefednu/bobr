import { describe, expect, it } from "vitest";
import { deferredPut } from "../lib/bobr/deferredCache";

describe("deferredPut", () => {
  const base = () => {
    const rows: string[][] = [];
    return { rows, get: async (k: string) => (k === "hit" ? "v" : null), put: async (k: string, s: string, r: string) => { rows.push([k, s, r]); } };
  };
  it("put не доходит до базы без flush, get идёт сразу", async () => {
    const b = base();
    const d = deferredPut(b);
    await d.cache.put("k", "judge", "{}");
    expect(await d.cache.get("hit")).toBe("v");
    expect(b.rows).toEqual([]);
  });
  it("flush пишет один раз", async () => {
    const b = base();
    const d = deferredPut(b);
    await d.cache.put("k", "judge", "{}");
    await d.flush();
    await d.flush();
    expect(b.rows).toEqual([["k", "judge", "{}"]]);
  });
});
