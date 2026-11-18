# Трек C — Mini App родителя `/parent` (Next.js)

**Владелец трека:** второй участник (работает в Cursor; Нуриддин или Руслан — владелец уточнит).

## Задача
`/parent` как Telegram Mini App: при открытии взять `window.Telegram.WebApp.initData` → action
`parentAuth:parentLogin({initData})` → `sessionToken` → `useQuery(api.parent.dashboard, {sessionToken})`.
Экран: махалля ребёнка (10 домов, состояния empty/scaffold/built/alive/dimmed), темы, план «Мой путь» по
дням до контрольной, сводка недели. Вау-момент: дом оживает в ту же секунду, когда ребёнок научил Bobr
(живая подписка Convex — ничего опрашивать не надо). Только сводка, не переписка.
Контракт данных — `docs/specs/API_FOR_BOT.md` (раздел Mini App).

## Зона (правит только этот трек)
`app/parent/**`, `components/parent/**`, ключи i18n `parent.*` (uz и ru сразу; uz — `// TODO: вычитка носителем`).

## Правила
- Вид — по `DESIGN.md` v1 (скилл `bobr-design`), токены `app/globals.css`, движение `lib/motion.ts`;
  пока владелец не дал ок на v1 — серый функциональный.
- Плашка ИИ «Bobr — sunʼiy intellekt va xato qilishi mumkin» / «Bobr — ИИ и может ошибаться» видна всегда.
- Без проверенного `initData` данных нет (401). Токен не класть в URL.
- Нужны поля в `parent.dashboard` → заявка в `SCHEMA_REQUESTS.md` (трек A).

## Связанные узлы
[[README]] · [[B-telegram-bot]] · [[A-lesson-core]] · [[decisions]]
