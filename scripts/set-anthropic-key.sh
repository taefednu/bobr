#!/usr/bin/env bash
# Ставит ANTHROPIC_API_KEY в окружение локального Convex (actions читают ключ оттуда, не из .env.local).
# Ключ вводится скрытно и не попадает в историю шелла. Нужен запущенный `npm run dev:convex`.
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/node22.sh
if ! (exec 3<>/dev/tcp/127.0.0.1/3210) 2>/dev/null; then
  echo "Convex не запущен: сначала в другом терминале  npm run dev:convex" >&2; exit 1
fi
read -rsp "Вставь ключ Anthropic (sk-ant-…) и нажми Enter: " key; echo
# Терминал оборачивает вставку в escape-коды bracketed paste (ESC[200~ … ESC[201~): вырезаем их,
# затем оставляем только символы, из которых состоит ключ.
key="$(printf '%s' "$key" | sed $'s/\e\[20[01]~//g; s/\e\[[0-9;]*[A-Za-z~]//g' | tr -cd 'A-Za-z0-9_-')"
if [[ ! "$key" =~ ^sk-ant-[A-Za-z0-9_-]{20,}$ ]]; then
  echo "Это не похоже на ключ Anthropic (sk-ant-…). Вставь ещё раз." >&2; exit 1
fi
echo "Ключ принят: ${#key} символов, начало ${key:0:10}…"
echo "Ставлю ключ в Convex…"
# Ключ идёт через stdin, не аргументом: аргументы видны всем в `ps`.
if ! printf '%s' "$key" | timeout 30 npx convex env set ANTHROPIC_API_KEY --force; then
  echo "Convex не ответил за 30 с. Перезапусти: Ctrl+C в терминале с npm run dev:convex, снова npm run dev:convex, потом этот скрипт." >&2; exit 1
fi
timeout 30 npx convex env list </dev/null
