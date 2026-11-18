# Трек A — ядро урока и безопасность

**Владелец трека:** Taef (владелец репо). Агент этого трека — единственный, кто правит `convex/schema.ts`.

## Зона (правит только этот трек)
- `convex/schema.ts`, `convex/conductor.ts`, `convex/turn.ts`, `convex/lesson*.ts`, `convex/llmCache.ts`
- `lib/fractions/**`, `lib/safety/**`, `lib/llm/**`, `lib/text/**`, `lib/types.ts`, `lib/config.ts`
- `app/(child)/lesson/**`, `DESIGN.md`, `app/globals.css`, `lib/motion.ts`, `components/ui/**`

## Состояние (18.11)
Этапы 0–2 готовы: один ход урока работает вживую (ключ стоит), критерий этапа 2 пройден.
Задержка хода 4–6 с (цель ≤ 4 с не достигнута — см. [[decisions]]).

## Дальше
1. Задержка хода: стриминг Ustoz + outputCheck по готовому `reply`, анимация ожидания.
2. Контракт `params` компонента (модель придумывает ключи: `a,b`, `fractions`, `f1…`) — зафиксировать в схеме.
3. Разбор заявок из `SCHEMA_REQUESTS.md` — в начале каждой сессии.

## Связанные узлы
[[README]] · [[sprint]] · [[decisions]] · [[structure]]
