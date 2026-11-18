# Трек A · core — ядро, схема, этап 3, мерж веток

**Кто:** Taef, сессия **core**. Папка `bobr`, ветка `main`.

## Зона
- Только эта сессия меняет `convex/schema.ts`, `lib/types.ts`, `lib/config.ts` и выполняет `SCHEMA_REQUESTS.md`
  (заявки пишут front, teach и Нуриддин).
- Этап 3 (бэкенд): цель → диагностика (адаптивная; 6 проб `DEMO_PROBES` — только `DEMO_MODE=script`) → план (`buildPlan`) → данные махалли (`houseState`)
  — новые `convex/{goal,diagnose,plan,mahalla}.ts`, `lib/planner/**`, `lib/houses/**`.
- Ядро урока и безопасность: `convex/{turn,conductor,lesson*,llmCache}.ts`, `lib/{fractions,safety,llm,text}/**`.
- API для Telegram: `convex/{parents,students,linkCode,outbox,parent,parentLogin,botAuth,demo}.ts`, `docs/specs/API_FOR_BOT.md`.
- Вход ребёнка по коду (`claimLinkCode` → сессия child, SPEC_SYSTEM §3–4) — закрывает IDOR (B9).
- **Мерж:** `front` и `teach` → `main` в **12:00** и **13:30** (`git merge`, verify, `/demo-path`, push).

## Связанные узлы
[[A-front]] · [[A-teach]] · [[B-telegram-bot]] · [[sprint]] · [[decisions]]
