# Трек C — «Научи Bobr» и болталка (этап 4)

**Владелец трека:** Руслан (предварительно — владелец репо может переназначить).

## Задача (кикофф, этап 4)
TEACH_BOBR → copyCheck (`lib/safety/copyCheck.ts`) → judge (Sonnet, цитаты — подстроки текста ребёнка,
проверяет код) → BOBR_ATTEMPT (ответ подставляет код) или BOBR_QUESTION (≤ 3 круга) → TOPIC_DONE.
При taught_bobr дом оживает у ребёнка и на `/parent` в ту же секунду — главный вау-момент.
Потом (порядок резки спеки — режется раньше): болталка `/chat` (allowlist тем, лимиты, ночной замок).

## Зона (правит только этот трек)
- `app/(child)/teach/**`, `app/(child)/chat/**`
- новые `convex/teach.ts`, `convex/chat.ts`
- новые промпты `lib/llm/prompts/judge.ts`, `lib/llm/prompts/bobr.ts`, `lib/llm/prompts/chat.ts`
- `public/bobr/**` (позы: idle, think, confused, happy, aha, proud, sad, wave — скилл `bobr-mascot`)

## Можно использовать, нельзя менять
`lib/llm` (`callStructured`, `postChecks`), `lib/safety` (preGuard, guard, outputCheck, CRISIS), `lib/types`
(Judge, BobrTurn уже есть). Безопасность детей — «не режем никогда»: весь вывод Bobr идёт через
postChecks + outputCheck, как в `convex/turn.ts`. Нужна схема → `SCHEMA_REQUESTS.md`.

## Связанные узлы
[[README]] · [[backlog]] · [[decisions]] · [[product]]
