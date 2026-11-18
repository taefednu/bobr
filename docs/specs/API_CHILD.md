# API экранов ребёнка (этап 3: цель → диагностика → план → махалля)

Контракт core → front. Все функции берут `token` детской сессии (не `studentId`): query без сессии возвращает
`null` (экран «введи код»), mutation бросает `unauthorized`. Числа, вердикты и переходы считает сервер; ответа
на пробу (`answer`, `distractors`) в ответах нет. Дроби — строки.

Стейты: `ONBOARD_CONSENT → GOAL_SETUP → DIAGNOSE → PLAN → HOME → LESSON_SOLVE`. Маршрут экрана — по `session:me().state`.

| Функция | Тип | Args | Returns |
|---|---|---|---|
| `session:startDemo` | mutation | `{lang: "uz"\|"ru"}` | `{token}` — новый ребёнок в `ONBOARD_CONSENT` (дальше `session:acceptConsent`); токен в `localStorage`. Работает только при `DEMO_ALLOW_ANON=1` в env Convex (локально включено), иначе `unauthorized` |
| `linkCode:claim` | mutation | `{code}` (8 символов, регистр не важен) | `{token}`; страница `/c/{code}` и поле «введи код». Ошибка `invalid or expired code` |
| `session:acceptConsent` | mutation | `{token}` | `null`; экран раскрытия ИИ: `ONBOARD_CONSENT → GOAL_SETUP` |
| `session:me` | query | `{token}` | `null \| {studentId, lang, state, goal\|null, testDate\|null}` |
| `goal:set` | mutation | `{token, goal: "test_soon"\|"improve"\|"just_practice", testDate?: "YYYY-MM-DD"}` | `null`; из `GOAL_SETUP` переводит в `DIAGNOSE` |
| `diagnose:start` | mutation | `{token}` | `null`; выдаёт первую пробу (идемпотентно) |
| `diagnose:view` | query | `{token}` | `null \| {state, asked, maxProbes, probe}` |
| `diagnose:answer` | mutation | `{token, probeId, value}` | `{accepted, done}` |
| `plan:view` | query | `{token}` | `null \| {testDate\|null, gaps, order, days}` |
| `plan:accept` | mutation | `{token}` | `null`; `PLAN → HOME` |
| `mahalla:view` | query | `{token}` | `null \| {lang, state, houses, next}` |
| `mahalla:startLesson` | mutation | `{token, topic}` | `null`; `HOME → LESSON_SOLVE` |
| `lesson:view` | query | `{token}` | проекция урока (как раньше) |
| `turn:turn` | action | `{token, input}` | `{status}` |
| `conductor:leaveCrisis` | mutation | `{token}` | `null` |

Урок: `lesson:view`, `turn:turn`, `conductor:leaveCrisis` принимают `token` **вместо** `studentId`. Старый `studentId` пока
работает, чтобы не сломать текущий экран урока; он будет удалён (BLOCKERS B9) — новые вызовы пиши на `token`.
`conductor:startDemoLesson` работает только при `DEMO_ALLOW_ANON=1`.

## Формы

```ts
// diagnose:view
{ state: string,                 // "DIAGNOSE" | "PLAN" | …
  asked: number,                 // сколько проб уже отвечено
  maxProbes: number,             // потолок (диагностика адаптивная — проб может быть меньше)
  probe: null | {                // null: пробы нет (ещё не start или диагностика закончена)
    id: string, topic: string, kind: "mcq",
    params: Record<string, string>,   // как у задачи урока: {a,b,c,d} | {a,c,den} | {num,den} | …
    numbersShown: string[],
    options: string[] } }             // варианты кнопками, порядок задаёт сервер

// diagnose:answer → {accepted: boolean, done: boolean}
// accepted=false: probeId не текущий (двойной тап) — ничего не изменилось. done=true: стейт стал PLAN.
// Верно/неверно ребёнку не сообщается: результат виден в плане (gaps).

// plan:view
{ testDate: string | null,
  gaps: string[],                                  // темы-пробелы по диагностике, id
  order: { topic: string, title: string }[],       // порядок тем плана; title на языке ребёнка
  days: { date: string, items: { topic: string, title: string, kind: "new" | "review" | "mixed_check" }[] }[] }

// mahalla:view
{ lang: "uz" | "ru", state: string,
  houses: { topic: string, title: string,          // все 10 тем графа, порядок графа
            state: "empty" | "scaffold" | "built" | "alive" | "dimmed",
            prereqs: string[],                     // улицы
            inPlan: boolean,
            canStart: boolean }[],                 // есть задачи (генератор) и тема в плане
  next: string | null }                            // следующая тема плана (первая не решённая)
```

## Диагностика

Адаптивная: следующая проба зависит от ответа — ошибка → пробы пререквизитов из графа, верно → ветка
закрыта. Темы без задач (N1, N3, N4, N7, N10) пробой не проверяются и уровень не получают. При
`DEMO_MODE=script` порядок фиксированный (N9 → N8 → N2 → N5 → N6). Вердикт в обоих режимах считает код по ответу
ребёнка. Верная проба → тема `solved_self` (дом `built`), неверная → `gap` (`scaffold`); непроверенные темы — `empty`.
