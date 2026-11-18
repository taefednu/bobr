import type { LlmCache } from "../llm";

/** Кэш с отложенной записью: get как обычно, put запоминается и пишется в base только по flush().
 *  Нужен судье: его ответ содержит дословные цитаты ребёнка, а писать их в llmCache можно только после guard SAFE. */
export function deferredPut(base: LlmCache) {
  const pending: [string, string, string][] = [];
  return {
    cache: { get: (k: string) => base.get(k), put: async (k: string, s: string, r: string) => { pending.push([k, s, r]); } } as LlmCache,
    async flush() {
      for (const [k, s, r] of pending.splice(0)) await base.put(k, s, r).catch(() => undefined);
    },
  };
}
