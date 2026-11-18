import { describe, expect, it } from "vitest";
import { ABUSE_LOOKUP_BOUND, abuseRowCounts, crisisPushSuppressed, parentNotifyDecision, priorAbuseFrom } from "../lib/safety/crisis";
import { preGuard } from "../lib/safety/preGuard";

const DAY = 86_400_000;

describe("preGuard: все совпавшие категории", () => {
  it("ru: SELF_HARM + ABUSE_HOME в одном сообщении", () => {
    const c = preGuard("хочу умереть, папа меня бьёт", "ru").crisis;
    expect(c).toMatchObject({ category: "SELF_HARM", trigger: "ru_want_die", also: ["ABUSE_HOME"] });
  });
  it("uz (апостроф ʻ): SELF_HARM + ABUSE_HOME", () => {
    const c = preGuard("oʻlgim keladi, dadam meni uradi", "uz").crisis;
    expect(c).toMatchObject({ category: "SELF_HARM", also: ["ABUSE_HOME"] });
  });
  it("одна категория — поля also нет", () => {
    expect(preGuard("хочу умереть", "ru").crisis).toEqual({ category: "SELF_HARM", trigger: "ru_want_die" });
  });
});

describe("parentNotifyDecision", () => {
  it("SELF_HARM один → срочно", () => {
    expect(parentNotifyDecision({ categories: ["SELF_HARM"], priorAbuse: false })).toEqual({ notify: true, urgent: true });
  });
  it("GROOMING → не срочно", () => {
    expect(parentNotifyDecision({ categories: ["GROOMING"], priorAbuse: false })).toEqual({ notify: true, urgent: false });
  });
  it("SELF_HARM + ABUSE_HOME → никому", () => {
    expect(parentNotifyDecision({ categories: ["SELF_HARM", "ABUSE_HOME"], priorAbuse: false }).notify).toBe(false);
  });
  it("ABUSE_HOME в истории + новый SELF_HARM → никому", () => {
    expect(parentNotifyDecision({ categories: ["SELF_HARM"], priorAbuse: true }).notify).toBe(false);
  });
});

describe("abuseRowCounts", () => {
  const now = 200 * DAY;
  const row = (o: Partial<{ category: string; status: string; severity: number; _creationTime: number }>) =>
    ({ category: "ABUSE_HOME", status: "open", severity: 3, _creationTime: 0, ...o });
  it("открытая — да, закрытая свежая (<90 дн) — да, закрытая старая — нет, другая категория — нет", () => {
    expect(abuseRowCounts(row({}), now)).toBe(true);
    expect(abuseRowCounts(row({ status: "dismissed", _creationTime: now - 89 * DAY }), now)).toBe(true);
    expect(abuseRowCounts(row({ status: "reviewed", _creationTime: now - 91 * DAY }), now)).toBe(false);
    expect(abuseRowCounts(row({ category: "SELF_HARM", _creationTime: now }), now)).toBe(false);
  });
  it("слабый флаг (severity 1) держит пуш 24 ч, даже открытый; сильный — пока открыт / 90 дней", () => {
    expect(abuseRowCounts(row({ severity: 1, _creationTime: now - 3_600_000 }), now)).toBe(true);
    expect(abuseRowCounts(row({ severity: 1, _creationTime: now - 25 * 3_600_000 }), now)).toBe(false);
    expect(abuseRowCounts(row({ severity: 2, _creationTime: 0 }), now)).toBe(true);
  });
  it("priorAbuseFrom: пусто — нет; лимит достигнут без ответа — fail closed", () => {
    expect(priorAbuseFrom([], now)).toBe(false);
    const old = Array.from({ length: ABUSE_LOOKUP_BOUND }, () => row({ status: "dismissed", _creationTime: 0 }));
    expect(priorAbuseFrom(old.slice(1), 400 * DAY)).toBe(false);
    expect(priorAbuseFrom(old, 400 * DAY)).toBe(true);
  });
});

describe("crisisPushSuppressed: первый пуш сразу, повторы того же эпизода склеиваются", () => {
  const now = 10 * DAY;
  const K = "crisis:s:SELF_HARM";
  const row = (o: object) => ({ dedupeKey: K, urgent: true, createdAt: now - 1000, ...o });
  it("неотправленный с тем же ключом → пропуск", () => {
    expect(crisisPushSuppressed([row({})], K, true, now)).toBe(true);
  });
  it("отправленный < 10 мин назад с тем же ключом — тот же эпизод, склеиваем; позже — новый пуш", () => {
    expect(crisisPushSuppressed([row({ sentAt: now - 500 })], K, true, now)).toBe(true);
    expect(crisisPushSuppressed([row({ sentAt: now - 11 * 60_000, createdAt: now - 12 * 60_000 })], K, true, now)).toBe(false);
  });
  it("неотправленный старше 10 мин не гасит", () => {
    expect(crisisPushSuppressed([row({ createdAt: now - 11 * 60_000 })], K, true, now)).toBe(false);
  });
  it("другой ключ не мешает; неурочная строка не гасит срочную", () => {
    expect(crisisPushSuppressed([row({ dedupeKey: "crisis:s:GROOMING" })], K, true, now)).toBe(false);
    expect(crisisPushSuppressed([row({ urgent: false })], K, true, now)).toBe(false);
    expect(crisisPushSuppressed([row({ urgent: true })], K, false, now)).toBe(true);
  });
});
