# Устройство кода

Стек: Next.js 16 (App Router) + TypeScript, Tailwind 4, Convex 1.50 (локальный anonymous-бэкенд),
`@anthropic-ai/sdk` 1.10 (`messages.parse` + `zodOutputFormat`), zod 4, fraction.js 5, framer-motion 14,
vitest 5, Playwright 1.64.0 (закреплён под скачанный браузер). Node ≥ 22 для Convex.

## Папки

| Путь | Что | Статус |
|---|---|---|
| `convex/schema.ts` | `students` хранит приватную текущую задачу, `lessonSessions` и `taskProgress` хранят идентификаторы урока и счётчики, `attemptRequests` устраняет повторы, `escalationEvents` хранит историю без переписки | готово |
| `convex/turn.ts` | action `turn`: preGuard → вердикт кода → Ustoz (∥ guardIn для текста) → postChecks → outputCheck → `recordReply`; без ключа — replay → запасной путь | готово, LLM не гонялся |
| `convex/teach.ts` | сцена «Научи Bobr»: actions `start`, `explain`; preGuard → copyCheck ∥ guardIn ∥ судья → `applyVerdict` (атомарно `taught_bobr`, дом, outbox) → реплика Bobr → postChecks → outputCheck | бэкенд готов, экран вечером |
| `lib/judge/`, `lib/bobr/` | судья: чек-листы (заглушка до B1), проверка цитат и вердикт кодом; Bobr: шаги сцены, попытки от кода, postChecks реплики | готово |
| `convex/conductor.ts` | `submitAttempt` атомарно фиксирует вердикт, лестницу, самостоятельную серию и телеметрию. `submitAnswer` / `pressHint` завершают старую задачу, `recordReply` сверяет номер хода | урок готов |
| `convex/socraticState.ts`, `convex/socraticTelemetry.ts`, `lib/socratic/` | приватный эталон, проекция помощи для родителя, структурированный выбор вычитанного шаблона | каталог ru/uz ждёт вычитки |
| `convex/lesson.ts`, `convex/lessonView.ts` | query `view` — публичная проекция задачи (без answer/distractors) | готово |
| `convex/session.ts` | детская сессия: `childOf`/`childOrNull` (токен → ребёнок), `startDemo` (только `DEMO_ALLOW_ANON=1`), `acceptConsent`, `me` | готово |
| `convex/{goal,diagnose,plan,mahalla}.ts` | этап 3 по `docs/specs/API_CHILD.md`: цель, адаптивная диагностика (проба в `currentTask`, варианты в `students.diagnosis`), план (`rebuildPlan` → `plans`), махалля + `startLesson` | готово |
| `lib/planner/{diagnose,goal}.ts` | `nextProbeTopic` (адаптивный обход графа / script), `probeFor`; `normalizeGoal` | готово |
| `convex/llmCache.ts` | internal `get`/`put` — адаптер REPLAY | готово |
| `convex/{parents,students,linkCode,outbox,parent,parentLogin,botAuth,demo}.ts` | API для бота и Mini App (`docs/specs/API_FOR_BOT.md`): бот — с `BOT_SECRET`, Mini App — `sessionToken` после проверки `initData`; outbox — пуши «научил Bobr» и кризис | готово, живьём с Python не проверено |
| `lib/telegram/` | `initData.ts` (HMAC Telegram на Web Crypto), `secure.ts`, `texts.ts` (ru/uz тексты пушей) | готово |
| `scripts/demo-reset.sh` | засев демо-родителя и демо-ребёнка (после диагностики), печатает link code и sessionToken | готово |
| `components/ConvexClientProvider.tsx` | `ConvexReactClient` в `app/layout.tsx` | готово |
| `convex/crons.ts` | «дом гаснет», сводка родителю | пустой cronJobs |
| `lib/fractions/` | `task.ts` (контракт задачи), `parseAnswer.ts`, `generator.ts` (+`DEMO_PROBES`), `numberCheck.ts`, `leakDetector.ts` | готово |
| `lib/safety/` | `preGuard.ts` (лимит, нормализация, транслит, base64, ПДн, триггеры от 1-го лица), `pii.ts`, `crisis.ts` (текст — заглушка), `copyCheck.ts`, `repeatGuard.ts` | готово, триггеры не вычитаны |
| `lib/text/` | `normalize.ts` (NFKC, апострофы, ½), `similarity.ts` (триграммный Jaccard) | готово |
| `lib/llm/` | `component.ts` (`normalizeComponent`: компонент `{type, fractions}` проверяет код, не прошёл — строит из задачи), `call.ts` (`callStructured`: таймаут, retry 1, refusal/null → сбой, breaker, llmCache replay/live), `postChecks.ts` (Ustoz + `fallbackUstoz`), `prompts/` (Ustoz, guard, outputCheck, хвосты, `fenceChildInput`) | готово, живьём не гонялось |
| `lib/content/index.ts` | загрузка и проверка `content/graph.json` (пререквизиты, ацикличность) | готово |
| `lib/planner/planner.ts`, `lib/houses/houseMapper.ts` | план (правила вне спеки — в шапке файла), дома + demote | готово |
| `lib/types.ts` | состояния, уровни, дома, вход хода, zod-схемы спеки (enum без регистра через `ci`) | готово |
| `lib/config.ts` | модели, таймауты, лимиты, пороги, номера кризиса, `resolveDemoMode` (env `DEMO_MODE` = live\|replay; без ключа — replay), `isScriptDiagnosis` (`DEMO_MODE=script`), `DIAGNOSE` | готово |
| `lib/motion.ts` | все пружины и тайминги, `useMotion()` | готово |
| `lib/utils.ts` | `cn()` | готово |
| `app/(child)/{goal,diagnose,mahalla,lesson,teach,chat}`, `app/parent`, `app/page.tsx` | экраны, серый каркас без логики (до ок на DESIGN v1) | каркас |
| `app/(child)/chat/page.tsx`, `components/chat/*` | болталка с Ustoz и Bobr: `useChat` (api.chat.view/send, оптимистичный пузырь), `ChatView` (персонаж + переписка + поле + закрытое состояние + кризис), `Stage`/`Switch`/`Bubbles`/`Composer`/`ClosedPanel`/`Portrait`, `model.ts` (контракт и пороги) | экран готов, проверен вживую 390 и 1280 |
| `app/page.tsx`, `app/(child)/{start,c/[code],goal,diagnose,plan,mahalla,lesson}`, `lib/ui/session.ts`, `lib/ui/types.ts` | экраны ребёнка на реальном бэкенде core: токен в `localStorage bobr:token`, `routeForState`, `useGuard(min,max)` по ступеням пути; `types.ts` — формы ответов API_CHILD (заглушек нет) | работает |
| `components/skeleton/Shell.tsx` | оболочка каркаса: `Shell`, `AiBadge` (плашка ИИ), `LangSwitch`, `Character`-заглушка | каркас |
| `components/child/{ChildShell,BottomNav,SideRail,LangSwitch,AiBadge,Logo,ScreenTitle,SplitScreen}.tsx`, `app/icon.png`, `--bg-stage`/`--top-bar-h`/`--bottom-nav-h` in `globals.css` | каркас приложения: верхняя полоса в один ряд, таб-бар до lg / рейка от lg (`NAV_ITEMS`), `SplitScreen({title, aside, children})` и `ScreenTitle` для экранов | дизайн |
| `components/child/Character.tsx`, `CharacterSays.tsx`, `SpeechBubble.tsx`, `app/(child)/template.tsx` | живой персонаж (дыхание, пятно, think/talk/emotion+beat), реплика по словам, точки ожидания, вход экрана opacity-ом; константы в `lib/motion.ts` (IDLE_LIFE, TYPING, TALK, BUBBLE_DELAY_S, THINKING_DOTS_DELAY_S, TRANSITIONS.pageIn) | дизайн |
| `lib/i18n.ts` | `useT()`: язык из `localStorage["bobr:lang"]`, uz по умолчанию, гидрация через `useSyncExternalStore` | готово |
| `components/ui/press-button.tsx` | единственная нажимаемая кнопка v1: ink-уступ из одной MotionValue `y` | v1, ждёт ок |
| `app/dev/styleguide` | живой лист дизайн-системы (в проде 404); `house.tsx` — дома и плитка-лента | v1, ждёт ок |
| `app/globals.css` | токены DESIGN.md (`@theme static`), v1: `--stroke-ink*`, `--shadow-well`, `--shadow-drop` | v1 |
| `content/` | граф (готов, uz — вычитка), заблуждения, шаблоны, чек-листы, кризис | граф есть, остальное пусто — см. [[backlog]] |
| `i18n/uz.json`, `i18n/ru.json` | строки UI каркаса (ключи совпадают; uz — `_todo` вычитка) | каркас |
| `tests/` | vitest (`content.test.ts` — граф, схемы) | начат |
| `scripts/verify.sh` | tsc ×2 + vitest + convex --once | готово |
| `scripts/turn-smoke.sh` | 13 шагов хода урока через `npx convex run` на локальном бэкенде (сам поднимает и гасит convex dev) | готово |
| `convex/debug.ts` | `internalQuery` `snapshot` для смоука (задача, серия, уровень, дом) — клиенту недоступна | готово |
| `scripts/ui-check.mjs` | снимки и проверки вёрстки | готово |
| `scripts/node22.sh` | Node 22 из `.nvmrc` | готово |

**Импорты в `lib/`** — только относительные: Convex бандлит `lib/` из `convex/`, алиас `@/` там не резолвится (проверено пробной функцией 18.11).

## Команды

| Команда | Что |
|---|---|
| `npm run verify` | проверка перед «готово» |
| `npm run dev` / `npm run dev:convex` | Next :3000 / Convex :3210 |
| `npm run ui-check -- <route> [--lang ru] [--full] [--reduced-motion]` | снимки в `.ui-check/` |
| `/verify`, `/demo-path`, `/design-pass` | команды Claude Code |

## Харнесс

Агенты `.claude/agents/`: `implementer` (Sonnet, пишет код), `Explore` (Haiku, поиск), `reviewer` (Opus),
`tester`, `safety-redteam`, `ui-verifier` (Sonnet), `design-critic` (Opus). Скиллы `bobr-*` + ~50
дизайн/анимация (вход — `bobr-design`). Хуки: tsc после правки `.ts(x)`, `vitest related` на Stop,
блок ключей в коммите.

## Связанные узлы
[[README]] · [[product]] · [[decisions]] · [[lessons]]
