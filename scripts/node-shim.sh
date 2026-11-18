#!/usr/bin/env bash
# postinstall: node_modules/.bin/convex → обёртка на Node из .nvmrc. Stop-хук плагина Convex запускает этот бинарник
# напрямую на системном Node 20, а Convex требует ≥ 22. Нет нужного Node или пакета — молча выходим.
set -u
cd "$(dirname "$0")/.."
want=$(tr -d 'v \n' < .nvmrc 2>/dev/null || echo 22)
bin=$(ls -d "$HOME"/.nvm/versions/node/v"$want"*/bin/node 2>/dev/null | tail -1)
main="$PWD/node_modules/convex/bin/main.js"
[ -n "$bin" ] && [ -f "$main" ] && [ -d node_modules/.bin ] || exit 0
rm -f node_modules/.bin/node
tmp=$(mktemp node_modules/.bin/.convex.XXXXXX)
printf '#!/bin/sh\nexec %s %s "$@"\n' "$bin" "$main" > "$tmp" && chmod +x "$tmp" && mv -f "$tmp" node_modules/.bin/convex
