# Устройство кода

Стек: Next.js 16 (App Router) + TypeScript, Tailwind 4, Convex 1.50 (локальный anonymous-бэкенд),
`@anthropic-ai/sdk` 1.10 (`messages.parse` + `zodOutputFormat`), zod 4, fraction.js 5, framer-motion 14,
vitest 5, Playwright 1.64.0 (закреплён под скачанный браузер). Node ≥ 22 для Convex.

## Папки

| Путь | Что | Статус |
|---|---|---|
| `convex/schema.ts` | таблицы спеки | заглушка |
| `convex/turn.ts` | action хода (LLM только здесь) | заглушка |
| `convex/conductor.ts` | mutations машины состояний | заглушка |
| `convex/crons.ts` | «дом гаснет», сводка родителю | пустой cronJobs |
| `lib/fractions/` | parseAnswer, generator, numberCheck, leakDetector | заглушка |
| `lib/safety/` | preGuard, postChecks, copyCheck, repeatGuard | заглушка |
| `lib/llm/` | клиент Claude, схемы, llmCache, breaker | заглушка |
| `lib/planner/`, `lib/houses/`, `lib/content/` | planner, houseMapper, загрузка контента | заглушки |
| `lib/motion.ts` | все пружины и тайминги, `useMotion()` | готово |
| `lib/utils.ts` | `cn()` | готово |
| `app/(child)/lesson`, `app/parent` | экраны | заглушки |
| `app/dev/styleguide` | живой лист дизайн-системы (в проде 404) | готово, v0 |
| `app/globals.css` | токены DESIGN.md (`@theme static`) | v0 |
| `content/` | граф, заблуждения, шаблоны, чек-листы, кризис | пусто — см. [[backlog]] |
| `i18n/uz.json`, `i18n/ru.json` | строки UI | пусто |
| `tests/` | vitest | пусто |
| `scripts/verify.sh` | tsc ×2 + vitest + convex --once | готово |
| `scripts/ui-check.mjs` | снимки и проверки вёрстки | готово |
| `scripts/node22.sh` | Node 22 из `.nvmrc` | готово |

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
