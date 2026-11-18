# Заявки на общие файлы

`convex/schema.ts`, `lib/types.ts`, `lib/config.ts` правит только сессия core трека A ([[A-core]]): два агента,
одновременно правящие схему, ломают друг другу пуш в Convex. Нужно поле/таблица/индекс/тип — допиши
заявку сюда (новое сверху), закоммить, напиши владельцу трека A. Core разбирает заявки в начале сессии.

## Открытые

| Дата | Трек | Что нужно | Зачем | Статус |
|---|---|---|---|---|
| 18.11 | B/C-parent | Query с botSecret по telegramUserId: язык, parentId, согласие, цель/дата и привязанные дети с studentId; безопасная сводка для /progress | После перезапуска бот не может восстановить контекст через текущий API; пока честная заглушка, новый ребёнок только после согласия | открыта |
| 18.11 | B/C-parent | parents.setConsent должен сохранять consentAt; подтверждённое удаление родителя и связанных данных через API бота; настройки уведомлений/паузы | /delete, /settings, /pause пока заглушки; нельзя сообщать об успешном удалении без mutation | открыта |
| 18.11 | B/C-parent | outbox.listUnsent: серверная готовность к доставке (21–08 Asia/Tashkent, суммарно 1 несрочный пуш/день на родителя), приоритет кризисов независимо от первых 100 отложенных; category/notifyParent в выдаче | Лимит пока в памяти процесса и сбрасывается при рестарте; категория кризиса скрыта текущей проекцией, бот полагается на parentNotifyDecision core | открыта |
| 18.11 | B/C-parent | Производители daily_summary и forgotten, безопасные шаблоны; идемпотентность students.create для повторов после неопределённого сетевого результата | Бот доставляет готовый outbox.text, не создаёт сводки и не хранит свою БД | открыта |
| 18.11 | B/C-parent | parent.dashboard: даты освоения, тип ошибки без цитат, минуты по дням и недельная сводка; mutations настроек с sessionToken | Кабинет показывает только доступные поля, отсутствующие данные обозначены; BOT_SECRET в браузер не передаётся | открыта |
| 18.11 | A-teach | `students.teachScene?: { turnNo, beat, reply, lineKey, pose, attempt, task, rounds }` (task без `answer`) | Экрану «Научи Bobr» нужны реплика и поза через `useQuery` и после перезагрузки. Пока они только в ответе action | **принято, core сделает после мержа 13:30** — пришли точные типы полей (какие строки, какие числа, форма `task`) строкой ниже |
| 18.11 | A-teach | Экспортировать из `convex/turn.ts` общие `llm()`, `cacheOf`, `guardStep`, `outputOk` | `convex/teach.ts` держит их копию, а правки guard и outputCheck должны идти в одном месте | **сделано 18.11**: `llm`, `cacheOf`, `guardStep`, `outputOk` и типы `Turn`, `Diag` экспортированы из `convex/turn.ts`; копию в `teach.ts` убирай после мержа |
| 18.11 | A-teach | Таблица `bobrState { studentId, level, taughtCount, lastLines[] }` из SPEC_SYSTEM | Сейчас `level` = число строк `taught_bobr`, реплики берём из `turns` (role `bobr`). Нужна, только если core хочет хранить это явно | **отклонено**: уровень и реплики выводятся из `topicStatus` и `turns`, вторая копия разойдётся |
| 18.11 | A-front | Заявки ниже про цель, диагностику, план и махаллю закрываются черновиком core `docs/specs/API_CHILD.md`: front верстает под его формы. Нужно от core: закоммитить API и `convex/_generated`, чтобы они дошли до ветки `front` при мерже | подключить экраны к настоящим данным | **сделано 18.11**: код и `API_CHILD.md` в `main` (`eb1926d`), `convex/_generated` с новыми модулями там же — дойдёт до `front` при мерже |
| 18.11 | A-front | **Цель:** action `goal.turn({studentId, intent?})` → `{reply: string, buttons: {label: string, intent: "test_soon"\|"improve"\|"just_practice"}[], done: boolean}` (форма `GoalDialog`) | экран `/goal`: Bobr спрашивает кнопками; сейчас заглушка `lib/ui/demo-data.ts` | **сделано иначе**: `goal:set({token, goal, testDate?})`; кнопки и подписи — код + i18n (`goal.test`, `goal.improve`, `goal.just_practice`), фраза Bobr — пока i18n `goal.title`; живая фраза Haiku — позже отдельным action |
| 18.11 | A-front | **Диагностика:** query `diagnose.current({studentId})` → `{probe: {id, topic, kind: "input"\|"mcq", prompt: {key: string, params: Record<string,string>}, options?: string[]} \| null, done: boolean}` **без ответа и дистракторов-как-ответа**; mutation/action `diagnose.answer({studentId, probeId, value})` → `null` (следующая проба приходит через query). Экран не считает вердикт и не знает число проб | экран `/diagnose`, адаптивная диагностика | **сделано 18.11**: `diagnose:start/view/answer` по токену; проба всегда `mcq`, вместо `prompt` — `kind` + `params` как у задачи урока |
| 18.11 | A-front | **План:** query `plan.current({studentId})` → `{order: TopicId[], days: {date: string, items: {topic: TopicId, kind: "new"\|"review"\|"mixed_check"}[]}[]} \| null` (выход `buildPlan`) | экран `/plan`; заглушка зовёт настоящий `buildPlan` на демо-статусах | **сделано 18.11**: `plan:view`, `plan:accept` (в items и order есть `title`) |
| 18.11 | A-front | **Махалля:** query `mahalla.houses({studentId})` → `{topic: TopicId, state: HouseState}[]` на все 10 тем (`houseState` считает сервер) + `nextTopic: TopicId \| null` | экран `/mahalla`; заглушка зовёт настоящий `houseState` | **сделано 18.11**: `mahalla:view` (`houses` + `next`, ещё `prereqs`, `inPlan`, `canStart`) |
| 18.11 | A-front | **Вход ребёнка:** как экраны получают `studentId` после `claimLinkCode` (сейчас только `bobr:lessonStudent` из `startDemoLesson`) и старт урока по теме из плана (`startLesson({studentId, topic})`) | связать шаги 1–5 в один путь | **сделано 18.11**: `linkCode:claim({code})` или `session:startDemo({lang})` → `token` в `localStorage`; `session:me({token})` отдаёт `state` и `studentId` (нужен уроку, пока `turn`/`lesson:view` не на токене); `mahalla:startLesson({token, topic})` |

## Баги в чужих зонах

| Дата | Кто нашёл | Где | Что | Статус |
|---|---|---|---|---|
| — | — | — | — | — |
