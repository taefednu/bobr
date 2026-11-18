#!/usr/bin/env bash
# Сброс демо-стенда на ЛОКАЛЬНОМ Convex: демо-родитель + ребёнок + код привязки + токен Mini App. Печатает их JSON.
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/node22.sh
export CONVEX_AGENT_MODE=anonymous
exec npx convex run demo:reset '{}'
