import test from "node:test";
import assert from "node:assert/strict";
import { daysUntilTest, formatParentDate, knownHouseState, nextTopicDay } from "./view-model.ts";

test("test countdown uses the Tashkent calendar, including UTC midnight boundary", () => {
  assert.equal(daysUntilTest("2026-11-19", Date.parse("2026-11-18T18:59:59Z")), 1);
  assert.equal(daysUntilTest("2026-11-19", Date.parse("2026-11-18T19:00:00Z")), 0);
  assert.equal(daysUntilTest("2026-11-17", Date.parse("2026-11-18T19:00:00Z")), 0);
});

test("next topic step skips past lessons and other topics", () => {
  const days = [
    { date: "2026-11-17", items: [{ topic: "N8" }] },
    { date: "2026-11-18", items: [{ topic: "N6" }] },
    { date: "2026-11-19", items: [{ topic: "N8" }] },
  ];
  assert.equal(nextTopicDay(days, "N8", "2026-11-18"), days[2]);
  assert.equal(nextTopicDay(days, "N6", "2026-11-18"), days[1]);
  assert.equal(nextTopicDay(days, "N8", "2026-11-20"), null);
  assert.equal(nextTopicDay(days, "N8", null), null);
  assert.equal(nextTopicDay(days, null, "2026-11-18"), null);
});

test("unknown dates and statuses do not become zero progress", () => {
  assert.equal(daysUntilTest(null, Date.now()), null);
  assert.equal(daysUntilTest("bad-date", Date.now()), null);
  assert.equal(daysUntilTest("2026-02-30", Date.now()), null);
  assert.equal(knownHouseState("future-state"), null);
  assert.equal(knownHouseState("alive"), "alive");
});

test("parent date format uses stable numeric fields across ICU locale versions", () => {
  assert.equal(formatParentDate("2026-11-21", "uz"), "21.11.2026");
  assert.equal(formatParentDate("2026-11-21", "ru"), "21.11.2026");
  assert.equal(formatParentDate(Date.parse("2026-11-20T21:00:00Z"), "uz"), "21.11.2026");
  assert.equal(formatParentDate("2026-02-30", "ru"), null);
  assert.equal(formatParentDate("invalid", "uz"), null);
});
