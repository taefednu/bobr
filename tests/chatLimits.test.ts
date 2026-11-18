import { describe, expect, it } from "vitest";
import { CHAT } from "../lib/config";
import { bumpDay, checkAccess, GAP_CAP_MS, gapCost, isNight, localDay, sessionMs } from "../lib/chat/limits";

// Asia/Tashkent = UTC+5: 12:00 местного = 07:00Z
const at = (h: number, m = 0) => Date.UTC(2026, 10, 18, h - 5, m);
const MIN = 60_000;

describe("chat limits", () => {
  it("night 21:00-07:00 local, edges", () => {
    expect(isNight(at(20, 59))).toBe(false);
    expect(isNight(at(21, 0))).toBe(true);
    expect(isNight(at(6, 59))).toBe(true);
    expect(isNight(at(7, 0))).toBe(false);
    expect(checkAccess({ now: at(22), ts: [] })).toEqual({ open: false, reason: "night", minutesLeft: 0 });
  });
  it("local day rolls over at Tashkent midnight, not UTC", () => {
    expect(localDay(Date.UTC(2026, 10, 18, 18, 59))).toBe("2026-11-18");
    expect(localDay(Date.UTC(2026, 10, 18, 19, 0))).toBe("2026-11-19");
  });
  it("crisis block wins over everything and expires", () => {
    const now = at(12);
    expect(checkAccess({ now, blockedUntil: now + 1, ts: [] }).reason).toBe("crisis_block");
    expect(checkAccess({ now, blockedUntil: now, ts: [] }).open).toBe(true);
    expect(checkAccess({ now: at(22), blockedUntil: at(23), ts: [] }).reason).toBe("crisis_block");
  });
  it("gap rules: capped at 2 min, over 10 min starts a new session", () => {
    expect(gapCost(0, 30_000)).toBe(30_000);
    expect(gapCost(0, 5 * MIN)).toBe(GAP_CAP_MS);
    expect(gapCost(0, 10 * MIN)).toBe(GAP_CAP_MS);
    expect(gapCost(0, 10 * MIN + 1)).toBe(0);
    expect(gapCost(null, 5)).toBe(0);
    const t = at(12);
    expect(sessionMs([t, t + 5 * MIN, t + 6 * MIN], t + 7 * MIN)).toBe(GAP_CAP_MS + MIN);
    // длинная пауза обнуляет сессию, старое не считается
    expect(sessionMs([t, t + 2 * MIN, t + 30 * MIN], t + 31 * MIN)).toBe(0);
    expect(sessionMs([t, t + 2 * MIN], t + 20 * MIN)).toBe(0);
  });
  it("session limit after sessionMinutes of chatting", () => {
    const t = at(12);
    const ts = Array.from({ length: 9 }, (_, i) => t + i * 2 * MIN); // 8 пауз по 2 мин = 16 > 15
    expect(checkAccess({ now: ts[8] + MIN, ts }).reason).toBe("session_limit");
    const ok = checkAccess({ now: ts[6] + MIN, ts: ts.slice(0, 7) }); // 12 мин
    expect(ok).toEqual({ open: true, reason: null, minutesLeft: CHAT.sessionMinutes - 12 });
    // после паузы больше 10 мин — снова открыто
    expect(checkAccess({ now: ts[8] + 11 * MIN, ts }).open).toBe(true);
  });
  it("day limit counts per local day and resets on a new day", () => {
    const now = at(12);
    const day = localDay(now);
    expect(checkAccess({ now, chatDay: day, chatMsToday: CHAT.dayMinutes * MIN, ts: [] }).reason).toBe("day_limit");
    expect(checkAccess({ now, chatDay: "2026-11-17", chatMsToday: CHAT.dayMinutes * MIN, ts: [] }).open).toBe(true);
    expect(checkAccess({ now, chatDay: day, chatMsToday: 29 * MIN, ts: [] }).minutesLeft).toBe(1);
    expect(bumpDay({ chatDay: day, chatMsToday: 5 * MIN }, now - MIN, now)).toEqual({ chatDay: day, chatMsToday: 6 * MIN });
    expect(bumpDay({ chatDay: "2026-11-17", chatMsToday: 5 * MIN }, now - MIN, now)).toEqual({ chatDay: day, chatMsToday: MIN });
    expect(bumpDay({}, now - 20 * MIN, now).chatMsToday).toBe(0);
  });
});
