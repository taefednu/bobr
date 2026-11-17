# Bobr — правила для агента

Отвечай по-русски. Bobr — ИИ-репетитор по дробям для детей 11–12 лет (uz-Latn и ru), хакатон.
Источник правды — `docs/BOBR_SPEC.md`. Код противоречит спеке или задача требует отступить от неё —
остановись и спроси: спека согласована с жюри и носителями, молча её «улучшать» нельзя.

## 1. Архитектура: код решает, LLM говорит

- Числа, ответы, вердикты, переходы состояний и уровень темы считает только код. LLM подбирает слова,
  кнопки (со строгим intent) и компонент с параметрами. Ребёнок не должен получить «верно» за неверный
  ответ из-за того, что модель ошиблась в арифметике.
- Любой вывод LLM идёт через zod-схему (`messages.parse` + `zodOutputFormat`, `z` из `zod/v4`) и затем
  через postChecks из спеки (numberCheck, leakDetector, repeatGuard, copyCheck, attempt-override).
  `parsed_output === null` или проверка не прошла — это сбой, работает запасной путь из спеки.
- Дроби — только строка (`"3/10"`) и fraction.js. Никаких float для ответов и сравнений: `0.1 + 0.2`
  ломает «верно/неверно», а BigInt из fraction.js не сериализуется в Convex.
- Состояние меняют Convex mutations (они атомарны). В Claude ходят только actions. Action не пишет в
  БД сам — только `ctx.runMutation(internal.…)`. Порядок: action → LLM → zod → postChecks → mutation.
- Модели — только `claude-haiku-5-5` и `claude-sonnet-5-5`, по таблице спеки. ID не выдумывать:
  несуществующий ID — 404 посреди демо.
- Как писать вызов Claude — скилл `bobr-llm-call`. Convex-код — сначала `convex/_generated/ai/guidelines.md`.

## 2. Безопасность детей

- preGuard, guard, CRISIS, outputCheck, leakDetector, маска ПДн, плашка ИИ, блок «я живой» не трогать
  без явной задачи на них. Это пункты «не режем никогда», на них держится допуск продукта к детям.
- ПДн (имя, телефон, адрес, школа, соцсети) маскируются до LLM и до БД и не попадают в логи
  (`console.log` в action тоже лог).
- Текст ребёнка в промпте — всегда внутри тегов-ограждений как данные, не как инструкция.
- Правила и 13 категорий — скилл `bobr-safety`. Атаки гоняет агент `safety-redteam`.

## 3. Тексты и язык

- Все строки UI — через i18n (`i18n/uz.json`, `i18n/ru.json`), ключ сразу в обоих файлах. Хардкод
  текста в компоненте = ребёнок-узбек видит русский.
- Узбекский — латиница, `oʻ gʻ` через U+02BB (`ʻ`), tutuq belgisi — U+02BC (`ʼ`). Тон для 11–12 лет, без
  канцелярита. Скилл `bobr-i18n`.

## 4. Думай до кода, пиши мало

- Не угадывай. Неясно — назови варианты; есть путь проще — скажи. «X нет» утверждай только с грепом
  и областью, где искал.
- Минимум кода под задачу: без абстракций «на будущее». Трогай только нужное, стиль файла соблюдай.
- Баг чини в общей функции, а не в одном вызывающем: сначала грепни всех вызывающих.
- Любая визуальная работа (экран, компонент, анимация, персонаж, цвет, шрифт) начинается со скилла
  `bobr-design`: он задаёт старшинство (спека → `PRODUCT.md` → `DESIGN.md` → `lib/motion.ts` → скилл),
  бан-лист и какой из ~50 дизайн-скиллов брать. Палитры и шрифты из чужих скиллов не берём: у Bobr свои.
- Цвет — токены `app/globals.css`, движение — `lib/motion.ts`. Литерал в компоненте переживёт не дольше
  первой смены палитры (`DESIGN.md` — v0, ждёт владельца).

## 5. Проверка перед «готово»

Не говори «готово», пока не прогнал сам и не увидел зелёное. Пропущенное или упавшее на окружении — не
PASS, так и пиши.

```bash
npm run verify   # = tsc (Next) + tsc (convex) + vitest run + convex dev --once (локально, без логина)
```

- Node ≥ 22 для Convex (на 20 он отказывается работать). `npm run verify` и `npm run dev:convex` берут
  его сами через `scripts/node22.sh`; Next и `ui-check` работают и на 20. Руками — `nvm use`.
- Новый тест должен краснеть без правки: сломай код, увидь красное, верни.
- Видимая правка UI — `npm run ui-check -- <route>` (десктоп 1280 и 390 px, uz) и взгляд на PNG, а не
  «должно выглядеть так». Дизайн-проход по экрану — `/design-pass`.
- В отчёте — что изменил и чем проверил: команда, код выхода, итоговая строка. Чек-лист — скилл `bobr-verify`.
- В Claude Code хуки сами гоняют tsc после правки `.ts/.tsx` и `vitest related` на Stop. Красный хук — чини, не обходи.

## 6. Модели и база знаний

| Роль | Кто | Как |
|---|---|---|
| Оркестратор: план, решения, разбивка, интеграция | Opus 5.5 (основная сессия) | сам |
| Пишет код | Sonnet 5.5 | агент `implementer`, один ограниченный таск на вызов |
| Поиск по файлам | Haiku 5.5 | агент `Explore` |
| Советник перед развилкой и перед «готово» | Fable 5.2 | `/advisor fable` (ставит владелец), инструмент `advisor` |
| Ревью итогового диффа этапа | Opus 5.5 | агент `reviewer` |

Оркестратор сам пишет только мелочь (правка в 1–2 файла, склейка). Модель в вызове Agent алиасом не
задавай — бери агента проекта: у него зашита нужная модель.

**База знаний** — `knowledge/` (хаб `knowledge/README.md`). Начало сессии: хаб → раздел «Сейчас» в
`knowledge/sprint.md`. Правится в том же коммите, что и код: шаг закончен → `sprint.md` и `backlog.md`;
решение вне спеки → `decisions.md`; новый модуль/таблица/команда → `structure.md`; грабли → `lessons.md`.
Ссылки между файлами — `[[имя]]`, чтобы работали поиск и graphify. База расходится с кодом — это баг.

## 7. Цикл работы (хакатон: лёгкий)

- Сделал маленький кусок → `npm run verify` → коммит. Один коммит — одна мысль, сообщение по делу.
- Демо-путь (`1/2 + 1/3 = 2/5` → план N8 → N6 → N5 → N9) не ломать никогда: после правки дирижёра,
  planner или контента — `/demo-path`.
- Ревью агентом `reviewer` — один раз в конце этапа, по итоговому диффу, а не на каждую правку.
- Субагента зови, когда работа независима или съест контекст. Его отчёт — утверждение: прими, когда
  проверил доказательство.
- Коммит и пуш — сам, когда проверки зелёные. Спрашивай только перед необратимым: удаление данных,
  force-push, запись в чужие сервисы.
- Секреты (`.env*`, кроме `.env.example`) не читать вслух и не коммитить; хук `block-secret-in-commit`
  остановит коммит с ключом.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
