import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { cacheKey, callStructured, createBreaker, type LlmCache, type LlmClient } from "../lib/llm";

const Schema = z.object({ reply: z.string() });
const H = new Headers();

function fake(impl: () => unknown) {
  const parse = vi.fn(async () => impl());
  return { client: { messages: { parse } } as unknown as LlmClient, parse };
}
function memCache(init: Record<string, string> = {}) {
  const store = new Map(Object.entries(init));
  const cache: LlmCache = {
    get: async (k) => store.get(k) ?? null,
    put: vi.fn(async (k: string, _s: string, j: string) => void store.set(k, j)),
  };
  return { cache, store };
}
const base = (client: LlmClient, over: Record<string, unknown> = {}) => ({
  client, step: "ustozTurn", model: "claude-sonnet-5-5", schema: Schema, system: "SYS", tail: "TAIL",
  timeoutMs: 12_000, effort: "low" as const, cache: memCache().cache, cacheKey: "k",
  mode: "live" as const, breaker: createBreaker({ errors: 3, windowMs: 30_000, statuses: [429, 529] }, () => 0),
  ...over,
});

describe("callStructured", () => {
  it("success returns value, sends cached system block, tail as user, no sampling params", async () => {
    const { client, parse } = fake(() => ({ stop_reason: "end_turn", parsed_output: { reply: "ok" } }));
    const r = await callStructured(base(client));
    expect(r).toMatchObject({ ok: true, value: { reply: "ok" }, source: "live" });
    const [params, opts] = parse.mock.calls[0] as unknown as [Record<string, unknown>, Record<string, unknown>];
    expect(params.system).toEqual([{ type: "text", text: "SYS", cache_control: { type: "ephemeral", ttl: "1h" } }]);
    expect(params.messages).toEqual([{ role: "user", content: "TAIL" }]);
    expect(params).not.toHaveProperty("temperature");
    expect((params.output_config as { effort: string }).effort).toBe("low");
    expect(opts).toEqual({ timeout: 12_000, maxRetries: 1 });
  });

  it("refusal and parsed null are failures", async () => {
    const a = fake(() => ({ stop_reason: "refusal", parsed_output: { reply: "x" } }));
    expect(await callStructured(base(a.client))).toMatchObject({ ok: false, reason: "refusal" });
    const b = fake(() => ({ stop_reason: "end_turn", parsed_output: null }));
    expect(await callStructured(base(b.client))).toMatchObject({ ok: false, reason: "parse_null" });
  });

  it("classifies SDK errors by class", async () => {
    const t = fake(() => { throw new Anthropic.APIConnectionTimeoutError(); });
    expect(await callStructured(base(t.client))).toMatchObject({ ok: false, reason: "timeout" });
    const o = fake(() => { throw new Anthropic.APIError(529, undefined, "x", H); });
    expect(await callStructured(base(o.client))).toMatchObject({ ok: false, reason: "api_error" });
    const p = fake(() => { throw new Error("boom"); });
    expect(await callStructured(base(p.client))).toMatchObject({ ok: false, reason: "api_error" });
  });

  it("3x429 opens the breaker; 4th call does not touch the client", async () => {
    const { client, parse } = fake(() => { throw new Anthropic.RateLimitError(429, undefined, "x", H); });
    const args = base(client);
    for (let i = 0; i < 3; i++) expect(await callStructured(args)).toMatchObject({ ok: false, reason: "rate_limited" });
    expect(await callStructured(args)).toMatchObject({ ok: false, reason: "breaker_open" });
    expect(parse).toHaveBeenCalledTimes(3);
  });

  it("breaker closes after the window (injected clock); timeouts do not count", () => {
    let t = 0;
    const b = createBreaker({ errors: 3, windowMs: 30_000, statuses: [429, 529] }, () => t);
    b.record(undefined); b.record(500); b.record(429); b.record(529);
    expect(b.isOpen()).toBe(false);
    b.record(429);
    expect(b.isOpen()).toBe(true);
    t = 30_001;
    expect(b.isOpen()).toBe(false);
  });

  it("replay hit and miss make zero client calls", async () => {
    const { client, parse } = fake(() => ({ parsed_output: { reply: "live" } }));
    const hit = await callStructured(base(client, { mode: "replay", cache: memCache({ k: '{"reply":"cached"}' }).cache }));
    expect(hit).toMatchObject({ ok: true, value: { reply: "cached" }, source: "replay" });
    expect(await callStructured(base(client, { mode: "replay" }))).toMatchObject({ ok: false, reason: "replay_miss" });
    expect(await callStructured(base(client, { mode: "replay", cache: memCache({ k: "not json" }).cache }))).toMatchObject({ ok: false, reason: "replay_miss" });
    expect(parse).not.toHaveBeenCalled();
  });

  it("live success writes the cache; cache failure does not break the turn", async () => {
    const { client } = fake(() => ({ parsed_output: { reply: "ok" } }));
    const m = memCache();
    await callStructured(base(client, { cache: m.cache }));
    expect(m.store.get("k")).toBe('{"reply":"ok"}');
    expect(m.cache.put).toHaveBeenCalledWith("k", "ustozTurn", '{"reply":"ok"}');
    const bad: LlmCache = { get: async () => null, put: async () => { throw new Error("db"); } };
    expect((await callStructured(base(client, { cache: bad }))).ok).toBe(true);
  });
});

describe("cacheKey", () => {
  it("stable, hashes normInput, differs by input", () => {
    const k = { step: "ustozTurn", beat: "hint", itemId: "t1", lang: "ru" as const };
    expect(cacheKey(k)).toBe("ustozTurn|hint|t1|ru");
    const a = cacheKey({ ...k, normInput: "привет" });
    expect(a).toBe(cacheKey({ ...k, normInput: "привет" }));
    expect(a).not.toBe(cacheKey({ ...k, normInput: "пока" }));
    expect(a).not.toContain("привет");
  });
});

describe("thinkingOff", () => {
  it("Haiku → disabled, Sonnet 5.5 → between_tools (disabled на Sonnet 5.5 даёт 400)", async () => {
    const { thinkingOffFor } = await import("../lib/llm/call");
    expect(thinkingOffFor("claude-haiku-5-5")).toEqual({ type: "disabled" });
    expect(thinkingOffFor("claude-sonnet-5-5")).toEqual({ type: "between_tools" });
  });
});
