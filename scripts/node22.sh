# Source me: ставит Node из .nvmrc (Convex требует Node ≥ 22, а системный default может быть 20).
# Не меняет глобальный default nvm — только PATH текущего процесса.
if ! node -e 'process.exit(+process.versions.node.split(".")[0] >= 22 ? 0 : 1)' 2>/dev/null; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" --no-use && nvm use --silent >/dev/null 2>&1
fi
