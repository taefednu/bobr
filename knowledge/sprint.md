# Спринт

## Сейчас

**18.11, день. Передача дел.** Чекпоинт сегодня 15:00: демо-путь урока работает, пусть грубо.

### Треки
- **A (Taef)** — ядро урока, безопасность, схема, этап 3, этап 4 «Научи Bobr», фронт ребёнка, API для Telegram: [[A-lesson-core]].
- **B** — бот родителя на Python в `bot/`: [[B-telegram-bot]]. **C** — Mini App `/parent`: [[C-parent-miniapp]].
  Кто из ребят B, кто C — владелец уточнит. Контракт: `docs/specs/API_FOR_BOT.md`.

### Готово (всё в `main`, verify 0, 352 теста)
- Урок вживую (ключ в env Convex): `2/5` → M9, Ustoz ведёт вопросами и не выдаёт ответ (ru, uz); safety-цепочка
  preGuard → guard → postChecks → outputCheck; CRISIS-оверлей с выходом.
- Компоненты: жёсткая схема `{type, fractions}` для Лепёшки/Полоски/Прямой, проверка кодом, фолбэк из задачи;
  полоска и прямая рисуются. Ложные фолбэки (списки в params, «rasmga qara» как «фото») починены.
- API для бота и Mini App + `scripts/demo-reset.sh` + `docs/specs/API_FOR_BOT.md` (живьём на :3210 проверено
  через `npx convex run`; Python-клиент и Mini App — не проверялись).

### Сломано / открыто
- Задержка хода 4–6 с (решено пока не трогать).
- `docs/specs/SPEC_SYSTEM.md`, `SPEC_PARENT_BOT.md`, `SPEC_BOBR.md` — **в репо нет**; сверка с BOBR_SPEC не сделана,
  API собран по списку владельца — раздел «assumptions to reconcile» в `API_FOR_BOT.md`.
- Имя ребёнка в `students.displayName` — противоречит «ПДн не в БД» ([[decisions]]), ждёт ок.
- Никто не переводит тему в `taught_bobr` — этап 4 не начат; при переходе звать `enqueueTaughtBobr` (`convex/outbox.ts`).
- Нет rate limit на `BOT_SECRET`, нет крона чистки outbox; session token хранится открыто.
- Stop-хук плагина Convex краснеет на Node 20 ([[lessons]]).

### Дальше по порядку до 15:00
1. Этап 3: GOAL (кнопки) → DIAGNOSE (`DEMO_PROBES`, 6 проб) → PLAN (`buildPlan`) → махалля (`houseState`), серый UI.
2. Этап 4: TEACH_BOBR → copyCheck → judge → BOBR_ATTEMPT/QUESTION → taught_bobr → дом alive + `enqueueTaughtBobr`.
3. Сквозной прогон демо-пути: урок → план → научил Bobr → дом alive на `/parent` (вместе с треком C).
4. Сверить `docs/specs/*` (когда появятся) с BOBR_SPEC, выписать противоречия владельцу.

### Промпт следующей сессии

```text
Bobr, трек A. Старт: CLAUDE.md (§8 — работа втроём) → knowledge/README.md → knowledge/tracks/A-lesson-core.md
→ «Сейчас» в knowledge/sprint.md. Convex: `npm run dev:convex` (ключ Anthropic уже в env); не запущен —
подними. Сначала: есть ли в docs/specs/ SPEC_SYSTEM.md, SPEC_PARENT_BOT.md, SPEC_BOBR.md — если да, сверь с
docs/BOBR_SPEC.md и knowledge/decisions.md и выпиши противоречия владельцу; разбери SCHEMA_REQUESTS.md.
Потом по порядку «Дальше» в sprint.md: этап 3 (GOAL → DIAGNOSE 6 проб → PLAN → махалля, серый UI), затем
этап 4 «Научи Bobr» (copyCheck → judge Sonnet с цитатами-подстроками → попытка Bobr с ответом от кода →
taught_bobr → дом alive + enqueueTaughtBobr). Чекпоинт 15:00 — сквозной демо-путь. Каждый шаг: npm run verify
→ /demo-path → коммит → git pull --rebase → push. Роли моделей — CLAUDE.md §6.
```

## Связанные узлы
[[README]] · [[backlog]] · [[decisions]] · [[structure]] · [[lessons]]
