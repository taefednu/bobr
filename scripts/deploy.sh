#!/usr/bin/env bash
# Выкатка из закоммиченного кода: сам скрипт ничего не коммитит. Порядок и выбор хостинга: docs/DEPLOY.md.
# bash scripts/deploy.sh check | convex | server | vercel
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/node22.sh

die() { echo "deploy: $*" >&2; exit 1; }
[ -f .env.production ] || die "нет .env.production, скопируй .env.production.example"
set -a; . ./.env.production; set +a

need() { for name in "$@"; do [ -n "${!name:-}" ] || die "не задано $name"; done; }
clean() { [ -z "$(git status --porcelain --untracked-files=no)" ] || die "есть незакоммиченные правки"; }

case "${1:-}" in
  check)
    clean
    npm run verify
    ;;
  convex)
    clean
    need CONVEX_DEPLOY_KEY ANTHROPIC_API_KEY BOT_SECRET TELEGRAM_BOT_TOKEN TELEGRAM_BOT_USERNAME PUBLIC_APP_URL
    values=$(mktemp); trap 'rm -f "$values"' EXIT; chmod 600 "$values"
    for name in ANTHROPIC_API_KEY BOT_SECRET TELEGRAM_BOT_TOKEN TELEGRAM_BOT_USERNAME PUBLIC_APP_URL DEMO_MODE DEMO_ALLOW_ANON; do
      [ -z "${!name:-}" ] || printf '%s=%s\n' "$name" "${!name}" >> "$values"
    done
    npx convex deploy
    npx convex env set --from-file "$values" --force
    ;;
  server)
    clean
    need NEXT_PUBLIC_CONVEX_URL DOMAIN TELEGRAM_BOT_TOKEN BOT_SECRET PUBLIC_APP_URL
    docker compose --env-file .env.production up -d --build
    ;;
  vercel)
    clean
    need VERCEL_TOKEN NEXT_PUBLIC_CONVEX_URL
    npx --yes vercel@latest deploy --prod --yes \
      --build-env "NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL" --env "NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL"
    ;;
  *) die "укажи check, convex, server или vercel" ;;
esac
