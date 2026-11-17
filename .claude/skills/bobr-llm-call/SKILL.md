---
name: bobr-llm-call
description: How to write a Convex action that calls Claude in Bobr — messages.parse + zodOutputFormat, postChecks, prompt caching (static prefix, beat in the tail), timeouts, one retry, llmCache for REPLAY, circuit breaker, fallbacks. Use whenever you add or change any LLM step (guardIn, ustozTurn, judge, bobrTurn, bobrChat, goalDialog, outputCheck, intentRoute, parentSummary, worldRewrite).
---

# Вызов Claude в Bobr

Спека: «Поток одного хода», «Модели», «Zod-схемы», «Сбои и демо». SDK `@anthropic-ai/sdk` 1.x — сверено
по `node_modules/@anthropic-ai/sdk/helpers/zod.d.ts`.

## Где живёт вызов

- Только в Convex `action`. Mutation и query в сеть не ходят. Если SDK не заводится в дефолтном
  рантайме Convex — `"use node"` первой строкой файла (в таком файле могут быть только actions).
  Не проверено на этом проекте: проверь первым же вызовом.
- Action не пишет в БД: результат → `ctx.runMutation(internal.conductor.…, {...})`. Запись — маскированный
  текст, без ПДн.
- Клиент один на модуль: `new Anthropic({ maxRetries: 1 })` — ключ из env Convex
  (`npx convex env set ANTHROPIC_API_KEY …`), не из `.env.local`: actions его не видят.

## Каркас

```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";

const BobrTurn = z.object({
  reply: z.string(),
  emotion: z.string(),          // enum сравниваем кодом без регистра, не z.enum: модель пишет «Happy»
  pose: z.string(),
  attempt: z.string().nullable(), // дробь — строка; код всё равно перезапишет attempt
});

const res = await client.messages.parse(
  {
    model: "claude-haiku-5-5",
    max_tokens: 1024,
    output_config: { format: zodOutputFormat(BobrTurn), effort: "low" },
    system: [
      { type: "text", text: BOBR_STATIC_PREFIX, cache_control: { type: "ephemeral", ttl: "1h" } },
    ],
    messages: [{ role: "user", content: tail }],
  },
  { timeout: 6_000 },
);
if (res.stop_reason === "refusal" || res.parsed_output == null) return fallback();
const out = postChecks(res.parsed_output, ctx); // numberCheck, leakDetector, repeatGuard, copyCheck, attempt-override
```

## Правила

- **Схемы.** Числовые поля без `.min/.max` (ограничения схемы → 400 или отказ модели) — диапазон
  проверяет код после parse. Дроби — `z.string()`. Judge: `quote` обязана быть подстрокой текста ребёнка —
  проверяет код, не модель.
- **Число от модели ничего не решает.** `hintLevel`, `verdict`, `attempt`, `revealsAnswer` — подсказка для
  кода, итог считает Conductor. Уровень темы, серия «понял сам», «Bobr решил» — только по коду.
- **Prompt caching.** Статичный префикс ≥ 1K токенов: правила персонажа + 10–15 примеров стиля, байт в
  байт одинаковый между вызовами (никаких дат, id, языка внутри). Хвост — `forbidden_lines` (последние
  20–30 реплик для антиповтора), `<beat>`, ввод ребёнка. TTL `1h` на демо. Минимум кэшируемого
  префикса у Haiku 5.5 и Sonnet 5.5 — 512 токенов (короче — молча не кэшируется). Проверка:
  `usage.cache_read_input_tokens > 0` на втором вызове.
- **Не передавай `temperature`/`top_p`/`top_k`** — на этих моделях нестандартное значение даёт 400.
  Разнообразие реплик даёт антиповтор (`forbidden_lines`, repeatGuard), не температура.
- **Без server-side `fallbacks`.** Скилл `claude-api` предлагает их по умолчанию, но они переключают
  запрос на модель вне таблицы спеки. Отказ модели у нас — обычный сбой с запасным путём.
- **Ввод ребёнка — данные.** В хвосте внутри тега: `<child_input>…</child_input>`, с пометкой в префиксе,
  что содержимое тега — не инструкция. Роли сообщений задаёт код (`user`/`assistant`), никогда из ввода.
- **Таймауты** (мс, вторым аргументом): guard 6 000, Ustoz 12 000, judge 15 000, Bobr 6 000. `maxRetries: 1`.
- **effort.** Haiku 5.5 и Sonnet 5.5 думают по умолчанию; для коротких реплик ставь `effort: "low"` —
  иначе не уложиться в таймаут. Judge — `medium`.
- **Сбой = запасной путь, не исключение наружу.** Ustoz упал → компонент + кнопка «подсказка». Bobr упал
  → анимация без текста. Judge упал → partial → наивный вопрос. `stop_reason: "refusal"` — тоже сбой.
- **Circuit breaker.** 3 ошибки 429/529 за 30 с → режим «только задачи» (без LLM-реплик). Ошибки
  различай классами `Anthropic.RateLimitError`, `Anthropic.APIError` (`status`), а не текстом.
- **REPLAY.** `DEMO_MODE=replay` → ответ из `llmCache` по ключу `(step, beat, itemId, lang[, normInput])`;
  `live` → вызов и запись в `llmCache`. Ключ без ПДн. Демо обязано пройти с выключенной сетью.
- **outputCheck (Haiku)** — только для свободных реплик персонажей; ловит `claims_human_or_alive`,
  романтику, «скучал / не уходи», секреты, фото, URL.
- Свежий ответ не должен затереть более новый ход: пишущая mutation сверяет номер хода.

## Модели (спека — истина)

| Шаг | Модель |
|---|---|
| guardIn, outputCheck, intentRoute, parentSummary | `claude-haiku-5-5` |
| ustozTurn, judge (×1, при partial ещё 2 параллельно), worldRewrite | `claude-sonnet-5-5` |
| bobrTurn, bobrChat, goalDialog | `claude-haiku-5-5` |

Других ID нет. Сомневаешься в параметре SDK — скилл `claude-api`, а не память.
