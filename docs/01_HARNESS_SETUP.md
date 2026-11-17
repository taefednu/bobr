# Промпт 1 — настройка харнесса (запускать в пустой папке проекта `bobr`)

Ты настраиваешь рабочее окружение для хакатон-проекта **Bobr**. Это ИИ-репетитор по дробям для детей 11–12 лет на узбекском и русском. Спецификация продукта лежит в `docs/BOBR_SPEC.md`: прочитай её целиком прежде всего остального. Код продукта ты НЕ пишешь, только окружение для агентов, которые будут его писать. Команды запускай сам, ничего у меня не спрашивай. В конце дай отчёт.

## Что можно брать из моих репозиториев

- **Инструменты агентов** берём свободно: CLAUDE.md / AGENTS.md, скиллы, субагенты, хуки, команды, конфиги, тестовые утилиты.
- **Общий утилитарный код** копируй как есть, если он реально нужен Bobr: обёртки над LLM, i18n-хелперы, хуки и компоненты анимаций, UI-примитивы, утилиты. Перед копированием вычисти упоминания Mentorium, мёртвый код и чужие зависимости. Положи в `lib/` или `components/ui/` и прогони typecheck.
- **Продуктовую логику Mentorium не брать:** уроки, прогресс, профили, менторы, оплаты, их схемы БД и API, узнаваемые экраны. У Bobr своя машина состояний по спеке.
- Всё скопированное перечисли в отчёте: откуда → куда.

Секреты не копировать никогда: `.env*`, ключи, токены, `settings.local.json`, credentials.

## Шаг 1. Convex

Настрой Convex в текущей папке:

- Если в папке только `docs/BOBR_SPEC.md` (она «пустая»): перенеси `docs/` в `/tmp/bobr-docs`, запусти `npm create convex@latest . -- -t bare`, верни `docs/` обратно.
- Если в `package.json` уже есть `convex`: `npx convex ai-files install`.
- Любой другой проект: `npm install convex`, добавь пустой `convex/schema.ts` и скрипт `convex dev`, затем `npx convex ai-files install`. Здесь никогда не запускай `npm create convex`: он заменяет папку.

Если `npm create convex` падает из-за сети, запусти его ещё раз вне песочницы.

После `npx convex ai-files install` проверь, что существуют `convex/_generated/ai/guidelines.md` и `.agents/skills`. Команда возвращает код 0, даже если загрузка не удалась. Если чего-то нет, повтори вне песочницы.

Затем поставь плагин Convex для каждого кодинг-агента на машине, а не только для себя:

- Claude Code (`claude` в PATH): `claude plugin marketplace add anthropics/claude-plugins-official`, затем `claude plugin install convex@claude-plugins-official --scope user`.
- Codex (`codex` в PATH): `codex plugin marketplace add convex/convex-codex-plugin`, затем `codex plugin add convex@convex-codex-plugin`.

Проверь через `claude plugin list` или `codex plugin list | grep convex-codex-plugin`.

Поверх bare-шаблона добавь Next.js (App Router, TypeScript, Tailwind), если шаблон его не дал. Поставь зависимости: `@anthropic-ai/sdk`, `zod`, `fraction.js`, `vitest`, `framer-motion`. Проверь, что `npm run dev` и `npx convex dev` стартуют.

## Шаг 2. Разведка моих репозиториев (локально)

Репозитории лежат у меня на этом компьютере, смотри локальные копии, они свежее GitHub. Найди их: `find ~ -maxdepth 5 -type d \( -iname "Mentorium-Platform" -o -iname "videostudio" -o -iname "claude-skills" \) -not -path "*/node_modules/*" 2>/dev/null`. Если какой-то не нашёлся, клонируй с GitHub (`gh repo clone taefednu/<имя> /tmp/harvest/<имя>`). Локальные репо только читай, ничего в них не меняй.

Источники, в порядке приоритета:

1. **`Mentorium-Platform`** — главный. Забирай:
   - **`CLAUDE.md` как основу нашего CLAUDE.md.** Вычисти всё, что про Mentorium (продукт, менторы, оплаты, админка, их стек и пути), оставь только общие правила поведения агента и качества кода. Потом допиши правила Bobr из шага 3.
   - Дизайн-скиллы.
   - Полезных субагентов и хуки, если они быстрые.
   - **Тяжёлый воркфлоу и оркестрацию НЕ переносить.** Они медленные, у нас хакатон. Нужен лёгкий цикл: сделал → тесты/typecheck → коммит, ревью субагентом только в конце этапа.
2. **`videostudio`** — всё про анимации: скиллы и правила по motion, таймингам, пружинам, персонажам, генерации ассетов. Адаптируй под веб-анимации Bobr (framer-motion, PNG-позы, 2.5D/3D).
3. **`claude-skills`** — моя библиотека скиллов, бери то, что подходит под стек.
4. Остальные мои репо не трогай, если первых трёх хватает.

В каждом ищи: `CLAUDE.md`, `AGENTS.md`, `.claude/` (skills, agents, commands, hooks, settings.json), `.agents/`, `.codex/`, `.cursor/rules`, конфиги eslint/prettier/biome/tsconfig, тестовые хелперы.

Для каждой находки реши: **берём / адаптируем / пропускаем**. Берём только то, что реально пригодится Bobr. Критерии:

- Помогает писать Convex + Next.js + TypeScript.
- Помогает с LLM-вызовами, структурированным выводом, промптами, evals.
- Помогает с UI, анимациями, детским дизайном, i18n uz/ru.
- Помогает проверять работу: тесты, typecheck, ревью, верификация.
- Дисциплина агента: планирование, маленькие коммиты, не врать о готовности.

Всё, что завязано на продуктовую логику Mentorium (менторы, оплаты, админка), пропускай.

## Шаг 3. Собери харнесс Bobr

Создай или адаптируй:

**`CLAUDE.md` и `AGENTS.md`** (одинаковый смысл, AGENTS.md для Codex). Коротко, только правила, которые агент обязан соблюдать всегда:

- Источник правды — `docs/BOBR_SPEC.md`. Конфликт со спекой → остановись и спроси.
- Код решает, LLM говорит. Числа, ответы, вердикты и переходы — только код. LLM-вывод всегда через zod-схему и postChecks.
- Дроби только строкой через fraction.js. Никаких float для ответов.
- Состояние меняют Convex mutations. В Claude ходят только actions. Action никогда не пишет в БД напрямую, только через `ctx.runMutation`.
- Безопасность детей не трогать без явной задачи: preGuard, guard, CRISIS, outputCheck, leakDetector, маска ПДн, плашка ИИ.
- ПДн не попадают ни в LLM, ни в БД, ни в логи.
- Все строки UI — через i18n (uz-Latn и ru), никакого хардкода текста.
- Модели: `claude-haiku-5-5`, `claude-sonnet-5-5`. ID не выдумывать.
- Перед словом «готово»: `npx tsc --noEmit`, `npx vitest run`, `npx convex dev --once` без ошибок.
- Маленькие коммиты с понятным сообщением. Не ломать демо-путь.
- Чистые общие правила из CLAUDE.md Mentorium-Platform (без всего про Mentorium).

**Скиллы** (`.claude/skills/` и зеркально `.agents/skills/`). Отобранные из моих репо плюс новые под Bobr, если чего-то не хватает. Каждый — `SKILL.md` с чётким description, когда его использовать:

- `bobr-llm-call` — как писать action с Claude: messages.parse + zodOutputFormat, prompt caching (статичный префикс, хвост с beat), таймауты, retry 1, llmCache для REPLAY, circuit breaker.
- `bobr-safety` — правила child safety из спеки, 13 категорий, что делать с CRISIS, что нельзя менять.
- `bobr-fractions` — fraction.js, сериализация строкой, parseAnswer, leakDetector (ru/uz словесные формы).
- `bobr-i18n` — uz-Latn и ru: апострофы `oʻ gʻ`, тон для 11–12 лет, без канцелярита.
- `bobr-animation` — 2.5D/3D-стиль, PNG-позы + пружины framer-motion, не Duolingo.
- `bobr-verify` — чек-лист проверки задачи перед «готово».

**Субагенты** (`.claude/agents/`), если в моих репо есть подходящие, адаптируй. Иначе создай минимум:

- `reviewer` — ревьюит дифф против спеки и CLAUDE.md, ищет нарушения «код решает, LLM говорит» и child safety.
- `safety-redteam` — гоняет атаки из спеки против guard и outputCheck.
- `tester` — пишет и запускает vitest для детерминированных модулей.

**Хуки** (`.claude/settings.json`): после правки `.ts`/`.tsx` — быстрый typecheck затронутого. На Stop — `vitest run` по изменённым модулям. Хуки не должны блокировать работу дольше 30 с.

**Slash-команды** (`.claude/commands/`): `/verify` (полная проверка), `/demo-path` (прогон демо-пути 1/2+1/3=2/5 → N8 → N6 → N5 → N9).

**Структура папок** под спеку, пустые файлы с TODO-комментарием, без логики:

```
convex/      schema.ts, turn.ts (action), conductor.ts (mutations), crons.ts
lib/         fractions/, safety/, llm/, content/, planner/, houses/
app/         (child)/, parent/
content/     graph.json, misconceptions/, templates/, checklists/
i18n/        uz.json, ru.json
docs/        BOBR_SPEC.md
tests/
```

`.env.example` с `ANTHROPIC_API_KEY=`, `CONVEX_DEPLOYMENT=`, `NEXT_PUBLIC_CONVEX_URL=`, `DEMO_MODE=live|replay`.

## Шаг 4. Проверка

- `npm run dev` поднимается, `npx convex dev --once` без ошибок, `npx tsc --noEmit` чисто, `npx vitest run` проходит (пусть даже 0 тестов).
- Проверь, что Convex работает локально без интернета: `npx convex dev --local` или self-host в Docker, что из этого доступно. Запиши, как это запускать, в `docs/DEMO_OFFLINE.md`.
- `git init`, первый коммит «harness setup». В `.gitignore`: `.env*` кроме `.env.example`, `node_modules`, `/tmp/harvest`.
- Удали `/tmp/harvest`, если создавал.

## Шаг 5. Отчёт мне

Коротко, по-русски:

1. Что установлено (Convex, плагины, зависимости).
2. Таблица находок из моих репо: файл → берём / адаптировали / пропустили, и почему (одна строка на находку).
3. Список созданных скиллов, агентов, хуков, команд.
4. Работает ли офлайн-Convex и как его запускать.
5. Что не получилось и что мне сделать руками.
