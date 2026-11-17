#!/usr/bin/env bash
# PostToolUse(Edit|Write|MultiEdit): после правки .ts/.tsx — tsc по проекту, показываем ошибки
# ТОЛЬКО в этом файле (чужие недописанные файлы посреди многофайловой правки не мешают).
# Ошибка → exit 2, Claude видит её и чинит сразу. Потолок 25 с, чтобы не держать работу.
set -uo pipefail
input=$(cat)
file=$(printf '%s' "$input" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)
case "$file" in *.ts|*.tsx) ;; *) exit 0 ;; esac
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
rel=${file#"$PWD"/}
case "$rel" in node_modules/*|.claude/*|.agents/*|convex/_generated/*|/*) exit 0 ;; esac
. scripts/node22.sh
if [[ $rel == convex/* ]]; then proj=convex; else proj=.; fi
out=$(timeout 25 npx tsc --noEmit -p "$proj" --pretty false 2>&1); code=$?
[ $code -eq 124 ] && { echo "typecheck-edited: tsc > 25 с, пропущено" >&2; exit 0; }
errs=$(printf '%s\n' "$out" | grep -F "$rel(" | head -20)
[ -z "$errs" ] && exit 0
{ echo "tsc: ошибки в $rel —"; echo "$errs"; } >&2
exit 2
