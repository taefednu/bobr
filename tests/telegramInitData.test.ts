import { describe, expect, it } from "vitest";
import { verifyInitData } from "../lib/telegram/initData";
import { timingSafeEqual } from "../lib/telegram/secure";

const TOKEN = "123456:TEST-bot-token";
const NOW = 1_800_000_000;

async function hmac(key: string | Uint8Array, msg: string) {
  const k = await crypto.subtle.importKey("raw", (typeof key === "string" ? new TextEncoder().encode(key) : key) as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)));
}
/** Строит initData ровно по алгоритму из документации Telegram. */
async function build(fields: Record<string, string>, token = TOKEN) {
  const dcs = Object.entries(fields).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
  const hash = Array.from(await hmac(await hmac("WebAppData", token), dcs), (b) => b.toString(16).padStart(2, "0")).join("");
  return new URLSearchParams({ ...fields, hash }).toString();
}
const base = { auth_date: String(NOW - 60), query_id: "AAH1", user: JSON.stringify({ id: 4242, first_name: "Ann" }) };

describe("verifyInitData", () => {
  it("valid → telegramUserId", async () => {
    expect(await verifyInitData(await build(base), TOKEN, NOW)).toEqual({ ok: true, telegramUserId: "4242" });
  });
  it("tampered field fails", async () => {
    const tampered = (await build(base)).replace("4242", "4243");
    expect(await verifyInitData(tampered, TOKEN, NOW)).toEqual({ ok: false, reason: "bad_hash" });
  });
  it("wrong hash fails", async () => {
    const p = new URLSearchParams(await build(base));
    p.set("hash", "0".repeat(64));
    expect(await verifyInitData(p.toString(), TOKEN, NOW)).toEqual({ ok: false, reason: "bad_hash" });
  });
  it("other bot token fails", async () => {
    expect((await verifyInitData(await build(base, "999:other"), TOKEN, NOW)).ok).toBe(false);
  });
  it("auth_date older than 24 h fails (even with a correct hash)", async () => {
    const old = await build({ ...base, auth_date: String(NOW - 24 * 3600 - 1) });
    expect(await verifyInitData(old, TOKEN, NOW)).toEqual({ ok: false, reason: "stale" });
  });
  it("missing hash fails", async () => {
    expect((await verifyInitData("auth_date=1&user=%7B%7D", TOKEN, NOW)).ok).toBe(false);
  });
});

describe("timingSafeEqual", () => {
  it("equal / different / different length", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });
});
