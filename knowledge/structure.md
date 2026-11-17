# Устройство кода

Стек: Next.js 16 (App Router) + TypeScript, Tailwind 4, Convex 1.50 (локальный anonymous-бэкенд),
`@anthropic-ai/sdk` 1.10 (`messages.parse` + `zodOutputFormat`), zod 4, fraction.js 5, framer-motion 14,
vitest 5, Playwright 1.64.0 (закреплён под скачанный браузер). Node ≥ 22 для Convex.

## Папки

| Путь | Что | Статус |
|---|---|---|
| `convex/schema.ts` | 10 таблиц спеки с индексами (дроби — string) | готово |
| `convex/turn.ts` | action хода (LLM только здесь) | заглушка |
| `convex/conductor.ts` | mutations машины состояний | заглушка |
| `convex/crons.ts` | «дом гаснет», сводка родителю | пустой cronJobs |
| `lib/fractions/` | parseAnswer, generator, numberCheck, leakDetector | заглушка |
| `lib/safety/` | preGuard, postChecks, copyCheck, repeatGuard | заглушка |
| `lib/llm/` | клиент Claude, схемы, llmCache, breaker | заглушка |
| `lib/content/index.ts` | загрузка и проверка `content/graph.json` (пререквизиты, ацикличность) | готово |
| `lib/planner/`, `lib/houses/` | planner, houseMapper | заглушки |
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
