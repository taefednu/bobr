import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";

// Сократический урок: guard — заглушка через callStructured, сети нет. Проверяем, что похвала только при SAFE и маска при сбое guard.
const guardOut = vi.hoisted(() => ({ value: { ok: false, reason: "test", meta: { ms: 0 } } as unknown }));
vi.mock("../lib/llm", async (orig) => ({
  ...(await orig<typeof import("../lib/llm")>()),
  callStructured: async (o: { step: string }) => (o.step === "guardIn" ? guardOut.value : { ok: false, reason: "test", meta: { ms: 0 } }),
}));
const { turn } = await import("../convex/turn");
const handler = (turn as unknown as { _handler: (c: unknown, a: unknown) => Promise<unknown> })._handler;

const task = { id: "t1", topic: "N8", kind: "word", answer: "5/6", numbersShown: ["1/2", "1/3"], params: {} };
const ctxOf = () => {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const turnCtx = { lang: "ru", task, hintLevel: 0, lastVerdict: "", riskCount: 0, recent: [], last6: [], turnNo: 3,
    socratic: { taskInstanceId: "p1", lessonSessionId: "l1", attemptCount: 0, escalationLevel: 1, misconceptionTag: null, interestTheme: "Football" } };
  return { calls, ctx: {
    runQuery: async (ref: never) => (getFunctionName(ref) === "session:resolve" ? "students:1" : turnCtx),
    runMutation: async (ref: never, args: Record<string, unknown>) => {
      const name = getFunctionName(ref); calls.push({ name, args });
      return name === "conductor:recordText" ? 3 : true;
    },
  } };
};
const run = async (text: string) => { const a = ctxOf(); await handler(a.ctx, { token: "t", input: { type: "text", value: text } }); return a.calls; };
const reply = (calls: { name: string; args: Record<string, unknown> }[]) => calls.find((c) => c.name === "conductor:recordReply")?.args.reply as string;
const guard = (category: string, severity: number) => { guardOut.value = { ok: true, value: { category, severity }, meta: { ms: 0 } }; };
beforeEach(() => guard("SAFE", 0));

describe("turn: сократический урок, свободный текст", () => {
  it("SAFE: вопрос с похвалой", async () => expect(reply(await run("а почему так"))).toMatch(/^Хороший вопрос!/));
  it.each(["BULLYING", "DEPENDENCY", "VIOLENCE", "OFF_TOPIC_UNSAFE", "JAILBREAK"])("%s: без похвалы", async (cat) => {
    guard(cat, 1);
    expect(reply(await run("текст"))).not.toMatch(/Хороший вопрос/);
  });
  it.each(["BULLYING", "DEPENDENCY", "VIOLENCE"])("%s: реплика про доверенного взрослого", async (cat) => {
    guard(cat, 1);
    expect(reply(await run("текст"))).toMatch(/взросл|мам/);
  });
  it("сбой guard: нейтрально без похвалы, строка ребёнка маскируется до возврата", async () => {
    guardOut.value = { ok: false, reason: "timeout", meta: { ms: 0 } };
    const calls = await run("текст");
    expect(reply(calls)).not.toMatch(/Хороший вопрос/);
    expect(calls.find((c) => c.name === "conductor:maskChildTurn")?.args).toEqual({ studentId: "students:1", turnNo: 3 });
  });
});
