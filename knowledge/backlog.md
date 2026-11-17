# Бэклог

Порядок = приоритет. Чекпоинт 18.11 15:00: демо-путь урока работает, пусть грубо. Финал 19.11.
Резать по «Порядку резки» спеки; «Не режем никогда» — не трогать. Отмечай `[x]` в коммите шага.

## Харнесс и дизайн
- [x] Харнесс: Convex, Next, скиллы, агенты, хуки, verify, ui-check — коммиты `ccd1fd3…a4d9062`
- [x] База знаний `knowledge/`, роли моделей
- [ ] OpenUI (thesysdev/openui, MIT): скилл в `.claude/skills` + `.agents/skills`, правило в `bobr-design` — только болталка
- [ ] DESIGN.md v1 (сочнее: обводка, продавливаемые кнопки, дерзкий Bobr, лёгкий узбекский колорит) + `/dev/styleguide`
- [ ] Ок владельца на дизайн → только потом экраны по дизайну (до этого UI серый)

## Этап 0 — каркас (`docs/02_BUILD_KICKOFF.md`)
- [ ] `convex/schema.ts`: все таблицы спеки с индексами, дроби `v.string()`
- [ ] `lib/types.ts`: состояния, статусы тем, события, zod-схемы (UstozTurn, Judge, BobrTurn, OutputCheck, GoalDialog, GuardResult)
- [ ] `content/graph.json`: N1–N10, пререквизиты из спеки, названия ru/uz
- [ ] `lib/config.ts`: модели, таймауты, лимиты болталки, номера кризиса (только 112 подтверждён), `DEMO_MODE`
- [ ] Скелет UI (серый): Цель, Диагностика, Махалля, Урок, Научи Bobr, Болталка, `/parent`; плашка ИИ на экранах чата

## Этап 1 — детерминированное ядро + тесты
- [ ] parseAnswer → generator → leakDetector → numberCheck → copyCheck → repeatGuard → planner → houseMapper
- [ ] Демо-случаи: `2/5` на `1/2+1/3` → M9; «yarim» = 1/2; «0,5» = 1/2; `2/4` → almost

## Этап 2 — один ход целиком (UI серый)
- [ ] `lib/llm.ts`: caching, таймауты, retry 1, llmCache record/replay, circuit breaker
- [ ] `lib/safety/`: preGuard, guardIn, outputCheck, CRISIS-шаблоны ru/uz
- [ ] `convex/turn.ts` + `convex/conductor.ts`
- [ ] ustozTurn: Сократ, ответ не выдаёт, выбирает компонент
- [ ] Экран урока: задача → ввод → проверка → Ustoz → ожидание → Лепёшка
- [ ] Критерий: `2/5` на `1/2+1/3`; Ustoz не сдаётся на «учитель сказал 2/5» и «просто скажи ответ» (ru и uz)

## Этапы 3–4 (после ок)
- [ ] GOAL → DIAGNOSE (6 проб) → PLAN → махалля; `/parent` через `useQuery`
- [ ] TEACH_BOBR → copyCheck → judge → BOBR_ATTEMPT/QUESTION; дом оживает у ребёнка и родителя одновременно

## Контент (владелец обещал файлы в `content/`)
Ждём: `misconceptions.json`, `templates.json`, `checklists.json`, `crisis.json`. Сейчас их **нет**.
Свой не выдумывать. Из спеки можно взять: граф N1–N10, M9, демо-пробы. Остальное — заглушка с TODO + `BLOCKERS.md`.

## Связанные узлы
[[sprint]] · [[product]] · [[decisions]] · [[structure]]
