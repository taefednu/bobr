// Проверка Telegram Mini App initData (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
// Чистая функция на Web Crypto: работает и в Convex-экшене, и в vitest.
import { timingSafeEqual } from "./secure";

export const INIT_DATA_MAX_AGE_SEC = 24 * 3600;
const CLOCK_SKEW_SEC = 300;

export type InitDataResult =
  | { ok: true; telegramUserId: string }
  | { ok: false; reason: "malformed" | "bad_hash" | "stale" | "no_user" };

async function hmac(key: Uint8Array | string, msg: string): Promise<Uint8Array> {
  const raw = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const k = await crypto.subtle.importKey("raw", raw as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)));
}
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

export async function verifyInitData(initData: string, botToken: string, nowSec: number): Promise<InitDataResult> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !botToken) return { ok: false, reason: "malformed" };
  params.delete("hash");
  const dataCheck = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = await hmac("WebAppData", botToken);
  const expected = hex(await hmac(secret, dataCheck));
  if (!timingSafeEqual(expected, hash.toLowerCase())) return { ok: false, reason: "bad_hash" };
  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || nowSec - authDate > INIT_DATA_MAX_AGE_SEC || authDate - nowSec > CLOCK_SKEW_SEC)
    return { ok: false, reason: "stale" };
  try {
    const id: unknown = (JSON.parse(params.get("user") ?? "null") as { id?: unknown } | null)?.id;
    if (typeof id !== "number" || !Number.isSafeInteger(id)) return { ok: false, reason: "no_user" };
    return { ok: true, telegramUserId: String(id) };
  } catch {
    return { ok: false, reason: "no_user" };
  }
}
