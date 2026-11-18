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

- Сократическая лестница core: попытки и уровни 1–4 сохраняются в учебной сессии, родитель получает сводку через `useQuery`. Шаблоны ru/uz ждут вычитки, работает кодовый запасной путь.
- Урок вживую: `2/5` → M9, Ustoz ведёт вопросами, ответ не выдаёт (ru, uz); safety-цепочка; CRISIS с выходом.
- Компоненты: жёсткая схема `{type, fractions}`, проверка кодом, фолбэк из задачи; Лепёшка/Полоска/Прямая рисуются (серо).
- API для бота и Mini App, `scripts/demo-reset.sh`, `docs/specs/API_FOR_BOT.md`; кризис: ABUSE_HOME блокирует пуш родителю.
- ТЗ `docs/specs/SPEC_{SYSTEM,PARENT_BOT,BOBR}.md` в `main`; противоречия — [[decisions]] (строка «Противоречия ТЗ»).
- Дизайн v1: `docs/design/v1/` — **ок владельца 18.11**.

- **Этап 3, бэкенд (core, 18.11):** `session` (токен ребёнка, согласие) → `goal:set` → `diagnose` (адаптивная) → `plan` → `mahalla` (+`startLesson`). Контракт для front — `docs/specs/API_CHILD.md`. Живой прогон с ответами демо: пробы N9 → N8 → N2 → N5 → N6, план N8 → N6 → N5 → N9.
- **Привязка (для Нуриддина):** цели `test_soon/improve/just_practice`; `linkCode:create` → `{PUBLIC_APP_URL}/c/{code}`; `linkCode:claim({code})` → сессия child; `redeem` удалён. `API_FOR_BOT.md` обновлён.

### teach (ветка `teach`)
- Бэкенд сцены готов: `teach:start`, `teach:explain` (вход по токену, как `turn`). PASS / PARTIAL / FAIL, 3 круга, микро-демо, copyCheck, guard и CRISIS. Проверено `verify:nodeploy` и разовым прогоном на `convex-test` (replay).
- Не проверено на живом Claude: нужен мерж в `main` и развёртывание у core. Дальше: живой прогон, eval судьи 18+3, интеграция с экраном.
- Упрощено: FAIL показывает заблуждение темы, вход берёт пробу темы, судья один (спека: при partial ещё 2), чек-листы — заглушка до B1.

### Сломано / открыто
- core, дальше: урок (`turn`, `lesson:view`, `leaveCrisis`, `startDemoLesson`) ещё на `studentId` — перевести на токен (остаток B9); фраза Bobr на экране цели (Haiku + outputCheck); ревьюер B11.
- Противоречия ТЗ ждут владельца — [[decisions]].
- Кризис-маршрутизация, ревью безопасности раунд 2 — в работе/см. последний коммит; нет внешнего канала для «пуш удержан» (только reviewQueue).
- Задержка хода 4–6 с (решено не трогать). Нет входа ребёнка (B9) — закрывает `claimLinkCode`.
- Stop-хук плагина Convex краснеет на Node 20 ([[lessons]]).

### front (A): состояние
Демо-шаги 1–5 в стиле v1 подключены к настоящему API (`docs/specs/API_CHILD.md`): вход → согласие → цель → диагностика → план → махалля → урок. Нижний навбар, живые Bobr и Ustoz (дыхание, моргание, реакция на реплику). Узбекские тексты ждут вычитки носителем. Дальше: вау-анимации, позы эмоций, «Научи Bobr» после бэкенда teach.

### Промпт: core
```text
Bobr, трек A, сессия core: папка /home/taef/projects/bobr, ветка main. Старт: CLAUDE.md §8 → knowledge/README.md →
knowledge/tracks/A-core.md → «Сейчас» в knowledge/sprint.md. Convex: `npm run dev:convex` (ключ в env; один
бэкенд на все сессии). Ты единственный правишь convex/schema.ts, lib/types.ts, lib/config.ts — в начале и каждый
час разбирай SCHEMA_REQUESTS.md (front и teach пишут туда). Цель до 13:30 — бэкенд демо-шагов 1–4: GOAL
(сначала: `lib/config.ts` copyCheck → 0.5; `DEMO_MODE` += `script`; goalDialog Haiku; цели по решению владельца: test_soon / improve / just_practice — «Скоро контрольная / Подтянуть дроби / Просто заниматься»; переведи GOAL_INTENTS, schema и parents.setGoal, обнови API_FOR_BOT.md) → DIAGNOSE адаптивная (следующая проба зависит от ответа: ошибка → пререквизит из графа, верно → дальше/стоп; фиксированные 6 проб DEMO_PROBES только при DEMO_MODE=script; вердикт всегда считает код по ответу ребёнка — никаких if под числа демо, исход честный)
→ PLAN (buildPlan, сохранить в plans) → данные махалли (houseState) — queries/mutations для экранов front.
Затем вход ребёнка по ТЗ SPEC_SYSTEM §3–4: linkCodes 8 символов (как в API) → ссылка {PUBLIC_APP_URL}/c/{code} → claimLinkCode → sessions(kind=child) → токен во
все детские функции (закрывает B9). Мерж в 12:00 и 13:30: `git merge front teach` → npm run verify →
/demo-path → bash scripts/turn-smoke.sh → push. Каждый шаг: verify → коммит → git pull --rebase → push.
Работа: ты — Opus-оркестратор. Код пишут агенты `implementer` (Sonnet), независимые таски — параллельно, по одному ограниченному таску на агента; после каждого куска — быстрое ревью агентом `reviewer` (Opus) по диффу куска, чинишь находки, verify, коммит. Сначала MVP, полировка потом.
```

### Промпт: front
```text
Bobr, трек A, сессия front: папка /home/taef/projects/bobr-front (git worktree), ветка front. Старт: CLAUDE.md §8 →
knowledge/README.md → knowledge/tracks/A-front.md → «Сейчас» в knowledge/sprint.md → скилл bobr-design →
DESIGN.md (v1) и docs/design/v1/. Один раз: `npm install`; скопируй .env.local из ../bobr (не читай его вслух).
НЕ запускай convex dev и npm run verify — общий локальный Convex у core; проверка — `npm run verify:nodeploy`,
UI — `npm run dev -- -p 3001` и `npm run ui-check -- <route>` (порт поправь в скрипте, если нужно) + взгляд на PNG.
Зона: только app/** (кроме app/parent), components/**, lib/ui/**, public/**, i18n (ключи экранов ребёнка, uz+ru).
Цель до 13:30 — демо-шаги 1–5 красиво по DESIGN v1: цель (Bobr спрашивает кнопками) → диагностика (адаптивная: экран показывает пробу, пришедшую из бэкенда, не список из 6) → план →
карта-махалля (10 домов 2.5D, плоские крыши, состояния) → урок (живой Ustoz, Лепёшка/Полоска/Прямая в стиле v1,
press-button). Данных нет — пиши заявку в ../bobr/SCHEMA_REQUESTS.md (через core), пока заглушка с TODO.
Коммить в front часто; в main мержит core в 12:00 и 13:30 — к этому времени ветка зелёная.
Работа: ты — Opus-оркестратор. Экраны пишут агенты `implementer` (Sonnet) параллельно — по экрану на агента; после каждого экрана — `ui-check` + быстрый взгляд агента `design-critic` (Opus), чинишь главное, коммит. Сначала MVP всех 5 экранов в стиле v1 (сочно: ink-обводка, продавливаемые кнопки, 2.5D-махалля), анимации персонажей и «вау» — в конце, их делает Opus сам (скиллы bobr-animation, animate).
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
M9 от кода) → объяснение → copyCheck (порог 0.5 — THRESHOLDS.copyCheck в lib/config.ts, ставит core; не хардкодь) → judge Sonnet (схема Judge,
цитата — подстрока, проверяет код; чек-листов нет — заглушка по спеке + TODO) → PASS: новая задача, Bobr решает
(ответ кода), taught_bobr, level+1, enqueueTaughtBobr | PARTIAL: наивный вопрос, ≤3 круга, микро-демо | FAIL:
«правило ребёнка» считает код. BobrTurn (Haiku) → postChecks + outputCheck. Интеграция с экраном — вечером.
Работа: ты — Opus-оркестратор. Модули (lib/judge, lib/bobr, промпты, convex/teach.ts) пишут агенты `implementer` (Sonnet) параллельно, тесты — агент `tester`; после каждого модуля — быстрое ревью `reviewer` (Opus), коммит. Сначала рабочий сквозной путь сцены, потом качество реплик.
```

## Связанные узлы
[[README]] · [[backlog]] · [[decisions]] · [[structure]] · [[lessons]]
