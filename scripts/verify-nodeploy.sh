#!/usr/bin/env bash
# Проверка для сессий front и teach (git worktree): tsc ×2 + vitest, БЕЗ convex dev/codegen.
# Причина: все сессии ходят в один локальный Convex на :3210 — deploy из ветки перезапишет функции core.
# Полный `npm run verify` (с пушем функций) гоняет только core, после мержа.
set -uo pipefail
cd "$(dirname "$0")/.."
. scripts/node22.sh
fail=0; summary=()
step() { local name=$1; shift; echo "── $name"; if "$@"; then summary+=("PASS  $name"); else summary+=("FAIL  $name"); fail=1; fi; }
step "tsc (Next)"   npx tsc --noEmit
step "tsc (convex)" npx tsc --noEmit -p convex
step "vitest"       npx vitest run
echo; printf '%s\n' "${summary[@]}"
exit $fail
