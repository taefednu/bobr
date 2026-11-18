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
key="$(printf '%s' "$key" | tr -d '[:space:]')"
case "$key" in sk-ant-*) ;; *) echo "Это не похоже на ключ Anthropic (должен начинаться с sk-ant-)" >&2; exit 1;; esac
echo "Ставлю ключ в Convex…"
# Ключ идёт через stdin, не аргументом: аргументы видны всем в `ps`.
if ! printf '%s' "$key" | timeout 30 npx convex env set ANTHROPIC_API_KEY --force; then
  echo "Convex не ответил за 30 с. Перезапусти: Ctrl+C в терминале с npm run dev:convex, снова npm run dev:convex, потом этот скрипт." >&2; exit 1
fi
timeout 30 npx convex env list </dev/null
