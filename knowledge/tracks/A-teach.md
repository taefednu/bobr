# Трек A · teach — этап 4 «Научи Bobr»

**Кто:** Taef, сессия **teach**. Папка `../bobr-teach`, ветка `teach`. В `main` — мержем core.

## Зона (только эти пути)
`convex/teach.ts`, `lib/judge/**`, `lib/bobr/**`, `lib/llm/prompts/bobr*.ts`, `lib/llm/prompts/judge*.ts` + их тесты.
Схема (`bobrState`, поля `topicStatus`) и типы — заявкой в `SCHEMA_REQUESTS.md`, делает core.

## Задача: бэкенд к 15:00, интеграция с экраном вечером
По `docs/specs/SPEC_BOBR.md` §3: Bobr приходит с ошибкой ребёнка (M9, `attempt` от кода) → объяснение → copyCheck (порог 0.5, из `lib/config.ts`) →
judge (Sonnet, цитаты — подстроки, проверяет код) → PASS: Bobr решает новую задачу (код), taught_bobr, level+1,
дом alive, `enqueueTaughtBobr` (`convex/outbox.ts`) | PARTIAL: наивный вопрос про недостающую идею, ≤ 3 кругов,
потом микро-демо | FAIL: Bobr применяет «правило ребёнка», код считает странный результат. BobrTurn (Haiku) →
postChecks + outputCheck, как в `convex/turn.ts`. Чек-листов судьи нет (`content/checklists.json` — B1) —
заглушка по спеке + TODO.

## Связанные узлы
[[A-core]] · [[A-front]] · [[decisions]]
