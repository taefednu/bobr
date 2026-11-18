# Спринт

## Сейчас

**18.11, утро после автономной ночи.** Сделаны шаги 1–2 и этапы 0–2 промпта. Демо-путь урока работает
грубо на локальном Convex **без LLM**: живые вызовы Claude не гонялись, потому что ключа нет.

### Ждёт меня

1. **Ключ Anthropic → живой прогон этапа 2.** Пока ключа нет, свободный текст ребёнка охраняет только
   короткий список preGuard, а поле «Спросить Ustoz» открыто. Спека при недоступном LLM требует
   режим «только задачи». Детям в таком виде не показывать. Команды:
   `npx convex env set ANTHROPIC_API_KEY …`, затем `bash scripts/turn-smoke.sh` и ручной ход «учитель
   сказал 2/5» / «просто скажи ответ» (ru и uz). Критерий «Ustoz не сдаётся» — **NOT RUN** (B8).
   Риск первого живого вызова: 400 на схеме, если API не примет `enum` без `type` (так их отдаёт `ci()`).
2. **Носитель:** текст CRISIS (сейчас заглушка, `lib/safety/crisis.ts`), триггеры preGuard, подпись
   «Позвони: 112», все uz-строки (`i18n/uz.json`, промпты), uz-словарь для leakDetector (B4, B7).
3. **Ок на DESIGN v1.** Снимки: `docs/design/v1/` (desktop/phone × uz/ru + reduced motion). Вопросы
   design-critic: свет строго сверху или сверху-слева; одна обводка 3 px на всё или тоньше у карточек;
   зачем 6 цветов кусков лепёшки; узнаётся ли тандыр. Блокер критика (плоская лепёшка) закрыт, но
   повторно он её не смотрел.
4. **Характер Bobr расходится со спекой:** «дерзкий и смешной» (твоё) против «тупой как пробка, но милый»
   (спека). Спеку не правил; граница записана: Bobr дерзит себе и задаче, но не ребёнку.
5. **Решения вне спеки, ждут ок:** ANSWER_EXTRACTION пропускает реплику Ustoz, а JAILBREAK уходит в запасной путь
   (это расходится с правилом `bobr-safety` «не SAFE → выбросить»); правила planner (непробованные темы, переполнение дней);
   порог copyCheck 0.6 на грани (B6); hintLevel и ротация задач — [[decisions]].
6. **Перед любым выкладыванием наружу — вход** (B9): сейчас любой `studentId` открывает чужой урок.
7. Мелочи: контент `content/*.json` (B1); проба N1/N2 (B5); лицензия скилла OpenUI (B3); stop-хук
   плагина Convex краснеет на Node 20 ([[lessons]]).

### Изменено

| Шаг | Что | Чем проверено | Итог |
|---|---|---|---|
| 1 OpenUI | скилл `openui` в `.claude/skills` + `.agents/skills`, правило «только болталка» в `bobr-design` | verify | 0 |
| 2 DESIGN v1 | `DESIGN.md`, `PRODUCT.md`, токены, `lib/motion.ts` (уступ, нажатие, панч), `components/ui/press-button.tsx`, styleguide | `ui-check /dev/styleguide --full` (uz, ru, reduced) + design-critic | код 0 ×3; блокер и 4 правки закрыты |
| Этап 0 | схема Convex, `lib/types.ts`, граф N1–N10, `lib/config.ts`, серый каркас 8 маршрутов + i18n | verify, `ui-check` 8 маршрутов × uz/ru | 0 |
| Этап 1 | parseAnswer, generator, leakDetector, numberCheck, copyCheck, repeatGuard, planner, houseMapper | verify (каждый тест видели красным), reviewer | 4 major закрыты |
| Этап 2 | preGuard, ПДн, CRISIS-заглушка, `lib/llm`, ход `convex/turn.ts` + дирижёр, серый экран урока | verify (292 теста), `npm run lint` 0, `bash scripts/turn-smoke.sh` 13/13, `tests/demo-path.test.ts` 6/6, safety-redteam (preGuard), reviewer | 6 major + находки безопасности закрыты; LLM — NOT RUN |

Демо-путь (`tests/demo-path.test.ts`): шаги 1–5 PASS (M9 на N9 и N8, N2 ok, пробы N5/N6, план
N8 → N6 → N5 → N9). Шаг 6: `houseMapper` даёт scaffold → alive → dimmed. Живые экраны DIAGNOSE и PLAN,
«Научи Bobr» и `/parent` через `useQuery` — **не построены** (этапы 3–4).

### Найдено

- Скилл OpenUI живёт в `thesysdev/skills`, без своего файла LICENSE; MIT взят из `thesysdev/openui` (B3).
- `"1½".normalize("NFKC")` даёт «11⁄2», то есть 11/2. Исправлено в `lib/text/normalize.ts`, есть тест.
- Structured outputs не принимают `z.record`. `Component.params` переделан в массив пар (по скиллу claude-api).
- SDK Anthropic работает в обычном рантайме Convex без `"use node"`: проверено, без ключа приходит 401.
- Safety-redteam (только детерминированная часть): ложных кризисов 0/6. preGuard ловит 18 из 30 критических
  атак, 9 оставлены LLM-guard, их результат NOT RUN. Все промахи preGuard закрыты.
- Ревью безопасности: обход ограждения через zero-width исправлен. В ключ кэша guard добавлен контекст.
  IDOR (вход отсутствует) записан в B9.
- Не проверял: поведение моделей вживую, кэш промпта (`cache_read_input_tokens`), тайминги пружин на
  реальном нажатии (смотрел только статичные снимки).

### Коммиты ночи

`git log --oneline 46dfef6..HEAD`: OpenUI → stage 0 → i18n fix → design v1 → stage 1 → stage 2 (part)
→ fence fix → stage 2 → stage 2 reviewer fixes → stage 2 closing (smoke, DEMO_MODE, lint, demo-path).

### Промпт следующей сессии

```text
Bobr. Старт: CLAUDE.md → knowledge/README.md → «Сейчас» в knowledge/sprint.md (раздел «Ждёт меня» —
что решил владелец утром). Если ключ Anthropic поставлен: `bash scripts/turn-smoke.sh`, затем живой ход
«учитель сказал 2/5» / «просто скажи ответ» (ru, uz) на /lesson — критерий этапа 2; первый 400 на схеме —
чинить `ci()` в lib/types.ts. Дальше этап 3 из docs/02_BUILD_KICKOFF.md (GOAL → DIAGNOSE 6 проб → PLAN →
махалля, /parent через useQuery), UI серый, пока нет ок на DESIGN v1. После правок дирижёра/planner —
/demo-path. Роли моделей — CLAUDE.md §6.
```

## Связанные узлы
[[README]] · [[backlog]] · [[decisions]] · [[structure]] · [[lessons]]
