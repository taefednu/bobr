# Спринт

## Сейчас

**18.11, день. Передача дел. Цель до 13:30:** демо-шаги 1–5 (цель → диагностика → план → махалля → урок)
красиво и с живым Ustoz. **teach:** бэкенд к 15:00, интеграция вечером. Чекпоинт 15:00.

### Кто где
| Сессия | Папка / ветка | Зона | Трек |
|---|---|---|---|
| core (Taef) | `bobr` / `main` | ядро, схема, этап 3, API, мерж front+teach в 12:00 и 13:30 | [[A-core]] |
| front (Taef) | `../bobr-front` / `front` | экраны ребёнка по DESIGN v1 | [[A-front]] |
| teach (Taef) | `../bobr-teach` / `teach` | «Научи Bobr» по SPEC_BOBR §3 | [[A-teach]] |
| Нуриддин | `main`, `bot/` → `app/parent/` | бот на Python, потом Mini App | [[B-telegram-bot]] · [[C-parent-miniapp]] |

**Один локальный Convex на всех (:3210).** front и teach не запускают `convex dev` и `npm run verify` (они
заливают функции и затрут core) — только `npm run verify:nodeploy`. Полный verify — core после мержа.

### Готово (`main`)
- Урок вживую: `2/5` → M9, Ustoz ведёт вопросами, ответ не выдаёт (ru, uz); safety-цепочка; CRISIS с выходом.
- Компоненты: жёсткая схема `{type, fractions}`, проверка кодом, фолбэк из задачи; Лепёшка/Полоска/Прямая рисуются (серо).
- API для бота и Mini App, `scripts/demo-reset.sh`, `docs/specs/API_FOR_BOT.md`; кризис: ABUSE_HOME блокирует пуш родителю.
- ТЗ `docs/specs/SPEC_{SYSTEM,PARENT_BOT,BOBR}.md` в `main`; противоречия — [[decisions]] (строка «Противоречия ТЗ»).
- Дизайн v1: `docs/design/v1/` — **ок владельца 18.11**.

### Сломано / открыто
- Противоречия ТЗ (8 пунктов) ждут владельца — [[decisions]]. Самое срочное для core: привязка по ТЗ (`claimLinkCode` → сессия child) вместо «второго родителя».
- Кризис-маршрутизация, ревью безопасности раунд 2 — в работе/см. последний коммит; нет внешнего канала для «пуш удержан» (только reviewQueue).
- Задержка хода 4–6 с (решено не трогать). Нет входа ребёнка (B9) — закрывает `claimLinkCode`.
- Stop-хук плагина Convex краснеет на Node 20 ([[lessons]]).

### Промпт: core
```text
Bobr, трек A, сессия core: папка /home/taef/projects/bobr, ветка main. Старт: CLAUDE.md §8 → knowledge/README.md →
knowledge/tracks/A-core.md → «Сейчас» в knowledge/sprint.md. Convex: `npm run dev:convex` (ключ в env; один
бэкенд на все сессии). Ты единственный правишь convex/schema.ts, lib/types.ts, lib/config.ts — в начале и каждый
час разбирай SCHEMA_REQUESTS.md (front и teach пишут туда). Цель до 13:30 — бэкенд демо-шагов 1–4: GOAL
(goalDialog Haiku; цели по решению владельца: test_soon / improve / just_practice — «Скоро контрольная / Подтянуть дроби / Просто заниматься»; переведи GOAL_INTENTS, schema и parents.setGoal, обнови API_FOR_BOT.md) → DIAGNOSE (DEMO_PROBES, 6 проб, вердикт кода)
→ PLAN (buildPlan, сохранить в plans) → данные махалли (houseState) — queries/mutations для экранов front.
Затем вход ребёнка по ТЗ SPEC_SYSTEM §3–4: linkCodes 6 цифр → claimLinkCode → sessions(kind=child) → токен во
все детские функции (закрывает B9). Мерж в 12:00 и 13:30: `git merge front teach` → npm run verify →
/demo-path → bash scripts/turn-smoke.sh → push. Каждый шаг: verify → коммит → git pull --rebase → push.
```

### Промпт: front
```text
Bobr, трек A, сессия front: папка /home/taef/projects/bobr-front (git worktree), ветка front. Старт: CLAUDE.md §8 →
knowledge/README.md → knowledge/tracks/A-front.md → «Сейчас» в knowledge/sprint.md → скилл bobr-design →
DESIGN.md (v1) и docs/design/v1/. Один раз: `npm install`; скопируй .env.local из ../bobr (не читай его вслух).
НЕ запускай convex dev и npm run verify — общий локальный Convex у core; проверка — `npm run verify:nodeploy`,
UI — `npm run dev -- -p 3001` и `npm run ui-check -- <route>` (порт поправь в скрипте, если нужно) + взгляд на PNG.
Зона: только app/** (кроме app/parent), components/**, lib/ui/**, public/**, i18n (ключи экранов ребёнка, uz+ru).
Цель до 13:30 — демо-шаги 1–5 красиво по DESIGN v1: цель (Bobr спрашивает кнопками) → диагностика → план →
карта-махалля (10 домов 2.5D, плоские крыши, состояния) → урок (живой Ustoz, Лепёшка/Полоска/Прямая в стиле v1,
press-button). Данных нет — пиши заявку в ../bobr/SCHEMA_REQUESTS.md (через core), пока заглушка с TODO.
Коммить в front часто; в main мержит core в 12:00 и 13:30 — к этому времени ветка зелёная.
```

### Промпт: teach
```text
Bobr, трек A, сессия teach: папка /home/taef/projects/bobr-teach (git worktree), ветка teach. Старт: CLAUDE.md §8 →
knowledge/tracks/A-teach.md → docs/specs/SPEC_BOBR.md (§1 характер, §3 сцена, §4 генерация) → docs/BOBR_SPEC.md →
скилл bobr-llm-call → convex/_generated/ai/guidelines.md → convex/turn.ts как образец потока. Один раз: `npm install`.
НЕ запускай convex dev и npm run verify (общий Convex у core) — `npm run verify:nodeploy`; логику пиши чистыми
функциями в lib/judge/ и lib/bobr/ с vitest (каждый тест краснеет без кода). Зона: convex/teach.ts, lib/judge/**,
lib/bobr/**, lib/llm/prompts/bobr*.ts, lib/llm/prompts/judge*.ts. Схема (bobrState, topicStatus) — заявкой в
../bobr/SCHEMA_REQUESTS.md. Цель к 15:00 — бэкенд сцены: Bobr приходит с ошибкой ребёнка (attempt = дистрактор
M9 от кода) → объяснение → copyCheck (порог 0.6, lib/config.ts) → judge Sonnet (схема Judge,
цитата — подстрока, проверяет код; чек-листов нет — заглушка по спеке + TODO) → PASS: новая задача, Bobr решает
(ответ кода), taught_bobr, level+1, enqueueTaughtBobr | PARTIAL: наивный вопрос, ≤3 круга, микро-демо | FAIL:
«правило ребёнка» считает код. BobrTurn (Haiku) → postChecks + outputCheck. Интеграция с экраном — вечером.
```

## Связанные узлы
[[README]] · [[backlog]] · [[decisions]] · [[structure]] · [[lessons]]
