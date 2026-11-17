---
name: task-color-sweep
description: "Replace hardcoded colors (hex, rgb(), Tailwind arbitrary colors) in Bobr components with design tokens from app/globals.css. Use when a component has a literal color, before showing a screen, or when changing the palette."
allowed-tools:
  - Bash
  - Grep
  - Read
  - Edit
---

# Свип цвета

Цвет — только токен из `app/globals.css` (`--color-*`, классы `bg-lazuli`, `text-ink`…). Литерал в
компоненте не переживёт смену палитры v0 → v1, а она будет: владелец ещё не утвердил `DESIGN.md`.

## Найти

```bash
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(' app components lib --include=*.tsx --include=*.ts \
  | grep -v 'app/globals.css' | grep -v 'app/dev/styleguide'
grep -rnE '(bg|text|border|fill|stroke|from|to|via|ring|shadow)-\[(#|rgb|oklch)' app components --include=*.tsx
```

## Заменить

| Было | Стало |
|---|---|
| `text-[#352118]` | `text-ink` |
| `style={{ color: "#1868a0" }}` | `style={{ color: "var(--color-lazuli)" }}` |
| `fill="#cf8f43"` в SVG | `fill="var(--color-non)"` (атрибуты SVG читают `var()`) |
| тень `rgba(0,0,0,.2)` | `shadow-rest` / `var(--shadow-lift)` |
| полупрозрачный токен | `color-mix(in oklch, var(--color-lazuli) 30%, transparent)` |

Нет подходящего токена — добавь в `globals.css` (`@theme static`) и `DESIGN.md` с именем по смыслу, не по цвету.

## Проверка

Оба grep выше пустые (кроме `globals.css` и `/dev/styleguide`), `npm run ui-check -- /route` — код 0,
снимок до/после совпадает.
