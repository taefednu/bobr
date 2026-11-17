#!/usr/bin/env bash
# Полная проверка перед «готово»: typecheck (Next + Convex), vitest, деплой функций в локальный Convex.
# Код выхода ≠ 0, если упал хоть один шаг; итог по каждому шагу печатается в конце.
set -uo pipefail
cd "$(dirname "$0")/.."
. scripts/node22.sh
fail=0; summary=()
step() { local name=$1; shift; echo "── $name"; if "$@"; then summary+=("PASS  $name"); else summary+=("FAIL  $name"); fail=1; fi; }
step "tsc (Next)"      npx tsc --noEmit
step "tsc (convex)"    npx tsc --noEmit -p convex
step "vitest"          npx vitest run
# CONVEX_AGENT_MODE=anonymous — локальный бэкенд без логина и без вопросов; </dev/null — не повиснуть на промпте.
step "convex dev --once" env CONVEX_AGENT_MODE=anonymous timeout 180 npx convex dev --once </dev/null
echo; printf '%s\n' "${summary[@]}"
exit $fail
