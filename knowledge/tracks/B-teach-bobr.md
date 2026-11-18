# Трек B — «Научи Bobr» (этап 4), потом болталка

**Владелец трека:** Нуриддин.

## Задача (кикофф, этап 4)
TEACH_BOBR → copyCheck (`lib/safety/copyCheck.ts`, похоже на 6 последних реплик Ustoz > 0.6 → «Своими
словами?») → judge (Sonnet, схема `Judge` в `lib/types.ts`; цитата обязана быть подстрокой текста ребёнка —
проверяет код) → BOBR_ATTEMPT (ответ Bobr подставляет код, `BobrTurn.attempt` перезаписывается) или
BOBR_QUESTION (≤ 3 круга, затем микро-демонстрация, тема остаётся solved_self) → taught_bobr → дом alive
у ребёнка и на `/parent` в ту же секунду (главный вау-момент).
Потом (в порядке резки спеки режется раньше): болталка `/chat` — allowlist тем, 15 мин/сессия, 30 мин/день,
закрыта 21:00–07:00, CRISIS блокирует её на 24 ч.

## Зона (правит только этот трек)
- `app/(child)/teach/**`, `app/(child)/chat/**`
- новые `convex/teach.ts`, `convex/chat.ts`
- новые промпты `lib/llm/prompts/{judge,bobr,chat}.ts`
- `public/bobr/**` — позы idle, think, confused, happy, aha, proud, sad, wave (скилл `bobr-mascot`)

## Можно использовать, нельзя менять
`lib/llm` (`callStructured`, postChecks), `lib/safety` (preGuard, guard, outputCheck, CRISIS — «не режем
никогда»: весь вывод Bobr идёт через postChecks + outputCheck, как в `convex/turn.ts`), `lib/types`.
Переход уровня темы и дома делает код (mutation), не модель. Нужна схема → `SCHEMA_REQUESTS.md`.

## Связанные узлы
[[README]] · [[backlog]] · [[decisions]] · [[product]]
