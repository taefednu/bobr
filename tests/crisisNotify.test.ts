import { describe, expect, it } from "vitest";
import { abuseRowCounts, crisisPushSuppressed, parentNotifyDecision } from "../lib/safety/crisis";
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
  it("открытая — да, закрытая свежая (<90 дн) — да, закрытая старая — нет, другая категория — нет", () => {
    expect(abuseRowCounts({ category: "ABUSE_HOME", status: "open", _creationTime: 0 }, now)).toBe(true);
    expect(abuseRowCounts({ category: "ABUSE_HOME", status: "dismissed", _creationTime: now - 89 * DAY }, now)).toBe(true);
    expect(abuseRowCounts({ category: "ABUSE_HOME", status: "reviewed", _creationTime: now - 91 * DAY }, now)).toBe(false);
    expect(abuseRowCounts({ category: "SELF_HARM", status: "open", _creationTime: now }, now)).toBe(false);
  });
});

describe("crisisPushSuppressed", () => {
  const now = 10 * DAY;
  it("неотправленный → пропуск", () => {
    expect(crisisPushSuppressed([{ parentId: "p", kind: "crisis", createdAt: 0 }], "p", now)).toBe(true);
  });
  it("отправленный 59 мин назад → пропуск, 61 мин → нет", () => {
    const row = (age: number) => [{ parentId: "p", kind: "crisis", createdAt: now - age, sentAt: now - age + 1 }];
    expect(crisisPushSuppressed(row(59 * 60_000), "p", now)).toBe(true);
    expect(crisisPushSuppressed(row(61 * 60_000), "p", now)).toBe(false);
  });
  it("другой родитель и другой kind не мешают", () => {
    expect(crisisPushSuppressed([{ parentId: "q", kind: "crisis", createdAt: now }], "p", now)).toBe(false);
    expect(crisisPushSuppressed([{ parentId: "p", kind: "taught_bobr", createdAt: now }], "p", now)).toBe(false);
  });
});
