# Трек A · front — экраны ребёнка по DESIGN v1

**Кто:** Taef, сессия **front**. Папка `../bobr-front`, ветка `front`. В `main` попадает мержем core (12:00, 13:30).

## Зона (только эти пути)
`app/**` кроме `app/parent/**`, `components/**`, `lib/ui/**`, `public/**`, `i18n/*.json` (ключи экранов ребёнка).
Не трогает `convex/`, `lib/` (кроме `lib/ui/`), `DESIGN.md`. Нужна query/mutation/поле → `SCHEMA_REQUESTS.md` (core).

## Задача до 13:30
Экраны демо-шагов 1–5 красиво по DESIGN v1 (`docs/design/v1/`, скилл `bobr-design`, `components/ui/press-button.tsx`,
токены `app/globals.css`, движение `lib/motion.ts`): цель (Bobr спрашивает кнопками) → диагностика → план →
карта-махалля (10 домов, 2.5D, плоские крыши) → урок с живым Ustoz (Лепёшка / Полоска / Прямая уже рисуются серо).
Плашка ИИ видна везде. uz и ru сразу. `npm run ui-check -- <route>` + взгляд на PNG.

## Связанные узлы
[[A-core]] · [[A-teach]] · [[C-parent-miniapp]]
