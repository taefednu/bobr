# Bobr

ИИ-репетитор по дробям для детей 11–12 лет (uz-Latn и ru). Спека — `docs/BOBR_SPEC.md`.

## Старт после клона

```bash
nvm install 22 && nvm use 22          # Convex требует Node ≥ 22
npm install
npm run dev:convex                     # терминал 1: локальный Convex (без аккаунта), :3210
bash scripts/set-anthropic-key.sh      # терминал 2: свой ключ Anthropic в env Convex (один раз)
npm run dev                            # терминал 3: Next, http://localhost:3000/lesson
npm run verify                         # перед каждым пушем
```

Агенту: `CLAUDE.md` (§8 — правила работы втроём) → `knowledge/README.md` → свой трек в `knowledge/tracks/`.
