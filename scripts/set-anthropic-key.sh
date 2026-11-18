#!/usr/bin/env bash
# Ставит ANTHROPIC_API_KEY в окружение локального Convex (actions читают ключ оттуда, не из .env.local).
# Нужен запущенный `npm run dev:convex`. Ключ идёт через stdin, не аргументом (аргументы видны в ps).
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/node22.sh
(exec 3<>/dev/tcp/127.0.0.1/3210) 2>/dev/null || { echo "Convex не запущен: сначала  npm run dev:convex" >&2; exit 1; }
read -rsp "Вставь ключ Anthropic и нажми Enter: " key; echo
# Терминал оборачивает вставку в ESC[200~ … ESC[201~ — вырезаем, потом оставляем только символы ключа.
esc=$'\e'
key="${key//${esc}\[200~/}"; key="${key//${esc}\[201~/}"
key="$(printf '%s' "$key" | tr -cd 'A-Za-z0-9_-')"
[[ "$key" =~ ^sk-ant-[A-Za-z0-9_-]{20,}$ ]] || { echo "Не похоже на ключ (sk-ant-…). Вставь ещё раз." >&2; exit 1; }
echo "Ключ принят: ${#key} символов. Ставлю…"
printf '%s' "$key" | timeout 30 npx convex env set ANTHROPIC_API_KEY --force </dev/stdin \
  || { echo "Convex не ответил за 30 с — перезапусти npm run dev:convex и повтори." >&2; exit 1; }
echo "Готово."
