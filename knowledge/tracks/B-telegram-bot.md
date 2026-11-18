# Трек B — Telegram-бот родителя (Python)

**Владелец трека:** Нуриддин (сначала бот, потом кабинет [[C-parent-miniapp]]). Уже стартовал по `docs/specs/API_FOR_BOT.md`.

## Задача
Бот в папке `bot/` репозитория: **aiogram** + официальный Python-клиент **convex**, long polling.
- `/start` (в т. ч. `/start <code>` по ссылке привязки) → экран согласия (что видит родитель: сводку, не
  переписку) → `parents:setConsent` → цель (`parents:setGoal`: скоро контрольная / домашка / не знаю + дата).
- Создание ребёнка и ссылки привязки: `students:create` → `linkCode:create` → `{code, url}`.
- Кнопка «Открыть кабинет» — Mini App `/parent` (трек C).
- Каждые 3 с: `outbox:listUnsent` → отправить → `outbox:markSent`. Виды: «научил(а) Bobr …», кризис (срочно,
  без цитат). Текст сообщений готовит Convex — бот не пишет свой текст про ребёнка.
Все вызовы и примеры — `docs/specs/API_FOR_BOT.md`.

## Зона (правит только этот трек)
`bot/**` (свой `requirements.txt`/`pyproject.toml`, свой README). Ничего вне `bot/`.

## Правила
- `BOT_SECRET`, `TELEGRAM_BOT_TOKEN` — только в env (Convex env и локальный `.env` бота, который в `.gitignore`).
- Никаких логов с текстами о ребёнке (ПДн). Ошибка API — повтор позже, не падение бота.
- Нужна новая функция/поле в Convex → заявка в `SCHEMA_REQUESTS.md` (трек A).

## Связанные узлы
[[README]] · [[C-parent-miniapp]] · [[A-core]] · [[decisions]]
