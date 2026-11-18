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

- **`cmd | tail && git commit`** — код выхода берётся у `tail`, коммит проходит при красном verify (18.11, этап 0). Гнать verify отдельной командой без пайпа и смотреть её код (`${PIPESTATUS[0]}` в zsh пуст — там `$pipestatus[1]`).

- **Stop-хук плагина `convex@claude-plugins-official`** запускает `node_modules/.bin/convex` напрямую на системном Node 20 («Node too old»). Шим `node` в `.bin` не помогает (там не `npx`); `scripts/node-shim.sh` (postinstall) заменяет сам `.bin/convex` обёрткой на Node из `.nvmrc`.

- **`codex exec` из фоновой команды** висит на «Reading additional input from stdin»: всегда `</dev/null`.
- **`pkill -f` и `pgrep -f` по шаблону** ловят собственную оболочку, если шаблон есть в команде: убивай по PID.

## Связанные узлы
[[README]] · [[structure]] · [[decisions]]
