# Трек A — ядро урока, безопасность, схема, этап 3, этап 4, фронт ребёнка

**Владелец трека:** Taef. Агент этого трека — единственный, кто правит `convex/schema.ts`, `lib/types.ts`, `lib/config.ts`.

## Зона (правит только этот трек)
- Ядро: `convex/schema.ts`, `convex/conductor.ts`, `convex/turn.ts`, `convex/lesson*.ts`, `convex/llmCache.ts`,
  `lib/fractions/**`, `lib/safety/**`, `lib/llm/**` (кроме промптов треков B/C), `lib/text/**`, `lib/types.ts`, `lib/config.ts`
- Этап 3: `app/(child)/{goal,diagnose,mahalla,lesson}/**`, `app/parent/**` (веб-экран родителя), новые
  `convex/{diagnose,plan,parent}.ts`, `lib/llm/prompts/goal.ts`, `lib/planner/**`, `lib/houses/**`
- Этап 4 «Научи Bobr»: `app/(child)/teach/**`, новые `convex/teach.ts`, `lib/llm/prompts/{judge,bobr}.ts`, `public/bobr/**`;
  потом болталка `app/(child)/chat/**`, `convex/chat.ts`
- API для Telegram-треков: `convex/{parents,students,linkCode,outbox,parent,parentAuth,demo}.ts`, `docs/specs/API_FOR_BOT.md`
- Фронт ребёнка: `DESIGN.md`, `PRODUCT.md`, `app/globals.css`, `lib/motion.ts`, `components/ui/**`, `components/skeleton/**`, `app/dev/**`

## Состояние (18.11)
Этапы 0–2 готовы, ход урока живой. Задержка 4–6 с — пока не трогаем (решение владельца).

## Дальше
1. API для бота и Mini App — `docs/specs/API_FOR_BOT.md` (в работе / см. sprint).
2. Этап 3: GOAL (кнопки) → DIAGNOSE (`DEMO_PROBES`: N9 → N8 → N2 → N5 → N6 → N1) → PLAN (`buildPlan`) →
   махалля (`houseState`) → `/parent` через `useQuery`. Критерий: демо-путь → план N8 → N6 → N5 → N9.
3. Этап 4 «Научи Bobr»: TEACH_BOBR → copyCheck → judge (цитаты — подстроки, проверяет код) → BOBR_ATTEMPT
   (ответ подставляет код) | BOBR_QUESTION (≤ 3 круга) → taught_bobr → дом alive + пуш родителю (outbox).
4. Фронт ребёнка по DESIGN v1 — после ок владельца на `docs/design/v1/`.
5. Демо-инфраструктура (Vercel + Convex prod, QR, replay офлайн, `docs/DEMO_RUNBOOK.md`) — пока ничья, A.
6. Разбор `SCHEMA_REQUESTS.md` в начале каждой сессии.

## Связанные узлы
[[README]] · [[sprint]] · [[decisions]] · [[structure]]
