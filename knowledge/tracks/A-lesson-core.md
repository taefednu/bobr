# Трек A — ядро урока, безопасность, схема, этап 3, фронт по DESIGN v1

**Владелец трека:** Taef. Агент этого трека — единственный, кто правит `convex/schema.ts`, `lib/types.ts`, `lib/config.ts`.

## Зона (правит только этот трек)
- Ядро: `convex/schema.ts`, `convex/conductor.ts`, `convex/turn.ts`, `convex/lesson*.ts`, `convex/llmCache.ts`,
  `lib/fractions/**`, `lib/safety/**`, `lib/llm/**` (кроме промптов треков B/C), `lib/text/**`, `lib/types.ts`, `lib/config.ts`
- Этап 3: `app/(child)/{goal,diagnose,mahalla,lesson}/**`, `app/parent/**` (веб-экран родителя), новые
  `convex/{diagnose,plan,parent}.ts`, `lib/llm/prompts/goal.ts`, `lib/planner/**`, `lib/houses/**`
- Фронт: `DESIGN.md`, `PRODUCT.md`, `app/globals.css`, `lib/motion.ts`, `components/ui/**`, `components/skeleton/**`, `app/dev/**`

## Состояние (18.11)
Этапы 0–2 готовы, ход урока живой. Задержка 4–6 с — пока не трогаем (решение владельца).

## Дальше
1. Жёсткие схемы params для Лепёшки / Полоски / Прямой — в работе.
2. Этап 3: GOAL (кнопки) → DIAGNOSE (`DEMO_PROBES`: N9 → N8 → N2 → N5 → N6 → N1) → PLAN (`buildPlan`) →
   махалля (`houseState`) → `/parent` через `useQuery`. Критерий: демо-путь → план N8 → N6 → N5 → N9.
3. Фронт по DESIGN v1 — после ок владельца на `docs/design/v1/`.
4. Разбор `SCHEMA_REQUESTS.md` в начале каждой сессии.

## Связанные узлы
[[README]] · [[sprint]] · [[decisions]] · [[structure]]
