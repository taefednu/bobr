// Слой вызова Claude: чистый TS, ходит в сеть только через переданный client. Скилл bobr-llm-call.
// Наружу не бросает: любой сбой — { ok: false, reason } → запасной путь вызывающего.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod/v4";
import { BREAKER, MAX_RETRIES } from "../config";
import type { Lang } from "../types";

/** Минимум клиента, который мы вызываем; настоящий `new Anthropic(...)` ему удовлетворяет, в тестах — фейк. */
export type LlmClient = {
  messages: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parse(params: any, options?: { timeout?: number; maxRetries?: number }): PromiseLike<{
      stop_reason?: string | null;
      parsed_output?: unknown;
      usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };
    }>;
  };
};

/** Один клиент на модуль. Ключ — из env Convex (ANTHROPIC_API_KEY). */
export const createClient = (apiKey?: string): LlmClient => new Anthropic({ apiKey, maxRetries: MAX_RETRIES });

export interface LlmCache {
  get(key: string): Promise<string | null>;
  put(key: string, step: string, json: string): Promise<void>;
}

/** FNV-1a 32 бит, синхронно; для ключа кэша, не для безопасности. */
const fnv = (s: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16).padStart(8, "0");
};

/** Ключ REPLAY (step, beat, itemId, lang[, normInput]). normInput — ТОЛЬКО уже маскированный текст
 *  (выход preGuard): в ключ идёт его хэш, но ПДн не должны доходить даже до хэша. */
export const cacheKey = (k: { step: string; beat: string; itemId: string; lang: Lang; normInput?: string }): string =>
  [k.step, k.beat, k.itemId, k.lang, ...(k.normInput ? [fnv(k.normInput)] : [])].join("|");

// ── Circuit breaker: 3 ошибки 429/529 за 30 с → «только задачи» на окно ──
export type Breaker = { isOpen(): boolean; record(status: number | undefined): void };

export function createBreaker(
  cfg: { errors: number; windowMs: number; statuses: readonly number[] } = BREAKER,
  now: () => number = Date.now,
): Breaker {
  let hits: number[] = [];
  let openUntil = 0;
  return {
    isOpen: () => now() < openUntil,
    record(status) {
      if (status === undefined || !cfg.statuses.includes(status)) return;
      const t = now();
      hits = [...hits.filter((h) => t - h < cfg.windowMs), t];
      if (hits.length >= cfg.errors) {
        openUntil = t + cfg.windowMs;
        hits = [];
      }
    },
  };
}

export type LlmFailure = "timeout" | "refusal" | "parse_null" | "breaker_open" | "replay_miss" | "api_error" | "rate_limited";
/** Замер вызова для диагностики хода (без текста): время и токены, в т.ч. попадание в кэш промпта. */
export type LlmMeta = { ms: number; input?: number; output?: number; cacheRead?: number; cacheWrite?: number };
export type LlmResult<T> =
  | { ok: true; value: T; source: "live" | "replay"; meta: LlmMeta }
  | { ok: false; reason: LlmFailure; meta: LlmMeta };

export type CallArgs<S extends z.ZodType> = {
  client: LlmClient;
  step: string;
  model: string;
  schema: S;
  /** Статичный префикс (байт в байт между вызовами) — кэшируется. */
  system: string;
  /** Всё переменное: beat, ввод ребёнка в ограждении, forbidden_lines. */
  tail: string;
  timeoutMs: number;
  effort: "low" | "medium" | "high";
  cache: LlmCache;
  cacheKey: string;
  mode: "live" | "replay";
  breaker: Breaker;
  maxTokens?: number;
  /** Короткая структурная реплика: мышление выключено ради задержки (цель хода ≤ 4 с).
   *  Haiku 5.5 — {disabled}; Sonnet 5.5 не принимает disabled (400) — {between_tools}. Оба — только при effort ≤ high. */
  thinkingOff?: boolean;
};

export const thinkingOffFor = (model: string) =>
  model.includes("sonnet-5-5") ? ({ type: "between_tools" } as const) : ({ type: "disabled" } as const);

// Классы SDK, не текст сообщений.
function classify(e: unknown): { reason: LlmFailure; status?: number } {
  if (e instanceof Anthropic.APIConnectionTimeoutError) return { reason: "timeout" };
  if (e instanceof Anthropic.RateLimitError) return { reason: "rate_limited", status: 429 };
  if (e instanceof Anthropic.APIError) return { reason: "api_error", status: e.status };
  return { reason: "api_error" };
}

export async function callStructured<S extends z.ZodType>(a: CallArgs<S>): Promise<LlmResult<z.output<S>>> {
  const t0 = Date.now();
  const meta = (extra: Partial<LlmMeta> = {}): LlmMeta => ({ ms: Date.now() - t0, ...extra });
  try {
    if (a.mode === "replay") {
      const json = await a.cache.get(a.cacheKey);
      const parsed = json === null ? null : a.schema.safeParse(JSON.parse(json));
      return parsed?.success
        ? { ok: true, value: parsed.data, source: "replay", meta: meta() }
        : { ok: false, reason: "replay_miss", meta: meta() };
    }
    if (a.breaker.isOpen()) return { ok: false, reason: "breaker_open", meta: meta() };
    let res;
    try {
      res = await a.client.messages.parse(
        {
          model: a.model,
          max_tokens: a.maxTokens ?? 1024,
          output_config: { format: zodOutputFormat(a.schema as never), effort: a.effort },
          ...(a.thinkingOff ? { thinking: thinkingOffFor(a.model) } : {}),
          system: [{ type: "text", text: a.system, cache_control: { type: "ephemeral", ttl: "1h" } }],
          messages: [{ role: "user", content: a.tail }],
        },
        { timeout: a.timeoutMs, maxRetries: MAX_RETRIES },
      );
    } catch (e) {
      const { reason, status } = classify(e);
      a.breaker.record(status);
      return { ok: false, reason, meta: meta() };
    }
    const u = res.usage;
    const m = meta({
      input: u?.input_tokens, output: u?.output_tokens,
      cacheRead: u?.cache_read_input_tokens ?? 0, cacheWrite: u?.cache_creation_input_tokens ?? 0,
    });
    if (res.stop_reason === "refusal") return { ok: false, reason: "refusal", meta: m };
    if (res.parsed_output == null) return { ok: false, reason: "parse_null", meta: m };
    const value = res.parsed_output as z.output<S>;
    try {
      await a.cache.put(a.cacheKey, a.step, JSON.stringify(value));
    } catch {
      // кэш — для демо-REPLAY; его сбой не должен ломать живой ход
    }
    return { ok: true, value, source: "live", meta: m };
  } catch {
    return { ok: false, reason: a.mode === "replay" ? "replay_miss" : "api_error", meta: meta() };
  }
}
