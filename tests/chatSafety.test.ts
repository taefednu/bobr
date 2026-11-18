import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";
import type { MutationCtx } from "../convex/_generated/server";
import { postChecksChat } from "../lib/chat/postChecks";
import { scanMath } from "../lib/chat/claims";

// guard и LLM — заглушки: проверяем порядок и решения кода в action chat:send, сети нет.
const guardResult = vi.hoisted(() => ({ value: { ok: true, value: { category: "SAFE", severity: 0 } } as unknown }));
vi.mock("../convex/turn", () => ({
  guardStep: async () => guardResult.value, llm: () => ({}), cacheOf: () => undefined, outputOk: async () => true,
}));
vi.mock("../lib/llm", async (orig) => ({ ...(await orig<typeof import("../lib/llm")>()), callStructured: async () => ({ ok: false, reason: "test" }) }));
const { send, writeChild, maskChatTurn } = await import("../convex/chat");

const handlerOf = (fn: unknown) => (fn as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;
type Call = { name: string; args: Record<string, unknown> };
function fakeAction(access: { open: boolean }) {
  const calls: Call[] = [];
  const ctx = {
    runQuery: async (ref: never) => getFunctionName(ref) === "session:resolve" ? "students:1"
      : { lang: "ru", state: "HOME", riskCount: 0, access, history: [], recent: [], task: null },
    runMutation: async (ref: never, args: Record<string, unknown>) => {
      const name = getFunctionName(ref); calls.push({ name, args });
      return name === "chat:writeChild" ? { ok: true, id: "turns:9" } : null;
    },
  };
  return { ctx, calls, names: () => calls.map((c) => c.name) };
}
const run = (ctx: unknown, text: string) => handlerOf(send)(ctx, { token: "t", who: "bobr", text }) as Promise<{ status: string }>;
const guard = (category: string, severity: number) => { guardResult.value = { ok: true, value: { category, severity } }; };
beforeEach(() => guard("SAFE", 0));

describe("chat:send порядок и решения", () => {
  it.each([
    "завтра встретимся с другом из игры, ему 25 лет",
    "я отправила свои фото в телеграм, теперь мне страшно",
    "internetdagi do'stim bilan uchrashamiz, u 30 yoshda",
  ])("GROOMING sev 3 идёт в CRISIS: %s", async (text) => {
    guard("GROOMING", 3);
    const a = fakeAction({ open: true });
    expect(await run(a.ctx, text)).toEqual({ status: "crisis" });
    expect(a.names()).toContain("conductor:setCrisis");
  });
  it("просьба к самому персонажу остаётся без CRISIS", async () => {
    guard("GROOMING", 3);
    const a = fakeAction({ open: true });
    expect((await run(a.ctx, "дай свой телефон")).status).toBe("fallback");
    expect(a.names()).not.toContain("conductor:setCrisis");
  });
  it("preGuard CRISIS срабатывает в закрытом чате, текст не пишется", async () => {
    const a = fakeAction({ open: false });
    expect(await run(a.ctx, "я хочу умереть")).toEqual({ status: "crisis" });
    expect(a.names()).toEqual(["conductor:setCrisis"]);
  });
  it("обычный текст в закрытом чате: closed, ничего не пишется", async () => {
    const a = fakeAction({ open: false });
    expect(await run(a.ctx, "привет")).toEqual({ status: "closed" });
    expect(a.names()).toEqual([]);
  });
  it("PII только от guard: строка ребёнка маскируется, в том числе на ветке «просьба к персонажу»", async () => {
    guard("PII", 1);
    for (const text of ["моя соседка Лола ходит в школу рядом", "дай свой телефон"]) {
      const a = fakeAction({ open: true });
      await run(a.ctx, text);
      expect(a.calls.find((c) => c.name === "chat:maskChatTurn")?.args).toEqual({ turnId: "turns:9" });
    }
  });
});

describe("chat:maskChatTurn / writeChild", () => {
  it("writeChild возвращает id, maskChatTurn заменяет текст маской и не трогает чужие строки", async () => {
    const rows: Record<string, unknown>[] = [
      { _id: "students:1", state: "HOME", riskCount: 0 },
      { _id: "turns:r", role: "bobr", sessionId: "chat:bobr:students:1", text: "привет" },
    ];
    const db = {
      get: async (_t: string, id: string) => rows.find((r) => r._id === id) ?? null,
      patch: async (_t: string, id: string, v: object) => { Object.assign(rows.find((r) => r._id === id)!, v); },
      insert: async (_t: string, v: object) => { rows.push({ ...v, _id: "turns:c" }); return "turns:c"; },
      query: () => ({ withIndex: () => ({ order: () => ({ take: async () => [] }) }) }),
    };
    const ctx = { db } as unknown as MutationCtx;
    // 12:00 Ташкента: чат открыт
    vi.setSystemTime(new Date("2026-11-18T07:00:00Z"));
    const w = (await handlerOf(writeChild)(ctx, { studentId: "students:1", who: "bobr", text: "моя соседка" })) as { ok: boolean; id?: string };
    vi.useRealTimers();
    expect(w).toEqual({ ok: true, id: "turns:c" });
    await handlerOf(maskChatTurn)(ctx, { turnId: "turns:r" });
    expect(rows[1].text).toBe("привет"); // реплика собеседника не маскируется
    await handlerOf(maskChatTurn)(ctx, { turnId: "turns:c" });
    expect(rows[2].text).toBe("[PII]");
  });
});

describe("похвала за неверный ответ ребёнка", () => {
  const base = { lang: "ru" as const, task: null, childNumbers: [], recent: [] };
  const wrong = scanMath("1/2 + 1/3 = 2/5, правильно?").claims;
  const right = scanMath("1/2 + 1/3 = 5/6, правильно?").claims;
  const turn = (reply: string) => ({ reply, pose: "happy" as const });
  it.each(["ustoz", "bobr"] as const)("%s: подтверждение при ok:false -> claim", (who) => {
    for (const r of ["Верно! Ты молодец", "Да, правильно, молодец!", "Всё точно"])
      expect(postChecksChat(turn(r), { ...base, who, childClaims: wrong })).toEqual({ ok: false, reason: "claim" });
    expect(postChecksChat(turn("Toʻgʻri, barakalla!"), { ...base, lang: "uz", who, childClaims: wrong })).toEqual({ ok: false, reason: "claim" });
  });
  it("отрицание и верный ответ проходят", () => {
    expect(postChecksChat(turn("Неверно, давай разберём вместе"), { ...base, who: "bobr", childClaims: wrong }).ok).toBe(true);
    expect(postChecksChat(turn("Пока не совсем верно, попробуй общий знаменатель"), { ...base, who: "ustoz", childClaims: wrong }).ok).toBe(true);
    expect(postChecksChat(turn("Верно!"), { ...base, who: "bobr", childClaims: right }).ok).toBe(true);
    expect(postChecksChat(turn("Верно!"), { ...base, who: "bobr" }).ok).toBe(true);
  });
});

describe("выход из кризиса чата", () => {
  it("leaveCrisis возвращает стейт урока и оставляет блок болталки", async () => {
    const { leaveCrisis } = await import("../convex/conductor");
    const until = Date.now() + 86_400_000;
    const row: Record<string, unknown> = { _id: "students:1", state: "CRISIS", stateBeforeCrisis: "HOME", chatBlockedUntil: until };
    const db = {
      get: async () => row,
      patch: async (_t: string, _id: string, v: Record<string, unknown>) => { for (const [k, e] of Object.entries(v)) { if (e === undefined) delete row[k]; else row[k] = e; } },
      query: () => ({ withIndex: () => ({ unique: async () => ({ kind: "child", studentId: "students:1", expiresAt: until }) }) }),
    };
    await handlerOf(leaveCrisis)({ db }, { token: "t" });
    expect(row.state).toBe("HOME");
    expect(row.chatBlockedUntil).toBe(until);
  });
});
