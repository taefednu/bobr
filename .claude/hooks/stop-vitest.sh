#!/usr/bin/env bash
# Stop: vitest только по тестам, связанным с изменёнными .ts (vitest related). Красное → exit 2,
# Claude не заканчивает ход с упавшими тестами. stop_hook_active=true (второй заход подряд) —
# пропускаем, чтобы не крутить петлю. Потолок 25 с.
set -uo pipefail
input=$(cat)
active=$(printf '%s' "$input" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("stop_hook_active", False))' 2>/dev/null)
[ "$active" = "True" ] && exit 0
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
changed=$( { git diff --name-only HEAD 2>/dev/null || git diff --name-only; git ls-files --others --exclude-standard; } \
  | grep -E '^(lib|convex|tests)/.*\.tsx?$' | grep -v '^convex/_generated/' | sort -u)
[ -z "$changed" ] && exit 0
. scripts/node22.sh
# shellcheck disable=SC2086
out=$(timeout 25 npx vitest related --run --passWithNoTests $changed 2>&1); code=$?
[ $code -eq 0 ] && exit 0
[ $code -eq 124 ] && { echo "stop-vitest: vitest > 25 с, пропущено — запусти npx vitest run сам" >&2; exit 0; }
{ echo "vitest related упал — почини до «готово»:"; printf '%s\n' "$out" | tail -30; } >&2
exit 2
