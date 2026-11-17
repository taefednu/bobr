# Уроки (грабли, уже пойманные)

Одна строка — одна грабля, с тем, как ловится. Лучше тест/хук, чем строка.

- **Node 20 по умолчанию** — Convex падает «Node too old». Ловит: `scripts/node22.sh` в verify и dev:convex.
- **`convex dev --once` при запущенном `convex dev`** — «local backend still running». verify сам переходит на `codegen --typecheck`.
- **Офлайн Convex без `--local-backend-version`** — падает на «Failed to fetch latest backend version». См. `docs/DEMO_OFFLINE.md`.
- **`useReducedMotion` из framer роняет гидрацию**, если от флага зависит разметка. Брать `useMotion().reduced` (`lib/motion.ts`). Поймал `ui-check --reduced-motion`.
- **Tailwind 4 выкидывает неиспользуемые переменные темы** — SVG с `var(--color-…)` красится в ничто. Поэтому `@theme static`.
- **Tailwind сканирует всё дерево** — примеры скиллов тащат чужие классы. Поэтому `@import "tailwindcss" source(none)` + `@source`.
- **Playwright новее скачанного браузера** — «Executable doesn't exist». Закреплён 1.64.0.
- **`pkill -f <образец>` убивает свою же оболочку** (exit 144). Убивать по PID из `ss -ltnp`.
- **Скилл с тем же именем, что в `~/.claude/skills`**, грузится глобальный — поправки под Bobr только в `bobr-design`.
- **ESLint шаблона Convex смотрит только `convex/**`** — `app/` и `lib/` проверяет лишь tsc.

- **`cmd | tail && git commit`** — код выхода берётся у `tail`, коммит проходит при красном verify (18.11, этап 0). Проверять `${PIPESTATUS[0]}` или гнать verify отдельной командой.

## Связанные узлы
[[README]] · [[structure]] · [[decisions]]
