# Трек B — цель, диагностика, план, махалля, родитель (этап 3)

**Владелец трека:** Нуриддин (предварительно — владелец репо может переназначить).

## Задача (кикофф, этап 3)
GOAL (Bobr спрашивает кнопками: скоро контрольная / домашка / не знаю) → DIAGNOSE (фиксированные 6 проб
N9 → N8 → N2 → N5 → N6 → N1, `DEMO_PROBES` в `lib/fractions/generator.ts`) → PLAN (`buildPlan`, `lib/planner`)
→ экран махалли (дома через `houseState`, `lib/houses`) → `/parent` через `useQuery`.
Критерий: демо-путь `2/5` → план N8 → N6 → N5 → N9, дом меняет состояние у ребёнка и на `/parent`.

## Зона (правит только этот трек)
- `app/(child)/goal/**`, `app/(child)/diagnose/**`, `app/(child)/mahalla/**`, `app/parent/**`
- новые `convex/diagnose.ts`, `convex/plan.ts`, `convex/parent.ts` (mutations/queries этого трека)
- `goalDialog` (Haiku): новый файл `lib/llm/prompts/goal.ts` — по скиллу `bobr-llm-call`

## Можно использовать, нельзя менять
`lib/fractions`, `lib/planner`, `lib/houses`, `lib/llm` (`callStructured`), `lib/types` (GoalDialog уже есть).
Нужно поле/таблица/индекс → заявка в `SCHEMA_REQUESTS.md`. Баг в чужом модуле → строка в
`SCHEMA_REQUESTS.md` (раздел «Баги в чужих зонах») и сообщение владельцу трека, не правка.

## Готовое, что пригодится
- `checkAnswer(raw, task)` → `ok | almost | misconception:M9 | wrong | unparsed`
- `buildPlan({graph, statuses, targets, today, testDate, now})` → `order` + дни
- `houseState(status, now)` → `empty | scaffold | built | alive | dimmed`
- UI пока серый (`components/skeleton/Shell.tsx`), DESIGN v1 ждёт ок владельца.

## Связанные узлы
[[README]] · [[backlog]] · [[structure]] · [[product]]
