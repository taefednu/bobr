# Устройство кода

Стек: Next.js 16 (App Router) + TypeScript, Tailwind 4, Convex 1.50 (локальный anonymous-бэкенд),
`@anthropic-ai/sdk` 1.10 (`messages.parse` + `zodOutputFormat`), zod 4, fraction.js 5, framer-motion 14,
vitest 5, Playwright 1.64.0 (закреплён под скачанный браузер). Node ≥ 22 для Convex.

## Папки

| Путь | Что | Статус |
|---|---|---|
| `convex/schema.ts` | 10 таблиц спеки с индексами (дроби — string); у `students` поля урока: `currentTask`, `turnNo`, `hintLevel`, `lastVerdict`, `lastReply` | готово |
| `convex/turn.ts` | action `turn`: preGuard → вердикт кода → Ustoz (∥ guardIn для текста) → postChecks → outputCheck → `recordReply`; без ключа — replay → запасной путь | готово, LLM не гонялся |
| `convex/conductor.ts` | mutations: `startDemoLesson`, `turnContext`, `submitAnswer` (вердикт, серия, topicStatus, дома), `recordText`, `recordReply` (сверка turnNo), `setCrisis` | урок готов |
| `convex/lesson.ts`, `convex/lessonView.ts` | query `view` — публичная проекция задачи (без answer/distractors) | готово |
| `convex/llmCache.ts` | internal `get`/`put` — адаптер REPLAY | готово |
| `components/ConvexClientProvider.tsx` | `ConvexReactClient` в `app/layout.tsx` | готово |
| `convex/crons.ts` | «дом гаснет», сводка родителю | пустой cronJobs |
| `lib/fractions/` | `task.ts` (контракт задачи), `parseAnswer.ts`, `generator.ts` (+`DEMO_PROBES`), `numberCheck.ts`, `leakDetector.ts` | готово |
| `lib/safety/` | `preGuard.ts` (лимит, нормализация, транслит, base64, ПДн, триггеры от 1-го лица), `pii.ts`, `crisis.ts` (текст — заглушка), `copyCheck.ts`, `repeatGuard.ts` | готово, триггеры не вычитаны |
| `lib/text/` | `normalize.ts` (NFKC, апострофы, ½), `similarity.ts` (триграммный Jaccard) | готово |
| `lib/llm/` | `call.ts` (`callStructured`: таймаут, retry 1, refusal/null → сбой, breaker, llmCache replay/live), `postChecks.ts` (Ustoz + `fallbackUstoz`), `prompts/` (Ustoz, guard, outputCheck, хвосты, `fenceChildInput`) | готово, живьём не гонялось |
| `lib/content/index.ts` | загрузка и проверка `content/graph.json` (пререквизиты, ацикличность) | готово |
| `lib/planner/planner.ts`, `lib/houses/houseMapper.ts` | план (правила вне спеки — в шапке файла), дома + demote | готово |
| `lib/types.ts` | состояния, уровни, дома, вход хода, zod-схемы спеки (enum без регистра через `ci`) | готово |
| `lib/config.ts` | модели, таймауты, лимиты, пороги, номера кризиса, DEMO_MODE | готово |
| `lib/motion.ts` | все пружины и тайминги, `useMotion()` | готово |
| `lib/utils.ts` | `cn()` | готово |
| `app/(child)/{goal,diagnose,mahalla,lesson,teach,chat}`, `app/parent`, `app/page.tsx` | экраны, серый каркас без логики (до ок на DESIGN v1) | каркас |
| `components/skeleton/Shell.tsx` | оболочка каркаса: `Shell`, `AiBadge` (плашка ИИ), `LangSwitch`, `Character`-заглушка | каркас |
| `lib/i18n.ts` | `useT()`: язык из `localStorage["bobr:lang"]`, uz по умолчанию, гидрация через `useSyncExternalStore` | готово |
| `components/ui/press-button.tsx` | единственная нажимаемая кнопка v1: ink-уступ из одной MotionValue `y` | v1, ждёт ок |
| `app/dev/styleguide` | живой лист дизайн-системы (в проде 404); `house.tsx` — дома и плитка-лента | v1, ждёт ок |
| `app/globals.css` | токены DESIGN.md (`@theme static`), v1: `--stroke-ink*`, `--shadow-well`, `--shadow-drop` | v1 |
| `content/` | граф (готов, uz — вычитка), заблуждения, шаблоны, чек-листы, кризис | граф есть, остальное пусто — см. [[backlog]] |
| `i18n/uz.json`, `i18n/ru.json` | строки UI каркаса (ключи совпадают; uz — `_todo` вычитка) | каркас |
| `tests/` | vitest (`content.test.ts` — граф, схемы) | начат |
| `scripts/verify.sh` | tsc ×2 + vitest + convex --once | готово |
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
