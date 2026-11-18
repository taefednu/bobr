import { describe, expect, it } from "vitest";
import { CHAT_SCAN_ROWS, checkAccess, childTimesOf } from "../lib/chat/limits";
import { flagExpired, flagsCutoff, turnsCutoff } from "../convex/retention";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 18, 7, 0); // 12:00 Ташкент

describe("session limit counts child messages of the whole session (find 7)", () => {
  // ребёнок пишет каждые 64 с, после каждого сообщения реплика; один собеседник
  const rows = (n: number, take: number) => {
    const by: Record<"ustoz" | "bobr", { role: string; ts: number }[]> = { ustoz: [], bobr: [] };
    for (let i = 0; i < n; i++) {
      const ts = NOW - (n - i) * 64_000, p = "ustoz" as const;
      by[p].push({ role: "child", ts }, { role: p, ts: ts + 1_000 });
    }
    return [by.ustoz, by.bobr].map((r) => r.slice(-take)); // «последние take строк» по desc-индексу
  };
  it("closes with session_limit when the window covers the session", () => {
    const ts = childTimesOf(rows(30, CHAT_SCAN_ROWS));
    expect(ts).toHaveLength(30);
    expect(checkAccess({ now: NOW, ts }).reason).toBe("session_limit");
  });
  it("the old 30-row window never reached the limit", () => {
    expect(checkAccess({ now: NOW, ts: childTimesOf(rows(30, 30)) }).open).toBe(true);
  });
});

describe("retention selection (find 9)", () => {
  const old = (over: object) => ({ category: "BULLYING", status: "dismissed", severity: 1, _creationTime: NOW - 91 * DAY, ...over });
  it("cutoffs: turns 30 days, flags 90", () => {
    expect(turnsCutoff(NOW)).toBe(NOW - 30 * DAY);
    expect(flagsCutoff(NOW)).toBe(NOW - 90 * DAY);
  });
  it("closed flag older than 90 days goes, younger stays", () => {
    expect(flagExpired(old({}), NOW)).toBe(true);
    expect(flagExpired(old({ _creationTime: NOW - 89 * DAY }), NOW)).toBe(false);
  });
  it("open flags never go, even ancient ones, including ABUSE_HOME", () => {
    expect(flagExpired(old({ status: "open" }), NOW)).toBe(false);
    expect(flagExpired(old({ status: "open", category: "ABUSE_HOME", severity: 4 }), NOW)).toBe(false);
  });
  it("closed ABUSE_HOME still holding the push stays; expired one goes", () => {
    expect(flagExpired(old({ category: "ABUSE_HOME", severity: 3, _creationTime: NOW - 80 * DAY }), NOW)).toBe(false);
    expect(flagExpired(old({ category: "ABUSE_HOME", severity: 3 }), NOW)).toBe(true);
  });
});
