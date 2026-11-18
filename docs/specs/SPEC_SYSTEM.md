# ТЗ: как всё связано (Convex + веб + Telegram)

Читают все треки. Источник правды по связям между частями. Детали продукта — `docs/BOBR_SPEC.md`.

## 1. Части системы

```
 Ребёнок (браузер/PWA)         Родитель (Telegram)
   Next.js: /, /lesson,          @BobrAgentBot  ──┐
   /mahalla, /teach, /chat       Mini App = тот же│Next.js, страница /parent
          │  useQuery/useMutation/useAction       │  useQuery (по сессии родителя)
          ▼                                        ▼
 ┌──────────────────────── Convex ─────────────────────────┐
 │ таблицы · mutations (вся логика) · actions (Claude,       │
 │ Telegram) · httpAction /telegram (вебхук) · crons ·       │
 │ scheduler (outbox уведомлений)                            │
 └───────────────┬───────────────────────────┬──────────────┘
                 ▼                           ▼
          Claude API                  Telegram Bot API
```

**Один бэкенд — Convex.** ~~Отдельного сервера для бота нет: вебхук бота — это `httpAction` в Convex~~
**Решение 18.11 (см. `knowledge/decisions.md`):** на хакатон бот — отдельный процесс на Python (`bot/`, aiogram,
long polling), ходит в Convex через python-клиент по `docs/specs/API_FOR_BOT.md` и забирает outbox раз в 3 с.
Причина: локальный Convex недоступен Telegram для вебхука; Python — сильная сторона Нуриддина. §6 (вебхук) —
после хакатона.

## 2. Сущности (таблицы — меняет только трек A)

| Таблица | Ключевые поля | Кто пишет |
|---|---|---|
| `parents` | `telegramUserId`, `firstName`, `lang` (uz/ru), `consentAt`, `quietHours`, `notifyPrefs` | бот (C) |
| `students` | `parentId`, `name` (только имя), `grade`, `lang`, `goal` (`test_soon` / `improve` / `just_practice`), `testDate` (`YYYY-MM-DD`, только для `test_soon`) | бот (C), онбординг (A) |
| `linkCodes` | `code` (8 символов из `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, регистр при вводе не важен), `studentId`, `expiresAt`, `usedAt` | бот (C) |
| `sessions` | `token`, `kind` (child/parent), `ownerId`, `expiresAt` | A / C |
| `topicStatus` | `studentId`, `topicId`, `status` (unknown/gap/solved_self/taught_bobr), `taughtAt`, `lastReviewAt` | A, B |
| `bobrState` | `studentId`, `level`, `taughtCount`, `lastLines[]` (30 последних) | B |
| `outbox` | `type`, `studentId`, `parentId`, `payload`, `createdAt`, `sentAt`, `dedupeKey` | все (вставка), C (отправка) |
| `reviewQueue` | `studentId`, `category`, `createdAt` (без текста ребёнка) | A |
| `turns`, `llmCache`, `content`… | как в спеке | A |

## 3. Связывание родителя и ребёнка

1. Родитель в боте: `/start` → согласие → имя ребёнка → бот создаёт `students` и `linkCodes`.
2. Бот присылает родителю ссылку `{PUBLIC_APP_URL}/c/{code}` и сам код.
3. Родитель открывает ссылку на устройстве ребёнка (или ребёнок вводит код на главной).
4. Mutation `claimLinkCode({code})` → создаёт `sessions` (kind=child), токен в `localStorage` устройства. Код одноразовый, живёт 24 ч.
5. Ребёнку Telegram не нужен.

**Статус контракта (18.11).** Этот раздел и цели выше — целевой контракт. В `main` пока старое: `linkCode:create` отдаёт
ссылку `t.me`, `claimLinkCode` нет, `parents:setGoal` принимает `test_soon|homework|unknown`. Переводит сессия core;
`docs/specs/API_FOR_BOT.md` обновится вместе с кодом. Длина кода (8 символов) уже совпадает.

## 4. Авторизация

- **Ребёнок:** токен сессии из `localStorage`, передаётся в каждую query/mutation. Без токена — экран «введи код».
- **Родитель в Mini App:** клиент берёт `Telegram.WebApp.initData` → action `parentLogin` проверяет подпись HMAC-SHA256 ключом от `TELEGRAM_BOT_TOKEN` и `auth_date` (не старше 24 ч) → находит `parents` по `telegramUserId` → выдаёт токен `sessions` (kind=parent). Query `/parent` отдаёт данные только детей этого родителя.
- Никогда не доверять `telegramUserId`, пришедшему с клиента без проверки подписи.
- До чекпоинта допустимо: демо-родитель и демо-ребёнок, засеянные `scripts/demo-reset`.

## 5. Уведомления родителю: outbox

Любая часть системы, которой надо что-то сказать родителю, **не шлёт в Telegram сама**, а вставляет запись в `outbox` в той же mutation, где произошло событие:

```
mutation (например, judge → taught_bobr)
  → insert outbox {type:"taught_bobr", dedupeKey:"taught:<student>:<topic>"}
  → ctx.scheduler.runAfter(0, internal.telegram.flushOutbox)
action flushOutbox
  → берёт неотправленные, проверяет тихие часы и лимиты
  → fetch Bot API sendMessage
  → mutation markSent
```

Плюсы: событие и уведомление атомарны, повторов нет (dedupeKey), бот можно отключить без поломки урока.

| type | Когда | Тихие часы (21:00–08:00) | Лимит |
|---|---|---|---|
| `taught_bobr` | тема получила taught_bobr | ждёт до 08:00 | без лимита, но склеивать, если >1 за 10 мин |
| `daily_summary` | крон 19:00 Asia/Tashkent, если был урок | — | 1 в день |
| `forgotten` | тема стала dimmed | ждёт | не чаще 1 в неделю |
| `crisis_self_harm` | guard → SELF_HARM | **шлётся сразу** | без лимита |
| `crisis_grooming` | guard → GROOMING | **шлётся сразу** | без лимита |
| — | ABUSE_HOME | **никогда не шлётся родителю**, только `reviewQueue` | — |

Текст кризисных уведомлений — фиксированный шаблон из `content/crisis.json` (родительская часть), **без цитат ребёнка**.

## 6. Вебхук бота

- URL: `https://<deployment>.convex.site/telegram`.
- Регистрация: `setWebhook` с `secret_token`; httpAction проверяет заголовок `X-Telegram-Bot-Api-Secret-Token`, иначе 401.
- httpAction быстро отвечает 200 и передаёт апдейт в mutation/action (не держать запрос > 2 с).
- Идемпотентность по `update_id`.

## 7. Окружения и боты

- **У одного бота может быть только один вебхук.** Поэтому: прод/демо-бот `@BobrAgentBot` смотрит на prod deployment. У каждого разработчика свой тестовый бот (`@BobrDev<имя>Bot` через @BotFather) на свой dev deployment.
- Env в Convex: `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `PUBLIC_APP_URL`, `DEMO_MODE`.
- Токены — только через `npx convex env set`, никогда в код, коммиты, чаты.

## 8. Демо

- `scripts/demo-reset`: демо-родитель (привязан к Telegram-аккаунту докладчика), демо-ребёнок, все темы в исходном состоянии под демо-путь.
- На сцене: ноутбук — урок ребёнка; телефон докладчика — Mini App родителя; жюри — QR на бота.
- Главный момент: судья → `taught_bobr` → дом оживает у ребёнка (useQuery) и в Mini App (useQuery) одновременно + приходит сообщение в Telegram (outbox).
