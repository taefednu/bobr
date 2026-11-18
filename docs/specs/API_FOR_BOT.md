# API для Telegram-бота и Mini App `/parent`

Бот: Python (aiogram, long polling) + официальный клиент `convex`. Mini App: Next.js `/parent`. Код: `convex/{parents,students,linkCode,outbox,parent,parentLogin,demo,botAuth}.ts`, `lib/telegram/*`.

## Безопасность (обязательно)

| Что | Правило |
|---|---|
| Функции бота | Публичные, но каждая требует аргумент `botSecret`. Сравнение с env `BOT_SECRET` constant-time (`lib/telegram/secure.ts`). Не совпало или `BOT_SECRET` не задан в env → `Error("unauthorized")`. Секрет бота хранит только процесс бота. |
| Функции Mini App | `parent.dashboard` требует `sessionToken` из `parentLogin`. Токен случайный (48 символов, `crypto`), живёт 7 дней. Просрочен или неизвестен → `Error("unauthorized")`. |
| `parentLogin` | Проверяет Telegram initData по HMAC (Web Crypto), `auth_date` не старше 24 ч. Причина отказа не возвращается, всегда `unauthorized`. |
| Текст ребёнка | Ни одна функция ниже не возвращает ни `turns.text`, ни `lastReply`. Родитель видит сводку: уровни тем, план, счётчики недели, время последней активности. |
| ПДн в логах | В этих модулях нет `console.*`. Ошибки не содержат ни секрета, ни токена, ни имени. |
| Токен бота Telegram | Только в env Convex `TELEGRAM_BOT_TOKEN`. В файлы и в git не попадает. |
| Проверка | `tests/telegramInitData.test.ts` (верификатор, constant-time), `tests/displayNameGuard.test.ts`. |

Ограничение: ошибка `unauthorized` у бота и у Mini App одна и та же строка. Rate limit на подбор `botSecret` нет (секрет длинный и случайный; добавить `@convex-dev/rate-limiter`, если секрет станет короче).

## Env (задавать через stdin, чтобы значение не попало в историю шелла)

```bash
printf %s "$VALUE" | npx convex env set BOT_SECRET            # длинная случайная строка, она же у бота
printf %s "$VALUE" | npx convex env set TELEGRAM_BOT_TOKEN    # токен от BotFather
printf %s "$VALUE" | npx convex env set PUBLIC_APP_URL # адрес веб-приложения без / в конце, для ссылки /c/{code}
```

Локальный Convex: `http://127.0.0.1:3210`. Клиент: `ConvexClient("http://127.0.0.1:3210")`. На локальном бэкенде `npx convex env set` требует `CONVEX_AGENT_MODE=anonymous` (как в `scripts/*.sh`).

## Функции бота (все с `botSecret`)

Общая обвязка:

```python
import os
from convex import ConvexClient
BOT_SECRET = os.environ["BOT_SECRET"]
c = ConvexClient(os.environ.get("CONVEX_URL", "http://127.0.0.1:3210"))
```

### 1. `parents:upsertFromTelegram` (mutation)
Создать родителя или обновить `chatId/firstName/lang`. Идемпотентно по `telegramUserId`.
Args: `telegramUserId: str, chatId: str, firstName: str, lang: "uz"|"ru"`. Returns: `{"parentId": str}`. Errors: `unauthorized`.
```python
parent = c.mutation("parents:upsertFromTelegram", {"botSecret": BOT_SECRET, "telegramUserId": str(u.id),
    "chatId": str(chat.id), "firstName": u.first_name, "lang": "ru"})["parentId"]
```

### 2. `parents:setConsent`, `parents:setGoal` (mutation)
Согласие родителя и долгая цель (по спеке цель ставит родитель). `setGoal` копирует цель и дату всем привязанным детям (planner читает их со `students`).
Args: `parentId: str, consent: bool` / `parentId: str, goal: "test_soon"|"improve"|"just_practice", testDate?: "YYYY-MM-DD"`. Returns: `None`. Errors: `unauthorized`, `bad testDate` (не `YYYY-MM-DD`, несуществующая дата, в прошлом или дальше 365 дней).
```python
c.mutation("parents:setConsent", {"botSecret": BOT_SECRET, "parentId": parent, "consent": True})
c.mutation("parents:setGoal", {"botSecret": BOT_SECRET, "parentId": parent, "goal": "test_soon", "testDate": "2026-12-01"})
```
Кнопки ТЗ: «Скоро контрольная» = `test_soon`, «Подтянуть дроби» = `improve`, «Просто заниматься» = `just_practice` (решение владельца 18.11; старые `homework`/`unknown` удалены). Для `improve`/`just_practice` `testDate` не нужен: сервер его сбрасывает.

### 3. `students:create` (mutation)
Создать ребёнка и привязать к родителю. Язык берётся у родителя. Стейт `ONBOARD_CONSENT`.
Args: `parentId: str, name: str (1-40), grade: int (1-11)`. Returns: `{"studentId": str}`. Errors: `unauthorized`, `parent not found`, `bad name`, `bad grade`.
`name` хранится как `students.displayName`: детские ПДн, см. «Противоречия».
```python
sid = c.mutation("students:create", {"botSecret": BOT_SECRET, "parentId": parent, "name": "Madina", "grade": 5})["studentId"]
```

### 4. `linkCode:create` (mutation)
Код 8 символов из `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, живёт 24 ч, одноразовый; `url = {PUBLIC_APP_URL}/c/{code}`. Родитель открывает ссылку на устройстве ребёнка (или ребёнок вводит код на главной) — веб вызывает `linkCode:claim({code})` и получает детскую сессию. Боту `claim` не нужен.
Args: `studentId: str`. Returns: `{"code","url"}`. Errors: `unauthorized`, `student not found`, `PUBLIC_APP_URL is not set`.
```python
lc = c.mutation("linkCode:create", {"botSecret": BOT_SECRET, "studentId": sid})   # lc["url"] и lc["code"] родителю
```
`linkCode:redeem` (второй родитель по коду, `/start <code>`) **удалён 18.11**: код теперь открывает сессию ребёнка, а не делает его владельца родителем (BLOCKERS B10). Кнопка «Новый код» = ещё один `linkCode:create`.

### 5. `outbox:listUnsent`, `outbox:markSent`
Очередь сообщений родителю. `listUnsent` (query) — неотправленные, старые первыми, `limit` 1-100. `markSent` (mutation) — идемпотентно.
Returns: `[{"id","chatId","kind": "taught_bobr"|"crisis","text","createdAt"}]` / `None`.
Писатели (в коде, не для бота): `conductor.setCrisis` (SELF_HARM — срочный текст, GROOMING — мягкий, ABUSE_HOME — ничего; без цитат ребёнка) и `internal.outbox.notifyTaughtBobr({studentId, topic})`. Сообщение получает каждый привязанный родитель, у которого есть `chatId`. `notifyTaughtBobr` экспортирован, но **пока нигде не вызывается**: перехода темы в `taught_bobr` в коде нет (этап TEACH_BOBR). Тот, кто его пишет, зовёт `await enqueueTaughtBobr(ctx, studentId, topic)` из `convex/outbox.ts` прямо в своей мутации.

Цикл бота:
```python
import asyncio
async def outbox_loop(bot):
    while True:
        try:
            for m in c.query("outbox:listUnsent", {"botSecret": BOT_SECRET, "limit": 20}):
                await bot.send_message(int(m["chatId"]), m["text"])   # сначала отправили
                c.mutation("outbox:markSent", {"botSecret": BOT_SECRET, "id": m["id"]})  # потом пометили
        except Exception:
            pass   # не логировать тексты и chatId; следующий круг повторит (at-least-once)
        await asyncio.sleep(3)
```
Доставка at-least-once: упал между `send` и `markSent` — сообщение уйдёт повторно. Для кризиса это допустимо.

### 6. `parentLogin:parentLogin` (action, без botSecret)
Mini App шлёт `initData`. Секрет ключа: `HMAC_SHA256(key="WebAppData", msg=bot_token)`, хэш: `HMAC_SHA256(secret, data_check_string)`, поля без `hash`, отсортированы, constant-time, `auth_date` ≤ 24 ч. Родитель ищется по `user.id`; не найден (не делал `/start`) → `unauthorized`.
Args: `initData: str`. Returns: `{"sessionToken": str}`. Errors: `unauthorized`.

```js
// Mini App (client component)
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
const login = useAction(api.parentLogin.parentLogin);
const [sessionToken, setToken] = useState<string | null>(null);
useEffect(() => {
  window.Telegram.WebApp.ready();
  login({ initData: window.Telegram.WebApp.initData }).then((r) => setToken(r.sessionToken));
}, [login]);
const data = useQuery(api.parent.dashboard, sessionToken ? { sessionToken } : "skip");
```
Токен держать в памяти (state), не в `localStorage`: при каждом открытии Mini App `initData` свежий. Ошибка `unauthorized` из `useQuery` бросается в рендер: оберни в error boundary и покажи «откройте через бота».

### 7. `parent:dashboard` (query, `sessionToken`)
Только сводка. Названия тем на языке родителя (из `content/graph.json`).
```
{ parent: {firstName, lang, goal, testDate},                 // null, если не задано
  children: [{ displayName,      // без studentId: он открывает ребёнку turn/lesson (child-auth нет, B9); ребёнок — по индексу в массиве
    mahalla: [{topic, title, state}]    // все N1..N10; state: empty|scaffold|built|alive|dimmed (houseState от topicStatus)
    topics:  [{topic, title, level}]    // только темы со статусом: gap|solved_self|taught_bobr
    plan:    {order: [topic], days: [{date, items: [{topic, kind: "new"|"review"|"mixed_check"}]}]}
    week:    {solvedSelf, taughtBobr, newTopics: [{topic, title}], lastActive: ms|null} }] }  // окно 7 дней
```
План: строка `plans` (если есть, сейчас её никто не пишет), иначе `buildPlan` на лету с целью N9, сегодня по Asia/Tashkent и `testDate` родителя. Ошибки: `unauthorized`. Запрос читает `Date.now()` (срок сессии, «дом гаснет»): осознанное отступление от правила «не читать часы в query».

`children[].learningSupport` содержит последние учебные сессии по темам, состояние помощи, счётчики и до 20 событий с тегами заблуждений. `children[].week.socratic` содержит наблюдаемые результаты за последние семь дней. При отсутствии наблюдений либо полной сводки значения счётчиков не подменяются нулями. Родитель по-прежнему видит только сводку для связанных детей.

### 8. Демо: `demo:reset` + `scripts/demo-reset.sh`
`bash scripts/demo-reset.sh` стирает демо-родителя (`telegramUserId = "demo-parent"`, не числовой, поэтому из Telegram под ним не войти) и его ребёнка, затем создаёт заново: родитель ru, согласие, цель `test_soon`, `testDate` +3 дня; ребёнок `Demo`, 5 класс, привязан, состояние `HOME`.
Стартовые темы (выбрано: состояние после диагностики демо-пути, чтобы на экране родителя сразу был план N8→N6→N5→N9): N1, N2 `solved_self`; N5, N6, N8, N9 `gap`. Вау-момент: N8 переходит в `taught_bobr`, дом оживает. Печатает JSON `{parentId, studentId, linkCode, sessionToken}`: токен подставляется в Mini App вместо `parentLogin` для прогона без Telegram. Функция `internal`, из клиентов недоступна.

## Схема (что добавлено)

`students`: `displayName?`, `grade?`. `parents`: `telegramUserId?` (+ индекс `by_telegram_user`), `firstName?`, `consent?`, `goal?`, `testDate?`. Новые таблицы: `parentLinks` (родитель↔ребёнок, многие-ко-многим), `linkCodes`, `outbox`, `parentSessions`. Поля `parents.linkCode` и `parents.longGoal` больше не используются (оставлены, чтобы не ломать данные).

## Противоречия

1. **Имя ребёнка.** Правило проекта: «ПДн маскируются до LLM и до БД; у `students` нет поля имени». Владелец просит `name`. Сделано: хранится только как `students.displayName`, читают его `parent.dashboard`, `linkCode.redeem` и тексты outbox («Madina научил(а) Bobr…»). Не должно попадать в промпты, `turns`, `llmCache`, логи: `tests/displayNameGuard.test.ts` падает, если `displayName` появится в `convex/turn.ts`, `conductor.ts`, `lesson*.ts`, `llmCache.ts`, `debug.ts`, `lib/llm`, `lib/safety`. Тест ловит только эти файлы: новый модуль на пути хода ребёнка надо добавить в его список. Решение о допустимости имени в БД остаётся за владельцем и жюри.
2. **Имя в тексте родителю.** Текст `taught_bobr` содержит имя ребёнка и лежит в `outbox` (хранится, пока строку не удалят: чистки нет).
3. **`Date.now()` в `parent.dashboard`**: см. п. 7.

## Допущения для сверки с SPEC_SYSTEM

(`docs/specs/SPEC_SYSTEM.md` и `SPEC_PARENT_BOT.md` в репозитории пока нет.)

- Родитель↔ребёнок многие-ко-многим через `parentLinks`; `students.parentId` — тот, кто создал.
- `students.consent` (экран раскрытия ИИ у ребёнка) не равно `parents.consent`; `students:create` ставит `consent: false`.
- Коды привязки: 8 символов, 24 ч, одноразовые, регистр не важен; код создаёт бот по запросу, а не при `students:create`.
- Цель плана для родителя: N9 (зашита в `convex/parent.ts`, `PLAN_TARGETS`).
- «Неделя» = последние 7 дней по `solvedSelfAt`/`taughtAt`; `newTopics` — темы, у которых одно из них попало в окно.
- Кризис: SELF_HARM — срочный текст, GROOMING — мягкий текст, ABUSE_HOME — родителю ничего. Тексты в `lib/telegram/texts.ts`; uz и заглушка кризиса помечены `TODO: вычитка носителем`.
- Токены сессий лежат в БД открытым текстом (хранить хэш, если БД станет доступна кому-то кроме владельца).
- `outbox` не чистится; `sentAt` ставится бот-ом. Крон очистки старых отправленных не сделан.
- Стартовое состояние демо: см. п. 8.
