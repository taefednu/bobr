# Заявки на общие файлы

`convex/schema.ts`, `lib/types.ts`, `lib/config.ts` правит только сессия core трека A ([[A-core]]): два агента,
одновременно правящие схему, ломают друг другу пуш в Convex. Нужно поле/таблица/индекс/тип — допиши
заявку сюда (новое сверху), закоммить, напиши владельцу трека A. Core разбирает заявки в начале сессии.

## Открытые

| Дата | Трек | Что нужно | Зачем | Статус |
|---|---|---|---|---|
| 18.11 | A-teach | `students.teachScene?: { turnNo, beat, reply, lineKey, pose, attempt, task, rounds }` (task без `answer`) | Экрану «Научи Bobr» нужны реплика и поза через `useQuery` и после перезагрузки. Пока они только в ответе action | не блокирует, нужно к интеграции вечером |
| 18.11 | A-teach | Экспортировать из `convex/turn.ts` общие `llm()`, `cacheOf`, `guardStep`, `outputOk` | `convex/teach.ts` держит их копию, а правки guard и outputCheck должны идти в одном месте | не блокирует |
| 18.11 | A-teach | Таблица `bobrState { studentId, level, taughtCount, lastLines[] }` из SPEC_SYSTEM | Сейчас `level` = число строк `taught_bobr`, реплики берём из `turns` (role `bobr`). Нужна, только если core хочет хранить это явно | не блокирует, можно отклонить |
| 18.11 | A-front | **Цель:** action `goal.turn({studentId, intent?})` → `{reply: string, buttons: {label: string, intent: "test_soon"\|"improve"\|"just_practice"}[], done: boolean}` (форма `GoalDialog`) | экран `/goal`: Bobr спрашивает кнопками; сейчас заглушка `lib/ui/demo-data.ts` | открыта |
| 18.11 | A-front | **Диагностика:** query `diagnose.current({studentId})` → `{probe: {id, topic, kind: "input"\|"mcq", prompt: {key: string, params: Record<string,string>}, options?: string[]} \| null, done: boolean}` **без ответа и дистракторов-как-ответа**; mutation/action `diagnose.answer({studentId, probeId, value})` → `null` (следующая проба приходит через query). Экран не считает вердикт и не знает число проб | экран `/diagnose`, адаптивная диагностика | открыта |
| 18.11 | A-front | **План:** query `plan.current({studentId})` → `{order: TopicId[], days: {date: string, items: {topic: TopicId, kind: "new"\|"review"\|"mixed_check"}[]}[]} \| null` (выход `buildPlan`) | экран `/plan`; заглушка зовёт настоящий `buildPlan` на демо-статусах | открыта |
| 18.11 | A-front | **Махалля:** query `mahalla.houses({studentId})` → `{topic: TopicId, state: HouseState}[]` на все 10 тем (`houseState` считает сервер) + `nextTopic: TopicId \| null` | экран `/mahalla`; заглушка зовёт настоящий `houseState` | открыта |
| 18.11 | A-front | **Вход ребёнка:** как экраны получают `studentId` после `claimLinkCode` (сейчас только `bobr:lessonStudent` из `startDemoLesson`) и старт урока по теме из плана (`startLesson({studentId, topic})`) | связать шаги 1–5 в один путь | открыта |

## Баги в чужих зонах

| Дата | Кто нашёл | Где | Что | Статус |
|---|---|---|---|---|
| — | — | — | — | — |
