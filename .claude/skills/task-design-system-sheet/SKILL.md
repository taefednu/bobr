---
name: task-design-system-sheet
description: "Show the Bobr design system as one living page (/dev/styleguide) instead of pictures: tokens from code, components in every state, contested parameters as toggles. Trigger: 'show the design', 'make refs', palette/font/component decisions before building screens."
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Лист дизайн-системы

Живой лист — `app/dev/styleguide/` (только dev, в проде 404). Картинка врёт цветом и шрифтом и не даёт ни
одного токена; лист — тот же код, что продукт.

## Шаги

1. **Токены — из `app/globals.css`, под теми же именами**, не хексы на глаз. Новый токен сначала в
   `globals.css` и `DESIGN.md`, потом на лист.
2. **Листы, а не экраны:** цвет · типографика (uz с `oʻ gʻ` и ru) · тени и радиусы · кнопки во всех
   состояниях · поле ответа · лепёшка / полоска / прямая · дома в 5 состояниях · персонаж (idle) ·
   пустое, загрузка, ошибка, CRISIS-оверлей.
3. **Типографика — модульная шкала** из `DESIGN.md` (×1.25); размеров вне таблицы нет.
4. **Каждое состояние показать, а не описать.** «Нет данных» — отдельной плиткой, иначе в коде станет нулём.
5. **Спорный параметр — переключателем** (`data-*` на контейнере + пара переменных), а не вопросом словами.
6. **Назвать вслух, чего за листом нет в бэкенде** — нарисованное без данных это обещание.

## Проверка и показ

```bash
npm run ui-check -- /dev/styleguide --full
npm run ui-check -- /dev/styleguide --lang ru --viewports phone-sm --reduced-motion
```

Код 0, PNG открыть глазами. Владельцу — SendUserFile с PNG (desktop и phone) и одной строкой, что решить.

## Частые ошибки

- Хексы на глаз — красиво, в продукт не переносится.
- Цвет — единственный признак состояния. Нужны форма/значок и подпись.
- Переменная темы не попала в CSS: Tailwind 4 выкидывает неиспользуемые — поэтому `@theme static`.
