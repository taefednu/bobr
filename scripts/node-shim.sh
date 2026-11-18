#!/usr/bin/env bash
# postinstall: шим node_modules/.bin/node → Node 22 из .nvmrc. npx ставит node_modules/.bin первым в PATH, поэтому
# convex, запущенный из чужих хуков на системном Node 20 (stop-хук плагина Convex), идёт на 22. Нет Node 22 — молча выходим.
set -u
cd "$(dirname "$0")/.."
want=$(tr -d 'v \n' < .nvmrc 2>/dev/null || echo 22)
bin=$(ls -d "$HOME"/.nvm/versions/node/v"$want"*/bin/node 2>/dev/null | tail -1)
[ -n "$bin" ] && [ -d node_modules/.bin ] || exit 0
printf '#!/bin/sh\nexec %s "$@"\n' "$bin" > node_modules/.bin/node && chmod +x node_modules/.bin/node
