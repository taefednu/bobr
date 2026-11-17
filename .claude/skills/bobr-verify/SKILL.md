---
name: bobr-verify
description: Checklist before saying a Bobr task is done — npm run verify (tsc Next + tsc convex + vitest + convex dev --once), red-before-green for new tests, demo path, UI screenshot, i18n parity, safety invariants, honest report. Use at the end of every task and before every commit that claims something works.
---

# Проверка перед «готово»

Пропущенное, упавшее на окружении или не запущенное — это не PASS. Так и пиши.

## 1. Всегда

```bash
npm run verify
```

= `tsc --noEmit` (Next) + `tsc --noEmit -p convex` + `vitest run` + `CONVEX_AGENT_MODE=anonymous convex dev --once`.
Код выхода 0 и четыре строки `PASS` в конце. Node ≥ 22 скрипт берёт сам (`scripts/node22.sh`).

## 2. По тому, что тронуто

| Тронуто | Доказательство |
|---|---|
| Новый тест | сломай код → тест красный → верни → зелёный. Тест, который не краснеет, ничего не проверяет |
| `lib/fractions`, parseAnswer, generator | тесты из скилла `bobr-fractions`, включая uz-формы и разные апострофы |
| conductor, planner, houseMapper, контент | `/demo-path` — демо-путь `1/2 + 1/3 = 2/5` → план N8 → N6 → N5 → N9 |
| LLM-шаг | zod-схема + postChecks + запасной путь при `parsed_output == null`; REPLAY-ключ без ПДн |
| `lib/safety`, guard, outputCheck, CRISIS | агент `safety-redteam`: критические 30/30, ложных кризисов 0/6 |
| Строки UI | ключ в `uz.json` и `ru.json` (проверка — скилл `bobr-i18n`) |
| Видимая правка | снимок страницы 1280 и 390 px, посмотреть глазами вопросом «что здесь сломано» |
| Поток (клик → результат) | настоящий клик и видимое следствие, не «код выглядит правильно» |
| Convex-функции | `convex dev --once` без ошибок; action не пишет в БД напрямую |

Dev-сервер, поднятый раньше, может отдавать старый код — перезапусти перед проверкой
(скилл `prevent-stale-dev-server-serves-old-code`).

## 3. Инварианты — грепом по диффу

```bash
git diff HEAD -- . ':!docs' | grep -nE '^\+.*(parseFloat|Number\(|toFixed|claude-[a-z]+-[0-9]|console\.log)'
```

- float в ответах → только fraction.js и строки.
- model ID — только `claude-haiku-5-5`, `claude-sonnet-5-5`.
- `console.log` в action рядом с текстом ребёнка — утечка ПДн в логи.
- Хардкод русского/узбекского текста в `.tsx` — должен быть ключом i18n.

## 4. Отчёт

Что изменил (файлы), чем проверил (команда → код выхода → итоговая строка), что не проверено и почему.
Конец этапа — дифф целиком агенту `reviewer`, один раз.
